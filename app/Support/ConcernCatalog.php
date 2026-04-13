<?php

namespace App\Support;

use App\Models\Concern;
use App\Models\Loan;
use App\Models\LoanRepaymentSubmission;
use App\Models\Member;
use App\Models\MembershipFee;
use App\Models\MembershipFeeSubmission;
use App\Models\SharePaymentSubmission;
use App\Models\SharePurchase;
use App\Models\ShareoutItem;
use Illuminate\Database\Eloquent\Model;

class ConcernCatalog
{
    /**
     * @var array<string, array{label: string, description: string, requires_record: bool, model: class-string<Model>|null}>
     */
    private const DEFINITIONS = [
        'account' => [
            'label' => 'Account / Profile',
            'description' => 'Issues with profile data, access, password, or member account setup.',
            'requires_record' => false,
            'model' => null,
        ],
        'share_payment_submission' => [
            'label' => 'Share Receipt Submission',
            'description' => 'Questions about a share receipt you uploaded for EXCO review.',
            'requires_record' => true,
            'model' => SharePaymentSubmission::class,
        ],
        'share_purchase' => [
            'label' => 'Share Purchase Record',
            'description' => 'Questions about a posted monthly share purchase record.',
            'requires_record' => true,
            'model' => SharePurchase::class,
        ],
        'membership_fee_submission' => [
            'label' => 'Membership Fee Receipt',
            'description' => 'Questions about a membership fee receipt you uploaded.',
            'requires_record' => true,
            'model' => MembershipFeeSubmission::class,
        ],
        'membership_fee' => [
            'label' => 'Membership Fee Record',
            'description' => 'Questions about a posted membership fee entry.',
            'requires_record' => true,
            'model' => MembershipFee::class,
        ],
        'loan' => [
            'label' => 'Loan Record',
            'description' => 'Questions about a loan request, approval, disbursement, or balance.',
            'requires_record' => true,
            'model' => Loan::class,
        ],
        'loan_repayment_submission' => [
            'label' => 'Loan Repayment Receipt',
            'description' => 'Questions about a repayment receipt awaiting EXCO review.',
            'requires_record' => true,
            'model' => LoanRepaymentSubmission::class,
        ],
        'shareout_item' => [
            'label' => 'Share-out Record',
            'description' => 'Questions about your yearly share-out calculation or payout.',
            'requires_record' => true,
            'model' => ShareoutItem::class,
        ],
    ];

