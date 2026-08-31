import React from "react";

export const Badge = ({
  children,
  variant = "default",
  size = "md",
  className = "",
}) => {
  const variants = {
    default: "bg-[#8A9070]/15 text-[#5E5947] border-[#8A9070]/30",
    primary: "bg-[#8A9070] text-white border-transparent",
    secondary: "bg-[#B8C39A] text-[#272A1F] border-transparent",
    success: "bg-emerald-100 text-emerald-800 border-emerald-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    danger: "bg-rose-100 text-rose-800 border-rose-200",
    outline: "bg-transparent text-[#272A1F] border-[#D8C6A5]",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs font-semibold",
    lg: "px-3 py-1.5 text-sm font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border transition-colors select-none ${
        variants[variant] || variants.default
      } ${sizes[size] || sizes.md} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
