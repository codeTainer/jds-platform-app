import { Notice } from '../../components/ui/Notice';
import { PageHeader } from '../../components/ui/PageHeader';
import { Panel } from '../../components/ui/Panel';

export function MemberHomeSection({ name }: { name: string }) {
    return (
        <div>
            <PageHeader
                description="This member workspace lets you view the official cooperative records that EXCO has posted after verifying your payments and savings activity."
                eyebrow="Member home"
                title={`Welcome back, ${name}.`}
            />
            <Panel title="Your savings records are now live">
                <Notice>Open the Savings menu to see the fees and share entries EXCO has verified and recorded for your account.</Notice>
            </Panel>
        </div>
    );
}

