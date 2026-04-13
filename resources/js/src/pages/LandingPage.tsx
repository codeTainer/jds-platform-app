import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Field } from "../components/ui/Field";
import { Notice } from "../components/ui/Notice";
import { api } from "../lib/api";
import { SignupModal } from "../sections/SignupModal";

function EmailIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path
                d="M4.5 6.75h15a1.5 1.5 0 0 1 1.5 1.5v7.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15.75v-7.5a1.5 1.5 0 0 1 1.5-1.5Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
            />
            <path
                d="m4 8 8 6 8-6"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
            />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path
                d="M7.5 10.5V8a4.5 4.5 0 1 1 9 0v2.5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
            />
            <rect
                x="5.25"
                y="10.5"
                width="13.5"
                height="9"
                rx="2"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
            />
        </svg>
    );
}

interface PublicSummaryResponse {
    summary: {
        total_members: number;
        active_members: number;
        total_cycles: number;
        total_loans: number;
        total_share_entries: number;
    };
    active_cycle?: {
        name: string;
        code: string;
        share_price: number | string;
    } | null;
}

const slides = [
    {
        title: "Savings and loan operations for every JDS member",
        text: "A structured platform for onboarding, savings records, loan processing, and year-round accountability.",
        badge: "Cooperative Digital Platform",
    },
    {
        title: "EXCO oversight with cleaner records and faster workflow",
        text: "Manage member onboarding, verify savings, track guarantor approvals, and monitor repayments from one place.",
        badge: "Executive Operations",
    },
    {
        title: "Built for today’s internal process and tomorrow’s growth",
        text: "Start with verified transfer records now and scale later into a more self-service member experience.",
        badge: "Scalable Foundation",
    },
];

const services = [
    {
        title: "Member onboarding and approval tracking",
        icon: (
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                <path
                    d="M12 13.5a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-6.5 6a6.5 6.5 0 0 1 13 0"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                />
                <path
                    d="M18 6.5h3m-1.5-1.5V8"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                />
            </svg>
        ),
    },
    {
        title: "Membership fee and share purchase records",
        icon: (
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                <path
                    d="M4.5 7.5h15v9h-15z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                />
                <path
                    d="M9 12h6m-10.5-6h15"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
        ),
    },
    {
        title: "Loan requests, guarantor flow, disbursement, and repayment",
        icon: (
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                <path
                    d="M6 9.5h9.5a3.5 3.5 0 1 1 0 7H14"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                />
                <path
                    d="m10 6.5-4 3 4 3m4 5 4-3-4-3"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                />
            </svg>
        ),
    },
    {
        title: "Member and EXCO dashboards with role-specific access",
        icon: (
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                <path
                    d="M4.5 4.5h6v6h-6zm9 0h6v10.5h-6zm-9 9h6V19.5h-6zm9 4.5h6V19.5h-6z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                />
            </svg>
        ),
    },
];

