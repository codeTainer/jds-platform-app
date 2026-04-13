<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\User;
use App\Support\AuditLogger;
use App\Support\MemberAccountProvisioner;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ExcoMemberController extends Controller
{
    public function __construct(
        private readonly MemberAccountProvisioner $memberAccountProvisioner,
        private readonly AuditLogger $auditLogger
    ) {
    }

    public function index(Request $request)
    {
        $members = Member::query()
            ->with('user')
            ->withCount(['sharePurchases', 'loans', 'concerns'])
            ->withSum('sharePurchases', 'shares_count')
            ->withSum('sharePurchases', 'total_amount')
            ->when($request->filled('role'), function ($query) use ($request) {
                $role = trim((string) $request->string('role'));

                $query->whereHas('user', fn ($userQuery) => $userQuery->where('role', $role));
            })
            ->when($request->filled('status'), fn ($query) => $query->where('membership_status', $request->string('status')))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = trim((string) $request->string('search'));

                $query->where(function ($inner) use ($search) {
                    $inner->where('full_name', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%")
                        ->orWhere('phone_number', 'ilike', "%{$search}%")
                        ->orWhere('member_number', 'ilike', "%{$search}%");
                });
            })
            ->orderBy('full_name')
            ->paginate(min(max($request->integer('per_page', 10), 1), 100));

        return response()->json($members);
    }

    public function show(Member $member)
    {
        return response()->json(
            $member->load([
                'user',
                'membershipFees',
                'sharePurchases',
                'loans',
                'guaranteedLoans',
                'loanRepayments',
                'concerns',
                'exitRequests',
                'shareoutItems',
            ])->loadSum('sharePurchases', 'shares_count')
                ->loadSum('sharePurchases', 'total_amount')
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->memberRules());
        $this->ensureMemberNumberMatchesRole($data);

        $created = $this->memberAccountProvisioner->create($data);

        $this->auditLogger->log(
            $request->user(),
            'members.created',
            $created['member'],
            'Created member account for ' . $created['member']->full_name . '.',
            [
                'member_id' => $created['member']->id,
                'member_number' => $created['member']->member_number,
                'role' => $created['user']->role,
                'email' => $created['member']->email,
            ],
        );

        return response()->json([
            'message' => 'Member account created successfully. Temporary login details have been sent to the member email.',
            'member' => $created['member'],
        ], 201);
    }

    public function import(Request $request)
    {
        $data = $request->validate([
            'members' => ['required', 'array', 'min:1'],
            'members.*' => ['array'],
        ]);

        $imported = [];
        $failed = [];

        foreach ($data['members'] as $index => $row) {
            $normalizedRow = $this->normalizeImportedRow($row);
            $validator = Validator::make($normalizedRow, $this->memberRules());

            if ($validator->fails()) {
                $failed[] = [
                    'row' => $index + 1,
                    'email' => $normalizedRow['email'] ?? null,
                    'message' => $validator->errors()->first(),
                ];
                continue;
            }

            try {
                $validated = $validator->validated();
                $this->ensureMemberNumberMatchesRole($validated);
                $created = $this->memberAccountProvisioner->create($validated);
                $imported[] = $created['member'];
            } catch (\Throwable $exception) {
                $failed[] = [
                    'row' => $index + 1,
                    'email' => $normalizedRow['email'] ?? null,
                    'message' => $exception instanceof ValidationException
                        ? $exception->validator->errors()->first()
                        : $exception->getMessage(),
                ];
            }
        }

        $this->auditLogger->log(
            $request->user(),
            'members.imported',
            null,
            sprintf(
                'Imported %d member account(s); %d row(s) failed.',
                count($imported),
                count($failed)
            ),
            [
                'imported_count' => count($imported),
                'failed_count' => count($failed),
                'imported_member_numbers' => collect($imported)->pluck('member_number')->filter()->values()->all(),
            ],
        );

        return response()->json([
            'message' => sprintf(
                'Import completed. %d member(s) created, %d row(s) failed.',
                count($imported),
                count($failed)
            ),
            'imported_count' => count($imported),
            'failed_count' => count($failed),
            'imported' => $imported,
            'failed' => $failed,
        ]);
    }

    private function memberRules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:members,email', 'unique:users,email'],
            'phone_number' => ['required', 'string', 'max:20'],
            'joined_on' => ['nullable', 'date'],
            'membership_status' => ['nullable', Rule::in(['active', 'approved', 'inactive', 'pending_review'])],
            'has_online_banking' => ['nullable', 'boolean'],
            'whatsapp_active' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
            'role' => ['required', Rule::in([
                User::ROLE_CHAIRPERSON,
                User::ROLE_SECRETARY,
                User::ROLE_TREASURER,
                User::ROLE_SUPPORT,
                User::ROLE_MEMBER,
            ])],
            'member_number' => ['nullable', 'string', 'regex:/^JDS-(MEM|EXCO)-\d{4}$/', 'unique:members,member_number'],
        ];
    }

    private function normalizeImportedRow(array $row): array
    {
        $normalized = [];

        foreach ($row as $key => $value) {
            $normalizedKey = strtolower(trim(str_replace([' ', '-'], '_', (string) $key)));
            $normalized[$normalizedKey] = is_string($value) ? trim($value) : $value;
        }

        $role = $normalized['role'] ?? User::ROLE_MEMBER;
        $memberNumber = $normalized['member_number'] ?? null;
        $expectedPrefix = $role === User::ROLE_MEMBER ? 'JDS-MEM' : 'JDS-EXCO';

        if (is_string($memberNumber) && $memberNumber !== '') {
            $normalized['member_number'] = strtoupper($memberNumber);

            if (! str_starts_with($normalized['member_number'], $expectedPrefix . '-')) {
                $normalized['member_number'] = null;
            }
        }

        foreach (['has_online_banking', 'whatsapp_active'] as $booleanKey) {
            if (array_key_exists($booleanKey, $normalized)) {
                $normalized[$booleanKey] = filter_var($normalized[$booleanKey], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false;
            }
        }

        return Arr::only($normalized, [
            'full_name',
            'email',
            'phone_number',
            'joined_on',
            'membership_status',
            'has_online_banking',
            'whatsapp_active',
            'notes',
            'role',
            'member_number',
        ]);
    }

    private function ensureMemberNumberMatchesRole(array $data): void
    {
        if (empty($data['member_number'])) {
            return;
        }

        $expectedPrefix = ($data['role'] ?? User::ROLE_MEMBER) === User::ROLE_MEMBER
            ? 'JDS-MEM-'
            : 'JDS-EXCO-';

        if (! str_starts_with(strtoupper((string) $data['member_number']), $expectedPrefix)) {
            throw ValidationException::withMessages([
                'member_number' => 'The supplied member number does not match the selected role.',
            ]);
        }
    }
}