    public function referenceGroupsForMember(Member $member): array
    {
        return [
            [
                'type' => 'account',
                'label' => self::DEFINITIONS['account']['label'],
                'description' => self::DEFINITIONS['account']['description'],
                'requires_record' => false,
                'options' => [],
            ],
            [
                'type' => 'share_payment_submission',
                'label' => self::DEFINITIONS['share_payment_submission']['label'],
                'description' => self::DEFINITIONS['share_payment_submission']['description'],
                'requires_record' => true,
                'options' => $member->sharePaymentSubmissions()
                    ->with('cycle')
                    ->latest('submitted_at')
                    ->limit(25)
                    ->get()
                    ->map(fn (SharePaymentSubmission $submission) => [
                        'id' => $submission->id,
                        'label' => 'Share receipt for '.$this->formatMonth($submission->share_month),
                        'subtitle' => sprintf(
                            '%s · %s shares · %s',
                            $submission->cycle?->code ?? 'No cycle',
                            $submission->shares_count,
                            $this->currency($submission->expected_amount)
                        ),
                    ])
                    ->values()
                    ->all(),
            ],
            [
                'type' => 'share_purchase',
                'label' => self::DEFINITIONS['share_purchase']['label'],
                'description' => self::DEFINITIONS['share_purchase']['description'],
                'requires_record' => true,
                'options' => $member->sharePurchases()
                    ->with('cycle')
                    ->latest('share_month')
                    ->limit(25)
                    ->get()
                    ->map(fn (SharePurchase $purchase) => [
                        'id' => $purchase->id,
                        'label' => 'Share purchase for '.$this->formatMonth($purchase->share_month),
                        'subtitle' => sprintf(
                            '%s · %s shares · %s',
                            $purchase->cycle?->code ?? 'No cycle',
                            $purchase->shares_count,
                            $this->currency($purchase->total_amount)
                        ),
                    ])
                    ->values()
                    ->all(),
            ],
            [
                'type' => 'membership_fee_submission',
                'label' => self::DEFINITIONS['membership_fee_submission']['label'],
                'description' => self::DEFINITIONS['membership_fee_submission']['description'],
                'requires_record' => true,
                'options' => $member->membershipFeeSubmissions()
                    ->with('cycle')
                    ->latest('submitted_at')
                    ->limit(25)
                    ->get()
                    ->map(fn (MembershipFeeSubmission $submission) => [
                        'id' => $submission->id,
                        'label' => 'Membership fee receipt ('.$this->humanize($submission->fee_type).')',
                        'subtitle' => sprintf(
                            '%s · %s',
                            $submission->cycle?->code ?? 'No cycle',
                            $this->currency($submission->expected_amount)
                        ),
                    ])
                    ->values()
                    ->all(),
            ],
            [
                'type' => 'membership_fee',
                'label' => self::DEFINITIONS['membership_fee']['label'],
                'description' => self::DEFINITIONS['membership_fee']['description'],
                'requires_record' => true,
                'options' => $member->membershipFees()
                    ->with('cycle')
                    ->latest('paid_at')
                    ->limit(25)
                    ->get()
                    ->map(fn (MembershipFee $fee) => [
                        'id' => $fee->id,
                        'label' => 'Membership fee record ('.$this->humanize($fee->fee_type).')',
                        'subtitle' => sprintf(
                            '%s · %s · %s',
                            $fee->cycle?->code ?? 'No cycle',
                            $this->currency($fee->amount),
                            $this->humanize($fee->status)
                        ),
                    ])
                    ->values()
                    ->all(),
            ],
            [
                'type' => 'loan',
                'label' => self::DEFINITIONS['loan']['label'],
                'description' => self::DEFINITIONS['loan']['description'],
                'requires_record' => true,
                'options' => $member->loans()
                    ->with('cycle')
                    ->latest('requested_at')
                    ->limit(25)
                    ->get()
                    ->map(fn (Loan $loan) => [
                        'id' => $loan->id,
                        'label' => 'Loan request of '.$this->currency($loan->requested_amount),
                        'subtitle' => sprintf(
                            '%s · %s',
                            $loan->cycle?->code ?? 'No cycle',
                            $this->humanize($loan->status)
                        ),
                    ])
                    ->values()
                    ->all(),
            ],
            [
                'type' => 'loan_repayment_submission',
                'label' => self::DEFINITIONS['loan_repayment_submission']['label'],
                'description' => self::DEFINITIONS['loan_repayment_submission']['description'],
                'requires_record' => true,
                'options' => $member->loanRepaymentSubmissions()
                    ->with('loan.cycle')
                    ->latest('submitted_at')
                    ->limit(25)
                    ->get()
                    ->map(fn (LoanRepaymentSubmission $submission) => [
                        'id' => $submission->id,
                        'label' => 'Repayment receipt for '.$this->currency($submission->amount_paid),
                        'subtitle' => sprintf(
                            'Loan #%s · %s',
                            $submission->loan_id,
                            $this->humanize($submission->status)
                        ),
                    ])
                    ->values()
                    ->all(),
            ],
            [
                'type' => 'shareout_item',
                'label' => self::DEFINITIONS['shareout_item']['label'],
                'description' => self::DEFINITIONS['shareout_item']['description'],
                'requires_record' => true,
                'options' => $member->shareoutItems()
                    ->with('run.cycle')
                    ->latest()
                    ->limit(25)
                    ->get()
                    ->map(fn (ShareoutItem $item) => [
                        'id' => $item->id,
                        'label' => 'Share-out payout of '.$this->currency($item->net_payout),
                        'subtitle' => sprintf(
                            '%s · %s',
                            $item->run?->cycle?->code ?? 'No cycle',
                            $this->humanize($item->status)
                        ),
                    ])
                    ->values()
                    ->all(),
            ],
        ];
    }

    public function modelClassForReferenceType(string $referenceType): ?string
    {
        return self::DEFINITIONS[$referenceType]['model'] ?? null;
    }

    public function labelForReferenceType(string $referenceType): string
    {
        return self::DEFINITIONS[$referenceType]['label'] ?? 'General';
    }

    public function requiresRecord(string $referenceType): bool
    {
        return (bool) (self::DEFINITIONS[$referenceType]['requires_record'] ?? false);
    }