const constitutionSections = [
    {
        title: "Objective of the Association",
        points: [
            "JDS is aimed at providing access to savings and loans in a fast, transparent, dependable, and accountable manner.",
        ],
    },
    {
        title: "Composition of EXCO",
        points: [
            "Chairperson – Shadrach Gideon",
            "Secretary – Jamila Mahdi",
            "Treasurer – Deborah Obise",
        ],
    },
    {
        title: "Services Rendered",
        points: [
            "Savings are mandatory for all members.",
            "Loan services are available to all members.",
            "Automated records should allow members to see their savings and loan history and raise concerns.",
            "Loan disbursement should be fast.",
            "Customer support should be available at all times.",
            "Group investment for clients is optional.",
        ],
    },
    {
        title: "Guidelines for Membership",
        points: [
            "Membership registration attracts a one-off payment of NGN 2,500 for new members per cycle, while old members pay NGN 1,500.",
            "All members should have a Gmail account.",
            "All members should have access to online banking.",
            "All members should be active on the WhatsApp group for savings and loan activities.",
            "All members should be committed to the group policies.",
            "All activities of JDS Savings should be visible in the group for transparency and accountability.",
            "Twenty percent of accumulated yearly interest goes to the management committee as administrative fees.",
        ],
    },
    {
        title: "Shares",
        points: [
            "Buying of shares starts from the 25th to the 5th depending on organizational salary timing.",
            "Cost per share is NGN 20,000.",
            "The highest share purchase per month is 10 shares, worth NGN 200,000.",
            "The minimum share purchase per month is 1 share, worth NGN 20,000, and it is mandatory.",
            "A member who fails to buy at least 1 share for 2 consecutive months is removed from the savings group and only the investment will be paid.",
            "Members must communicate with the group when they buy shares and ensure management confirms and records the details monthly.",
        ],
    },
    {
        title: "Loans",
        points: [
            "The loan limit is 3 times a member’s total share value.",
            "Any member who takes a loan must purchase at least two shares during the term of the loan.",
            "A service charge of 10 percent of the loan amount is added.",
            "Loan duration is 3 months from the date of collection.",
            "Loan payments exceeding 3 months attract 10 percent of the current unpaid balance for two months.",
            "Any default will be paid by the guarantor.",
            "All loan collection stops in September to reduce risk and allow 3 months for repayment.",
            "Members are encouraged to participate in taking loans so that everyone benefits more from one another.",
        ],
    },
    {
        title: "Loan Modality",
        points: [
            "A member sends a request on the platform with the amount and the name of the guarantor.",
            "The guarantor sends an acceptance message and confirms willingness to pay in the event of default.",
            "The member confirms receipt of funds.",
        ],
    },
    {
        title: "Member Leaving",
        points: [
            "A member who leaves before the cycle ends should give one-month notice.",
            "Only the original amount saved will be paid back to the member.",
            "Any loan amount owed will be deducted before funds are returned.",
            "If a member leaves without completing the loan repayment, the lender guarantor takes charge of the outstanding balance.",
        ],
    },
    {
        title: "Share-out",
        points: [
            "Share-out is done yearly from the 15th to the 21st of December.",
            "Return on investment is based on the number of shares multiplied by the current share price after yearly interest accrual.",
            "Outstanding loan balances are deducted from the total shares bought.",
            "Members receive 100 percent return on total investment.",
            "Return on investment is paid using the new share value on 80 percent RoI, while 20 percent is administrative cost.",
        ],
    },
];

const shareFlowSteps = [
    "Member makes a bank transfer for the intended monthly share purchase.",
    "Member posts the payment proof or transfer details in the WhatsApp group for transparency.",
    "EXCO verifies the payment against the cooperative account activity.",
    "EXCO logs into the platform and records the member share purchase with the month, number of shares, status, and payment reference.",
    "The member can then log into the platform and view the official updated share history and totals.",
];

const loanFlowSteps = [
    "Member submits the loan request on the platform with the amount and selected guarantor.",
    "Member may still notify the WhatsApp group that the request has been submitted for transparency.",
    "The guarantor reviews the request and gives consent on the platform as the official approval record.",
    "EXCO reviews the request in the system, checks eligibility, and confirms whether cooperative funds are available.",
    "The treasurer disburses the money externally from the real bank account if the loan is approved and funds are available.",
    "The treasurer records the disbursement on the platform with payment details and reference.",
    "The member repays externally by bank transfer and shares proof where necessary, while EXCO records repayments on the platform until the loan is cleared.",
];

function formatNumber(value: number | string | undefined) {
    return new Intl.NumberFormat("en-NG").format(Number(value ?? 0));
}

