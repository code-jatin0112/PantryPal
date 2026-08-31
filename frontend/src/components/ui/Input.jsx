import React, { forwardRef, useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export const Input = forwardRef(
  (
    {
      label,
      id,
      name,
      type = "text",
      placeholder,
      error,
      helperText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      isPassword = false,
      required = false,
      disabled = false,
      className = "",
      containerClassName = "",
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || name || `input-${Math.random().toString(36).substring(2, 9)}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const actualType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-[#272A1F] flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center">
          {LeftIcon && (
            <div className="absolute left-3.5 pointer-events-none text-[#5E5947]/70 flex items-center">
              <LeftIcon className="w-5 h-5" aria-hidden="true" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={actualType}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`
              w-full
              bg-white
              text-[#272A1F]
              placeholder-[#5E5947]/40
              text-base
              rounded-xl
              border
              transition-all
              duration-200
              px-4
              py-2.5
              ${LeftIcon ? "pl-11" : "pl-4"}
              ${isPassword || RightIcon ? "pr-11" : "pr-4"}
              ${
                error
                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-[#D8C6A5]/60 hover:border-[#8A9070]/60 focus:border-[#8A9070] focus:ring-2 focus:ring-[#8A9070]/20"
              }
              disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
              focus:outline-none
              shadow-sm
              ${className}
            `}
            {...props}
          />

          {isPassword ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 p-1 text-[#5E5947]/70 hover:text-[#272A1F] focus:outline-none transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Eye className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          ) : RightIcon ? (
            <div className="absolute right-3.5 pointer-events-none text-[#5E5947]/70 flex items-center">
              <RightIcon className="w-5 h-5" aria-hidden="true" />
            </div>
          ) : null}
        </div>

        {error && (
          <p id={errorId} className="text-xs font-medium text-red-600 flex items-center gap-1 mt-0.5" role="alert">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {!error && helperText && (
          <p id={helperId} className="text-xs text-[#5E5947]/70 mt-0.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
