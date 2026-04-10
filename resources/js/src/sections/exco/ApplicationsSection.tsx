import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../feedback/ToastProvider';
import { Notice } from '../../components/ui/Notice';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { api } from '../../lib/api';
import type { MemberApplication } from '../../types';

export function ApplicationsSection() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [applications, setApplications] = useState<MemberApplication[]>([]);

    const loadApplications = async () => {
        const { data } = await api.get<MemberApplication[]>('/api/exco/member-applications');
        setApplications(data);
    };

    useEffect(() => {
        void loadApplications();
    }, []);

    async function reviewApplication(applicationId: number, status: 'approved' | 'rejected') {
        try {
            await api.patch(`/api/exco/member-applications/${applicationId}/review`, {
                status,
                reviewed_by: user?.id,
            });
            showToast(`Application ${status}.`, 'success');
            await loadApplications();
        } catch (requestError: any) {
            showToast(requestError.response?.data?.message ?? 'Unable to review application.', 'error');
        }
    }

    return (
        <div>
            <PageHeader
                description="Every submission enters the queue as pending review. Approving an application creates the member record so the person can move into the rest of the platform."
                eyebrow="Application review"
                title="Approve or reject new member requests."
            />
            <div className="mt-6 grid gap-4">
                {applications.length ? applications.map((application) => (
                    <Panel key={application.id} eyebrow={application.cycle?.code ?? 'Application'} title={application.full_name}>
                        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                            <div className="grid gap-2 text-[0.98rem] text-[var(--muted)]">
                                <div>Email: {application.email}</div>
                                <div>Phone: {application.phone_number}</div>
                                <div>Status: {application.status.replace('_', ' ')}</div>
                                <div>Online banking: {application.has_online_banking ? 'Yes' : 'No'} | WhatsApp active: {application.whatsapp_active ? 'Yes' : 'No'}</div>
                            </div>
                            {application.status === 'pending_review' ? (
                                <div className="flex flex-wrap gap-3">
                                    <button className="rounded-full bg-[var(--forest)] px-4 py-2.5 text-[0.98rem] font-semibold text-white" onClick={() => void reviewApplication(application.id, 'approved')} type="button">Approve</button>
                                    <button className="rounded-full bg-[var(--danger)] px-4 py-2.5 text-[0.98rem] font-semibold text-white" onClick={() => void reviewApplication(application.id, 'rejected')} type="button">Reject</button>
                                </div>
                            ) : (
                                <StatusBadge active={application.status === 'approved'}>{application.status.replace('_', ' ')}</StatusBadge>
                            )}
                        </div>
                    </Panel>
                )) : <Notice>No applications have been submitted yet.</Notice>}
            </div>
        </div>
    );
}