    public function isAllowedReferenceType(string $referenceType): bool
    {
        return array_key_exists($referenceType, self::DEFINITIONS);
    }

    public function resolveMemberReference(Member $member, string $referenceType, ?int $referenceId): ?Model
    {
        if (! $this->requiresRecord($referenceType)) {
            return null;
        }

        if (! $referenceId) {
            return null;
        }

        return match ($referenceType) {
            'share_payment_submission' => $member->sharePaymentSubmissions()->find($referenceId),
            'share_purchase' => $member->sharePurchases()->find($referenceId),
            'membership_fee_submission' => $member->membershipFeeSubmissions()->find($referenceId),
            'membership_fee' => $member->membershipFees()->find($referenceId),
            'loan' => $member->loans()->find($referenceId),
            'loan_repayment_submission' => $member->loanRepaymentSubmissions()->find($referenceId),
            'shareout_item' => $member->shareoutItems()->find($referenceId),
            default => null,
        };
    }

    public function serializeConcern(Concern $concern): array
    {
        $concernable = $concern->concernable;
        $referenceType = $this->referenceTypeFromModel($concern->concernable_type);
        $referenceSummary = $this->summarizeReference($referenceType, $concernable);

        return [
            'id' => $concern->id,
            'subject' => $concern->subject,
            'message' => $concern->message,
            'status' => $concern->status,
            'raised_at' => $concern->raised_at?->toISOString(),
            'resolved_at' => $concern->resolved_at?->toISOString(),
            'resolution_note' => $concern->resolution_note,
            'reference_type' => $referenceType,
            'reference_group_label' => $this->labelForReferenceType($referenceType),
            'reference_label' => $referenceSummary['label'],
            'reference_subtitle' => $referenceSummary['subtitle'],
            'action_url' => $referenceSummary['action_url'],
            'member' => $concern->member ? [
                'id' => $concern->member->id,
                'member_number' => $concern->member->member_number,
                'full_name' => $concern->member->full_name,
                'email' => $concern->member->email,
            ] : null,
            'resolver' => $concern->resolver ? [
                'id' => $concern->resolver->id,
                'name' => $concern->resolver->name,
                'role' => $concern->resolver->role,
            ] : null,
        ];
    }

    private function referenceTypeFromModel(?string $className): string
    {
        if (! $className) {
            return 'account';
        }

        foreach (self::DEFINITIONS as $type => $definition) {
            if ($definition['model'] === $className) {
                return $type;
            }
        }

        return 'account';
    }

    /**
     * @return array{label: string, subtitle: ?string, action_url: string}
     */
    private function summarizeReference(string $referenceType, mixed $concernable): array
    {
        return match ($referenceType) {
            'share_payment_submission' => $this->summarizeSharePaymentSubmission($concernable),
            'share_purchase' => $this->summarizeSharePurchase($concernable),
            'membership_fee_submission' => $this->summarizeMembershipFeeSubmission($concernable),
            'membership_fee' => $this->summarizeMembershipFee($concernable),
            'loan' => $this->summarizeLoan($concernable),
            'loan_repayment_submission' => $this->summarizeLoanRepaymentSubmission($concernable),
            'shareout_item' => $this->summarizeShareoutItem($concernable),
            default => [
                'label' => 'Account / Profile',
                'subtitle' => 'General account, profile, or access issue',
                'action_url' => '/dashboard/member',
            ],
        };
    }

    private function summarizeSharePaymentSubmission(mixed $concernable): array
    {
        if (! $concernable instanceof SharePaymentSubmission) {
            return [
                'label' => 'Share receipt submission',
                'subtitle' => null,
                'action_url' => '/dashboard/member/savings',
            ];
        }

        $concernable->loadMissing('cycle');

        return [
            'label' => 'Share receipt for '.$this->formatMonth($concernable->share_month),
            'subtitle' => sprintf(
                '%s · %s shares · %s',
                $concernable->cycle?->code ?? 'No cycle',
                $concernable->shares_count,
                $this->currency($concernable->expected_amount)
            ),
            'action_url' => '/dashboard/member/savings',
        ];
    }

