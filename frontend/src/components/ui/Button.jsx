import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export const Button = ({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  className = "",
  onClick,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer";

  const variants = {
    primary:
      "bg-[#8A9070] text-white hover:bg-[#757C5F] active:bg-[#646A50] focus:ring-[#8A9070] shadow-sm hover:shadow-md",
    secondary:
      "bg-[#B8C39A] text-[#272A1F] hover:bg-[#A6B287] active:bg-[#94A074] focus:ring-[#B8C39A] shadow-sm",
    outline:
      "border-2 border-[#8A9070] text-[#8A9070] hover:bg-[#8A9070]/10 focus:ring-[#8A9070]",
    ghost:
      "text-[#272A1F] hover:bg-black/5 focus:ring-[#8A9070]",
    danger:
      "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500 shadow-sm",
  };

  const sizes = {
    sm: "px-3.5 py-2 text-sm rounded-lg gap-1.5",
    md: "px-5 py-2.5 text-base rounded-xl gap-2",
    lg: "px-6 py-3.5 text-lg rounded-xl gap-2.5",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <motion.button
      type={type}
      whileTap={disabled || isLoading ? undefined : { scale: 0.98 }}
      whileHover={disabled || isLoading ? undefined : { scale: 1.01 }}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${widthStyle} ${className}`}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />}
          <span>{children}</span>
        </>
      )}
    </motion.button>
  );
};

export default Button;