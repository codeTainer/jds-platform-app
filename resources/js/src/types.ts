export type UserRole = 'chairperson' | 'secretary' | 'treasurer' | 'support' | 'member';

export interface Member {
    id: number;
    member_number: string | null;
    full_name: string;
    email: string;
    phone_number: string;
    membership_status: string;
    joined_on?: string | null;
    has_online_banking?: boolean;
    whatsapp_active?: boolean;
    profile_completed_at?: string | null;
    notes?: string | null;
    user?: User | null;
    share_purchases_count?: number;
    loans_count?: number;
    concerns_count?: number;
    share_purchases_sum_shares_count?: number | string | null;
    share_purchases_sum_total_amount?: number | string | null;
}

export interface User {
    id: number;
    name: string;
    email: string;
    member_id: number | null;
    role: UserRole;
    must_change_password: boolean;
    temporary_password_sent_at?: string | null;
    password_changed_at?: string | null;
    member?: Member | null;
}

export interface MembershipCycle {
    id: number;
    name: string;
    code: string;
    starts_on: string;
    ends_on: string;
    onboarding_opens_at?: string | null;
    onboarding_closes_at?: string | null;
    accepting_new_applications: boolean;
    is_active: boolean;
    share_price: number | string;
    min_monthly_shares?: number;
    max_monthly_shares?: number;
    loan_multiplier?: number | string;
    loan_service_charge_rate?: number | string;
    loan_duration_months?: number;
    overdue_penalty_rate?: number | string;
    overdue_penalty_window_months?: number;
    shareout_admin_fee_rate?: number | string;
    registration_fee_new_member?: number | string;
    registration_fee_existing_member?: number | string;
    loan_pause_month?: number;
    onboarding_notes?: string | null;
    member_applications_count?: number;
    share_purchases_count?: number;
    loans_count?: number;
}

export interface MemberApplication {
    id: number;
    full_name: string;
    email: string;
    phone_number: string;
    status: string;
    applied_at?: string | null;
    review_note?: string | null;
    has_online_banking: boolean;
    whatsapp_active: boolean;
    cycle?: MembershipCycle | null;
    approved_member?: Member | null;
    reviewer?: User | null;
}

export interface MembershipFee {
    id: number;
    membership_cycle_id: number;
    member_id: number;
    fee_type: 'new_member' | 'existing_member';
    amount: number | string;
    status: 'pending' | 'paid' | 'waived';
    paid_at?: string | null;
    payment_reference?: string | null;
    notes?: string | null;
    member?: Member | null;
    cycle?: MembershipCycle | null;
}

export interface MembershipFeeSubmission {
    id: number;
    membership_cycle_id: number;
    member_id: number;
    fee_type: 'new_member' | 'existing_member';
    expected_amount: number | string;
    receipt_path: string;
    receipt_disk?: string | null;
    receipt_original_name?: string | null;
    receipt_mime_type?: string | null;
    receipt_size_bytes?: number | null;
    receipt_url?: string | null;
    status: 'pending' | 'approved' | 'rejected';
    submitted_at?: string | null;
    reviewed_at?: string | null;
    approved_membership_fee_id?: number | null;
    member_note?: string | null;
    review_note?: string | null;
    member?: Member | null;
    cycle?: MembershipCycle | null;
    reviewer?: User | null;
    approved_membership_fee?: MembershipFee | null;
}

export interface SharePurchase {
    id: number;
    membership_cycle_id: number;
    member_id: number;
    share_month: string;
    shares_count: number;
    unit_share_price: number | string;
    total_amount: number | string;
    payment_status: 'pending' | 'paid' | 'confirmed';
    purchased_at?: string | null;
    confirmed_at?: string | null;
    payment_reference?: string | null;
    notes?: string | null;
    member?: Member | null;
    cycle?: MembershipCycle | null;
    confirmer?: User | null;
}

export interface SharePaymentSubmission {
    id: number;
    membership_cycle_id: number;
    member_id: number;
    share_month: string;
    shares_count: number;
    unit_share_price: number | string;
    expected_amount: number | string;
    receipt_path: string;
    receipt_disk?: string | null;
    receipt_original_name?: string | null;
    receipt_mime_type?: string | null;
    receipt_size_bytes?: number | null;
    receipt_url?: string | null;
    status: 'pending' | 'approved' | 'rejected';
    submitted_at?: string | null;
    reviewed_at?: string | null;
    approved_share_purchase_id?: number | null;
    member_note?: string | null;
    review_note?: string | null;
    member?: Member | null;
    cycle?: MembershipCycle | null;
    reviewer?: User | null;
    approved_share_purchase?: SharePurchase | null;
}