    private function summarizeSharePurchase(mixed $concernable): array
    {
        if (! $concernable instanceof SharePurchase) {
            return [
                'label' => 'Share purchase record',
                'subtitle' => null,
                'action_url' => '/dashboard/member/savings',
            ];
        }

        $concernable->loadMissing('cycle');

        return [
            'label' => 'Share purchase for '.$this->formatMonth($concernable->share_month),
            'subtitle' => sprintf(
                '%s · %s shares · %s',
                $concernable->cycle?->code ?? 'No cycle',
                $concernable->shares_count,
                $this->currency($concernable->total_amount)
            ),
            'action_url' => '/dashboard/member/savings',
        ];
    }

    private function summarizeMembershipFeeSubmission(mixed $concernable): array
    {
        if (! $concernable instanceof MembershipFeeSubmission) {
            return [
                'label' => 'Membership fee receipt',
                'subtitle' => null,
                'action_url' => '/dashboard/member/savings',
            ];
        }

        $concernable->loadMissing('cycle');

        return [
            'label' => 'Membership fee receipt ('.$this->humanize($concernable->fee_type).')',
            'subtitle' => sprintf(
                '%s · %s',
                $concernable->cycle?->code ?? 'No cycle',
                $this->currency($concernable->expected_amount)
            ),
            'action_url' => '/dashboard/member/savings',
        ];
    }

    private function summarizeMembershipFee(mixed $concernable): array
    {
        if (! $concernable instanceof MembershipFee) {
            return [
                'label' => 'Membership fee record',
                'subtitle' => null,
                'action_url' => '/dashboard/member/savings',
            ];
        }

        $concernable->loadMissing('cycle');

        return [
            'label' => 'Membership fee record ('.$this->humanize($concernable->fee_type).')',
            'subtitle' => sprintf(
                '%s · %s · %s',
                $concernable->cycle?->code ?? 'No cycle',
                $this->currency($concernable->amount),
                $this->humanize($concernable->status)
            ),
            'action_url' => '/dashboard/member/savings',
        ];
    }

    private function summarizeLoan(mixed $concernable): array
    {
        if (! $concernable instanceof Loan) {
            return [
                'label' => 'Loan record',
                'subtitle' => null,
                'action_url' => '/dashboard/member/loans',
            ];
        }

        $concernable->loadMissing('cycle');

        return [
            'label' => 'Loan request of '.$this->currency($concernable->requested_amount),
            'subtitle' => sprintf(
                '%s · %s',
                $concernable->cycle?->code ?? 'No cycle',
                $this->humanize($concernable->status)
            ),
            'action_url' => '/dashboard/member/loans',
        ];
    }

    private function summarizeLoanRepaymentSubmission(mixed $concernable): array
    {
        if (! $concernable instanceof LoanRepaymentSubmission) {
            return [
                'label' => 'Loan repayment receipt',
                'subtitle' => null,
                'action_url' => '/dashboard/member/loans',
            ];
        }

        $concernable->loadMissing('loan.cycle');

        return [
            'label' => 'Repayment receipt for '.$this->currency($concernable->amount_paid),
            'subtitle' => sprintf(
                'Loan #%s · %s',
                $concernable->loan_id,
                $this->humanize($concernable->status)
            ),
            'action_url' => '/dashboard/member/loans',
        ];
    }

    private function summarizeShareoutItem(mixed $concernable): array
    {
        if (! $concernable instanceof ShareoutItem) {
            return [
                'label' => 'Share-out record',
                'subtitle' => null,
                'action_url' => '/dashboard/member/shareouts',
            ];
        }

        $concernable->loadMissing('run.cycle');

        return [
            'label' => 'Share-out payout of '.$this->currency($concernable->net_payout),
            'subtitle' => sprintf(
                '%s · %s',
                $concernable->run?->cycle?->code ?? 'No cycle',
                $this->humanize($concernable->status)
            ),
            'action_url' => '/dashboard/member/shareouts',
        ];
    }

    private function currency(int|float|string|null $value): string
    {
        return 'NGN '.number_format((float) ($value ?? 0), 2);
    }

    private function humanize(?string $value): string
    {
        return ucfirst(str_replace('_', ' ', (string) $value));
    }

    private function formatMonth(?string $value): string
    {
        if (! $value) {
            return 'Unknown month';
        }

        $timestamp = strtotime($value);

        if ($timestamp === false) {
            return $value;
        }

        return date('F Y', $timestamp);
    }
}