export function LandingPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [signupOpen, setSignupOpen] = useState(false);
    const [constitutionOpen, setConstitutionOpen] = useState(false);
    const [shareFlowOpen, setShareFlowOpen] = useState(false);
    const [loanFlowOpen, setLoanFlowOpen] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [summary, setSummary] = useState<PublicSummaryResponse | null>(null);
    const [summaryError, setSummaryError] = useState("");
    const [form, setForm] = useState({
        email: "",
        password: "",
        remember: true,
    });
    const [error, setError] = useState("");
    const [idleNotice, setIdleNotice] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setCurrentSlide((current) => (current + 1) % slides.length);
        }, 4500);

        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        api.get<PublicSummaryResponse>("/api/public/summary")
            .then(({ data }) => setSummary(data))
            .catch((requestError) =>
                setSummaryError(
                    requestError.response?.data?.message ??
                        "Unable to load public platform summary right now.",
                ),
            );
    }, []);

    useEffect(() => {
        const message = window.sessionStorage.getItem("jds_idle_logout_notice");

        if (message) {
            setIdleNotice(message);
            window.sessionStorage.removeItem("jds_idle_logout_notice");
        }
    }, []);

    const activeSlide = slides[currentSlide];

    const stats = useMemo(
        () => [
            {
                label: "Total Members",
                value: formatNumber(summary?.summary.total_members),
            },
            {
                label: "Active Members",
                value: formatNumber(summary?.summary.active_members),
            },
            {
                label: "Cycles So Far",
                value: formatNumber(summary?.summary.total_cycles),
            },
            {
                label: "Loan Records",
                value: formatNumber(summary?.summary.total_loans),
            },
        ],
        [summary],
    );

    return (
        <>
            <div className="landing-shell">
                <header className="landing-topbar">
                    <div className="landing-topbar__inner">
                        <a className="landing-brand" href="#home">
                            <div className="landing-brand__crest">JDS</div>
                            <div className="landing-brand__text">
                                <div className="landing-brand__title">
                                    JDS Platform
                                </div>
                                <div className="landing-brand__subtitle">
                                    Savings and Loans Cooperative
                                </div>
                            </div>
                        </a>

                        <nav className="landing-nav">
                            <a href="#home">Home</a>
                            <a href="#about">About</a>
                            <a href="#services">Services</a>
                            <a href="#indices">Indices</a>
                            <a className="landing-nav__cta" href="#auth">
                                Login | Register
                            </a>
                        </nav>
                    </div>
                </header>

                <section className="landing-hero" id="home">
                    <div className="landing-hero__carousel">
                        <div className="landing-hero__media">
                            <div className="landing-hero__overlay" />
                            <div className="landing-hero__content">
                                <div className="landing-hero__badge">
                                    {activeSlide.badge}
                                </div>
                                <h1>{activeSlide.title}</h1>
                                <p>{activeSlide.text}</p>
                                <div className="landing-hero__actions">
                                    <a
                                        className="landing-btn landing-btn--light"
                                        href="#auth"
                                    >
                                        Login
                                    </a>
                                    <button
                                        className="landing-btn landing-btn--outline-light"
                                        onClick={() => setSignupOpen(true)}
                                        type="button"
                                    >
                                        Register
                                    </button>
                                </div>
                            </div>
                            <div className="landing-hero__dots">
                                {slides.map((slide, index) => (
                                    <button
                                        key={slide.badge}
                                        className={
                                            index === currentSlide
                                                ? "landing-dot landing-dot--active"
                                                : "landing-dot"
                                        }
                                        onClick={() => setCurrentSlide(index)}
                                        type="button"
                                    />
                                ))}
                            </div>
                        </div>

                        <aside className="landing-login-card" id="auth">
                            <div className="landing-login-card__header">
                                <div className="landing-login-card__eyebrow">
                                    Member Access
                                </div>
                                <h2>Login to Continue</h2>
                                <p>
                                    Existing members and EXCO officers use the
                                    same login. Your dashboard opens based on
                                    your role.
                                </p>
                            </div>

                            <form
                                className="landing-form"
                                onSubmit={async (event) => {
                                    event.preventDefault();
                                    setSubmitting(true);
                                    setError("");
                                    try {
                                        await login(form);
                                        navigate("/");
                                    } catch (requestError: any) {
                                        setError(
                                            requestError.response?.data
                                                ?.message ??
                                                "Unable to sign in.",
                                        );
                                    } finally {
                                        setSubmitting(false);
                                    }
                                }}
                            >
                                <Field
                                    label="Email"
                                    onChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            email: value,
                                        }))
                                    }
                                    icon={<EmailIcon />}
                                    placeholder="Enter your email address"
                                    type="email"
                                    value={form.email}
                                />
                                <Field
                                    label="Password"
                                    onChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            password: value,
                                        }))
                                    }
                                    icon={<LockIcon />}
                                    placeholder="........"
                                    type="password"
                                    value={form.password}
                                />
                                <label className="landing-remember">
                                    <input
                                        checked={form.remember}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                remember: event.target.checked,
                                            }))
                                        }
                                        type="checkbox"
                                    />
                                    <span>Keep me signed in</span>
                                </label>
                                {error ? (
                                    <Notice tone="danger">{error}</Notice>
                                ) : null}
                                {idleNotice ? (
                                    <Notice tone="danger">{idleNotice}</Notice>
                                ) : null}
                                <button
                                    className="landing-btn landing-btn--primary landing-btn--block"
                                    disabled={submitting}
                                    type="submit"
                                >
                                    {submitting ? "Signing in..." : "Sign in"}
                                </button>
                            </form>

                            <div className="landing-login-card__footer">
                                <button
                                    className="landing-btn landing-btn--secondary"
                                    onClick={() => setSignupOpen(true)}
                                    type="button"
                                >
                                    Register
                                </button>
                                <a
                                    className="landing-btn landing-btn--secondary"
                                    href="/swagger"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    API Docs
                                </a>
                            </div>
                        </aside>
                    </div>
                </section>

                <section className="landing-section" id="about">
                    <div className="landing-section__heading">
                        <span>About</span>
                        <h2>About the JDS Platform</h2>
                        <p>
                            The platform is designed around the constitution of
                            the association, giving members and EXCO a clearer
                            digital structure for savings, loans, onboarding,
                            and transparent record keeping.
                        </p>
                        <div className="landing-section__actions">
                            <button
                                className="landing-btn landing-btn--about"
                                onClick={() => setConstitutionOpen(true)}
                                type="button"
                            >
                                View Constitution
                            </button>
                            <button
                                className="landing-btn landing-btn--about"
                                onClick={() => setShareFlowOpen(true)}
                                type="button"
                            >
                                Shares Purchase Process Flow
                            </button>
                            <button
                                className="landing-btn landing-btn--about"
                                onClick={() => setLoanFlowOpen(true)}
                                type="button"
                            >
                                Loan Application Process Flow
                            </button>
                        </div>
                    </div>

                    <div className="landing-about-grid">
                        <article className="landing-card landing-card--feature">
                            <h3>Transparent operations</h3>
                            <p>
                                Members can review official records while EXCO
                                manages the verified entries that drive the
                                cooperative.
                            </p>
                        </article>
                        <article className="landing-card landing-card--feature">
                            <h3>Cycle-based control</h3>
                            <p>
                                Onboarding opens only when a cycle is active and
                                the registration window is officially available.
                            </p>
                        </article>
                        <article className="landing-card landing-card--feature">
                            <h3>Role-based access</h3>
                            <p>
                                Normal members and EXCO each get the tools they
                                need without sharing the same operational
                                workspace.
                            </p>
                        </article>
                    </div>
                </section>

                <section
                    className="landing-section landing-section--muted"
                    id="services"
                >
                    <div className="landing-section__heading">
                        <span>Services</span>
                        <h2>What the platform currently supports</h2>
                    </div>

                    <div className="landing-service-grid">
                        {services.map((service) => (
                            <article
                                key={service.title}
                                className="landing-card landing-card--service"
                            >
                                <div className="landing-card__icon">
                                    {service.icon}
                                </div>
                                <h3>{service.title}</h3>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="landing-section" id="indices">
                    <div className="landing-section__heading">
                        <span>Indices</span>
                        <h2>Platform snapshot</h2>
                        <p>
                            Live indicators from the current local build of the
                            JDS cooperative platform.
                        </p>
                    </div>

                    {summaryError ? (
                        <Notice tone="danger">{summaryError}</Notice>
                    ) : null}

                    <div className="landing-stats-grid">
                        {stats.map((stat) => (
                            <article
                                key={stat.label}
                                className="landing-card landing-card--stat"
                            >
                                <div className="landing-card__stat-value">
                                    {stat.value}
                                </div>
                                <div className="landing-card__stat-label">
                                    {stat.label}
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="landing-cycle-banner">
                        <div>
                            <div className="landing-cycle-banner__label">
                                Active Cycle
                            </div>
                            <div className="landing-cycle-banner__title">
                                {summary?.active_cycle?.name ??
                                    "Cycle setup in progress"}
                            </div>
                        </div>
                        <div className="landing-cycle-banner__meta">
                            <span>{summary?.active_cycle?.code ?? "JDS"}</span>
                            <span>
                                Share Price: NGN{" "}
                                {formatNumber(
                                    summary?.active_cycle?.share_price,
                                )}
                            </span>
                            <span>
                                Share Entries:{" "}
                                {formatNumber(
                                    summary?.summary.total_share_entries,
                                )}
                            </span>
                        </div>
                    </div>
                </section>

                <footer className="landing-footer">
                    <div className="landing-footer__inner">
                        <div>
                            <div className="landing-footer__title">
                                JDS Platform
                            </div>
                            <p>
                                A cooperative system for savings, loans,
                                onboarding, and accountable member operations.
                            </p>
                        </div>
                        <div className="landing-footer__links">
                            <a href="#home">Home</a>
                            <a href="#about">About</a>
                            <a href="#services">Services</a>
                            <a href="#auth">Login | Register</a>
                        </div>
                    </div>
                </footer>
            </div>

            {signupOpen ? (
                <SignupModal onClose={() => setSignupOpen(false)} />
            ) : null}
            {constitutionOpen ? (
                <div className="constitution-modal-backdrop">
                    <div className="constitution-modal">
                        <div className="constitution-modal__header">
                            <div>
                                <div className="constitution-modal__eyebrow">
                                    JDS Constitution
                                </div>
                                <h3>
                                    Association Constitution and Operating Rules
                                </h3>
                            </div>
                            <button
                                className="constitution-modal__close"
                                onClick={() => setConstitutionOpen(false)}
                                type="button"
                            >
                                Close
                            </button>
                        </div>

                        <div className="constitution-modal__body">
                            {constitutionSections.map((section) => (
                                <section
                                    key={section.title}
                                    className="constitution-section"
                                >
                                    <h4>{section.title}</h4>
                                    <ul>
                                        {section.points.map((point) => (
                                            <li key={point}>{point}</li>
                                        ))}
                                    </ul>
                                </section>
                            ))}
                        </div>
                    </div>
                </div>
            ) : null}
            {shareFlowOpen ? (
                <div className="constitution-modal-backdrop">
                    <div className="constitution-modal constitution-modal--narrow">
                        <div className="constitution-modal__header">
                            <div>
                                <div className="constitution-modal__eyebrow">
                                    Process Flow
                                </div>
                                <h3>Shares Purchase Process Flow</h3>
                            </div>
                            <button
                                className="constitution-modal__close"
                                onClick={() => setShareFlowOpen(false)}
                                type="button"
                            >
                                Close
                            </button>
                        </div>

                        <div className="constitution-modal__body">
                            <section className="constitution-section">
                                <h4>Current operational process</h4>
                                <ol className="process-flow-list">
                                    {shareFlowSteps.map((step) => (
                                        <li key={step}>{step}</li>
                                    ))}
                                </ol>
                            </section>
                        </div>
                    </div>
                </div>
            ) : null}
            {loanFlowOpen ? (
                <div className="constitution-modal-backdrop">
                    <div className="constitution-modal constitution-modal--narrow">
                        <div className="constitution-modal__header">
                            <div>
                                <div className="constitution-modal__eyebrow">
                                    Process Flow
                                </div>
                                <h3>Loan Application Process Flow</h3>
                            </div>
                            <button
                                className="constitution-modal__close"
                                onClick={() => setLoanFlowOpen(false)}
                                type="button"
                            >
                                Close
                            </button>
                        </div>

                        <div className="constitution-modal__body">
                            <section className="constitution-section">
                                <h4>Current operational process</h4>
                                <ol className="process-flow-list">
                                    {loanFlowSteps.map((step) => (
                                        <li key={step}>{step}</li>
                                    ))}
                                </ol>
                            </section>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