export interface LoanGuarantorApproval {
    id: number;
    loan_id: number;
    guarantor_member_id: number;
    status: 'pending' | 'approved' | 'rejected';
    responded_at?: string | null;
    response_note?: string | null;
    loan?: Loan | null;
    guarantor?: Member | null;
}

export interface Loan {
    id: number;
    membership_cycle_id?: number | null;
    member_id: number;
    guarantor_member_id?: number | null;
    requested_amount: number | string;
    approved_amount?: number | string | null;
    service_charge_rate?: number | string | null;
    service_charge_amount?: number | string | null;
    total_due_amount?: number | string | null;
    outstanding_amount?: number | string | null;
    status: string;
    purpose?: string | null;
    requested_at?: string | null;
    approved_at?: string | null;
    disbursed_at?: string | null;
    repaid_at?: string | null;
    due_on?: string | null;
    notes?: string | null;
    member?: Member | null;
    guarantor?: Member | null;
    cycle?: MembershipCycle | null;
    guarantor_approvals?: LoanGuarantorApproval[] | null;
    repayment_submissions?: LoanRepaymentSubmission[] | null;
}

export interface LoanOverview {
    summary: {
        share_value: number | string;
        loan_multiplier: number | string;
        eligible_amount: number | string;
        can_request: boolean;
        request_block_reason?: string | null;
        active_loan?: Loan | null;
    };
}

export interface LoanRepaymentSubmission {
    id: number;
    loan_id: number;
    member_id: number;
    amount_paid: number | string;
    receipt_path: string;
    receipt_disk?: string | null;
    receipt_original_name?: string | null;
    receipt_mime_type?: string | null;
    receipt_size_bytes?: number | null;
    receipt_url?: string | null;
    status: 'pending' | 'approved' | 'rejected';
    submitted_at?: string | null;
    reviewed_at?: string | null;
    approved_loan_repayment_id?: number | null;
    member_note?: string | null;
    review_note?: string | null;
    member?: Member | null;
    loan?: Loan | null;
    reviewer?: User | null;
}

export interface SavingsOverview {
    member: Member;
    summary: {
        share_purchases_count: number;
        total_shares_count: number;
        total_share_value: number | string;
        membership_fees_paid: number;
        membership_fees_pending: number;
    };
}

export interface ShareoutRun {
    id: number;
    membership_cycle_id: number;
    scheduled_start_on?: string | null;
    scheduled_end_on?: string | null;
    executed_at?: string | null;
    total_profit?: number | string | null;
    admin_fee_rate?: number | string | null;
    admin_fee_amount?: number | string | null;
    distributable_profit?: number | string | null;
    status: string;
    approved_by?: number | null;
    approved_at?: string | null;
    notes?: string | null;
    cycle?: MembershipCycle | null;
    approver?: User | null;
    items_count?: number;
    items_sum_total_saved?: number | string | null;
    items_sum_gross_return?: number | string | null;
    items_sum_outstanding_loan_deduction?: number | string | null;
    items_sum_admin_fee_deduction?: number | string | null;
    items_sum_net_payout?: number | string | null;
}

export interface ShareoutItem {
    id: number;
    shareout_run_id: number;
    member_id: number;
    total_shares: number;
    total_saved: number | string;
    gross_return: number | string;
    outstanding_loan_deduction: number | string;
    admin_fee_deduction: number | string;
    net_payout: number | string;
    status: string;
    paid_at?: string | null;
    member?: Member | null;
    run?: ShareoutRun | null;
}

export interface ShareoutSummary {
    members_count: number;
    total_saved: number | string;
    total_profit: number | string;
    admin_fee_amount: number | string;
    distributable_profit: number | string;
    gross_return_total: number | string;
    outstanding_loan_deduction_total: number | string;
    admin_fee_deduction_total: number | string;
    net_payout_total: number | string;
}

export interface ShareoutProfitBreakdown {
    loan_service_charge_total: number | string;
    default_penalty_total: number | string;
    membership_fee_total: number | string;
    total_profit: number | string;
}

export interface MemberShareoutOverview {
    summary: {
        shareout_items_count: number;
        total_gross_return: number | string;
        total_admin_fee_deduction: number | string;
        total_outstanding_loan_deduction: number | string;
        total_net_payout: number | string;
        paid_items_count: number;
    };
}

export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
}

export interface LoginResponse {
    message: string;
    token: string;
    token_type: string;
    user: User;
}
