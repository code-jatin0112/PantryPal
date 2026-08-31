export default function Button({
  children,
  className = "",
  ...props
}) {
  return (
    <button
      className={`
        px-5
        py-3
        rounded-xl
        font-medium
        transition-all
        duration-200
        bg-[var(--color-primary)]
        text-white
        hover:opacity-90
        shadow-md
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}