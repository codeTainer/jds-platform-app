<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ExcoMemberApplicationController;
use App\Http\Controllers\ExcoMemberController;
use App\Http\Controllers\ExcoMembershipCycleController;
use App\Http\Controllers\ExcoLoanController;
use App\Http\Controllers\MemberLoanController;
use App\Http\Controllers\ExcoShareoutController;
use App\Http\Controllers\ExcoSavingsController;
use App\Http\Controllers\MemberShareoutController;
use App\Http\Controllers\MemberSavingsController;
use App\Http\Controllers\PublicSummaryController;
use App\Http\Controllers\PublicMemberApplicationController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => [
    'status' => 'ok',
    'app' => config('app.name'),
]);
Route::get('/public/summary', PublicSummaryController::class);

Route::post('/auth/login', [AuthController::class, 'login']);

Route::get('/onboarding/current-cycle', [PublicMemberApplicationController::class, 'currentCycle']);
Route::post('/member-applications', [PublicMemberApplicationController::class, 'store']);

Route::middleware('auth.token')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    Route::prefix('member')->group(function () {
        Route::get('/membership-cycles', [MemberSavingsController::class, 'cycles']);
        Route::get('/savings/overview', [MemberSavingsController::class, 'overview']);
        Route::get('/share-purchases', [MemberSavingsController::class, 'sharePurchases']);
        Route::get('/share-payment-submissions', [MemberSavingsController::class, 'sharePaymentSubmissions']);
        Route::post('/share-payment-submissions', [MemberSavingsController::class, 'storeSharePaymentSubmission']);
        Route::get('/membership-fee-submissions', [MemberSavingsController::class, 'membershipFeeSubmissions']);
        Route::post('/membership-fee-submissions', [MemberSavingsController::class, 'storeMembershipFeeSubmission']);
        Route::get('/membership-fees', [MemberSavingsController::class, 'membershipFees']);
        Route::get('/shareouts/overview', [MemberShareoutController::class, 'overview']);
        Route::get('/shareouts', [MemberShareoutController::class, 'index']);
        Route::get('/loans/overview', [MemberLoanController::class, 'overview']);
        Route::get('/loans', [MemberLoanController::class, 'index']);
        Route::post('/loans', [MemberLoanController::class, 'store']);
        Route::delete('/loans/{loan}', [MemberLoanController::class, 'destroy']);
        Route::patch('/loans/{loan}/confirm-disbursement', [MemberLoanController::class, 'confirmDisbursement']);
        Route::get('/loan-repayment-submissions', [MemberLoanController::class, 'repaymentSubmissions']);
        Route::post('/loan-repayment-submissions', [MemberLoanController::class, 'storeRepaymentSubmission']);
        Route::get('/loan-guarantors', [MemberLoanController::class, 'availableGuarantors']);
        Route::get('/guarantor-approvals', [MemberLoanController::class, 'guarantorApprovals']);
        Route::patch('/guarantor-approvals/{loanGuarantorApproval}', [MemberLoanController::class, 'respondToGuarantorApproval']);
    });
});

Route::prefix('exco')->middleware('auth.token')->group(function () {
    Route::get('/members', [ExcoMemberController::class, 'index']);
    Route::post('/members', [ExcoMemberController::class, 'store']);
    Route::post('/members/import', [ExcoMemberController::class, 'import']);
    Route::get('/members/{member}', [ExcoMemberController::class, 'show']);
    Route::get('/members/{member}/share-purchases', [ExcoSavingsController::class, 'memberShareHistory']);
    Route::get('/members/{member}/membership-fees', [ExcoSavingsController::class, 'memberMembershipFees']);

    Route::get('/membership-cycles', [ExcoMembershipCycleController::class, 'index']);
    Route::post('/membership-cycles', [ExcoMembershipCycleController::class, 'store']);
    Route::get('/membership-cycles/{membershipCycle}', [ExcoMembershipCycleController::class, 'show']);
    Route::patch('/membership-cycles/{membershipCycle}', [ExcoMembershipCycleController::class, 'update']);
    Route::delete('/membership-cycles/{membershipCycle}', [ExcoMembershipCycleController::class, 'destroy']);
    Route::patch('/membership-cycles/{membershipCycle}/activate', [ExcoMembershipCycleController::class, 'activate']);

    Route::get('/member-applications', [ExcoMemberApplicationController::class, 'index']);
    Route::get('/member-applications/{memberApplication}', [ExcoMemberApplicationController::class, 'show']);
    Route::patch('/member-applications/{memberApplication}/review', [ExcoMemberApplicationController::class, 'review']);

    Route::get('/membership-fees', [ExcoSavingsController::class, 'membershipFees']);
    Route::get('/membership-fee-submissions', [ExcoSavingsController::class, 'membershipFeeSubmissions']);
    Route::patch('/membership-fee-submissions/{membershipFeeSubmission}/review', [ExcoSavingsController::class, 'reviewMembershipFeeSubmission']);
    Route::get('/share-purchases', [ExcoSavingsController::class, 'sharePurchases']);
    Route::get('/share-payment-submissions', [ExcoSavingsController::class, 'sharePaymentSubmissions']);
    Route::patch('/share-payment-submissions/{sharePaymentSubmission}/review', [ExcoSavingsController::class, 'reviewSharePaymentSubmission']);
    Route::post('/share-purchases', [ExcoSavingsController::class, 'storeSharePurchase']);

    Route::get('/shareout-runs', [ExcoShareoutController::class, 'index']);
    Route::get('/membership-cycles/{membershipCycle}/shareout-profit-preview', [ExcoShareoutController::class, 'profitPreview']);
    Route::post('/shareout-runs', [ExcoShareoutController::class, 'store']);
    Route::delete('/shareout-runs/{shareoutRun}', [ExcoShareoutController::class, 'destroy']);
    Route::get('/shareout-runs/{shareoutRun}', [ExcoShareoutController::class, 'show']);
    Route::get('/shareout-runs/{shareoutRun}/items', [ExcoShareoutController::class, 'items']);
    Route::patch('/shareout-runs/{shareoutRun}/approve', [ExcoShareoutController::class, 'approve']);
    Route::patch('/shareout-runs/{shareoutRun}/reject', [ExcoShareoutController::class, 'reject']);
    Route::patch('/shareout-runs/{shareoutRun}/execute', [ExcoShareoutController::class, 'execute']);
    Route::patch('/shareout-items/{shareoutItem}/mark-paid', [ExcoShareoutController::class, 'markItemPaid']);

    Route::get('/loans', [ExcoLoanController::class, 'index']);
    Route::patch('/loans/{loan}/approve', [ExcoLoanController::class, 'approve']);
    Route::patch('/loans/{loan}/reject', [ExcoLoanController::class, 'reject']);
    Route::post('/loans/{loan}/disburse', [ExcoLoanController::class, 'disburse']);
    Route::get('/loan-repayment-submissions', [ExcoLoanController::class, 'repaymentSubmissions']);
    Route::patch('/loan-repayment-submissions/{loanRepaymentSubmission}/review', [ExcoLoanController::class, 'reviewRepaymentSubmission']);
});
