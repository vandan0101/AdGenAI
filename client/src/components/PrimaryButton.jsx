export default function PrimaryButton({ children, disabled, className, ...props }) {
    return (
        <button
            disabled={disabled}
            className={`${className} ${disabled ? "opacity-70 cursor-not-allowed" : ""}`}
            {...props}
        >
            {children}
        </button>
    );
}
