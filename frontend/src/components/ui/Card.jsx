import React from "react";

export const Card = ({ children, className = "", hoverable = false, ...props }) => {
  return (
    <div
      className={`
        bg-white
        border border-[#D8C6A5]/40
        rounded-2xl
        shadow-sm
        p-6 md:p-8
        transition-all
        duration-200
        ${hoverable ? "hover:shadow-md hover:border-[#8A9070]/50" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = "", ...props }) => {
  return (
    <div className={`flex flex-col space-y-1.5 pb-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = "", ...props }) => {
  return (
    <h3
      className={`text-2xl font-bold tracking-tight text-[#272A1F] ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription = ({ children, className = "", ...props }) => {
  return (
    <p className={`text-sm text-[#5E5947]/80 ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent = ({ children, className = "", ...props }) => {
  return <div className={`space-y-4 ${className}`} {...props}>{children}</div>;
};

export const CardFooter = ({ children, className = "", ...props }) => {
  return (
    <div className={`pt-6 flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
