import {
    Children,
    isValidElement,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent as ReactKeyboardEvent,
    type ReactNode,
} from 'react';

interface SelectChangeEvent {
    target: {
        value: string;
    };
}

interface AppSelectProps {
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    id?: string;
    name?: string;
    onChange?: (event: SelectChangeEvent) => void;
    required?: boolean;
    value?: string | number | readonly string[] | null;
}

interface AppSelectOption {
    disabled: boolean;
    label: string;
    value: string;
}

interface OptionProps {
    children?: ReactNode;
    disabled?: boolean;
    value?: string | number | readonly string[];
}

function normalizeOptions(children: ReactNode): AppSelectOption[] {
    const options: AppSelectOption[] = [];

    Children.forEach(children, (child) => {
        if (!isValidElement<OptionProps>(child) || child.type !== 'option') {
            return;
        }

        options.push({
            disabled: Boolean(child.props.disabled),
            label: typeof child.props.children === 'string'
                ? child.props.children
                : Children.toArray(child.props.children).join(''),
            value: String(child.props.value ?? ''),
        });
    });

    return options;
}

export function AppSelect({
    children,
    className = '',
    disabled = false,
    id,
    name,
    onChange,
    required = false,
    value,
}: AppSelectProps) {
    const generatedId = useId();
    const controlId = id ?? `app-select-${generatedId}`;
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const [open, setOpen] = useState(false);
    const options = useMemo(() => normalizeOptions(children), [children]);
    const selectedValue = value == null ? '' : String(value);
    const selectedOption = options.find((option) => option.value === selectedValue) ?? null;
    const placeholderOption = options.find((option) => option.value === '') ?? null;
    const displayLabel = selectedOption?.label ?? placeholderOption?.label ?? 'Select option';
    const fullWidth = !className.includes('app-filter-select') && !className.includes('app-table-pagination__select');

    useEffect(() => {
        if (!open) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (wrapperRef.current?.contains(event.target as Node)) {
                return;
            }

            setOpen(false);
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
                buttonRef.current?.focus();
            }
        };

        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('keydown', handleEscape);

        return () => {
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    const commitValue = (nextValue: string) => {
        onChange?.({ target: { value: nextValue } });
        setOpen(false);
    };

    const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
        if (disabled) {
            return;
        }

        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen((current) => !current);
        }

        if (event.key === 'Escape') {
            setOpen(false);
        }
    };

    return (
        <div
            className={`app-select${fullWidth ? ' app-select--block' : ''}${open ? ' app-select--open' : ''}`}
            ref={wrapperRef}
        >
            <button
                aria-controls={`${controlId}-menu`}
                aria-expanded={open}
                className={`app-select__trigger ${className}${!selectedOption ? ' app-select__trigger--placeholder' : ''}`.trim()}
                disabled={disabled}
                id={controlId}
                onClick={() => setOpen((current) => !current)}
                onKeyDown={handleTriggerKeyDown}
                type="button"
            >
                <span className="app-select__label">{displayLabel}</span>
                <span aria-hidden="true" className="app-select__chevron">
                    <svg fill="none" viewBox="0 0 12 8">
                        <path
                            d="M1.25 1.25 6 6l4.75-4.75"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                        />
                    </svg>
                </span>
            </button>

            <input
                aria-hidden="true"
                className="app-select__validation-proxy"
                disabled={disabled}
                name={name}
                readOnly
                required={required}
                tabIndex={-1}
                value={selectedValue}
            />

            {open ? (
                <div className="app-select__menu" id={`${controlId}-menu`} role="listbox">
                    {options.map((option) => (
                        <button
                            aria-selected={option.value === selectedValue}
                            className={`app-select__option${option.value === selectedValue ? ' app-select__option--selected' : ''}`.trim()}
                            disabled={option.disabled}
                            key={`${controlId}-${option.value}`}
                            onClick={() => commitValue(option.value)}
                            role="option"
                            type="button"
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
