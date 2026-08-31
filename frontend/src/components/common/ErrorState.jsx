import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import Button from "../ui/Button";

export const ErrorState = ({
  title = "Failed to load data",
  message = "Please check your network connection and try again.",
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-red-200 shadow-sm max-w-lg mx-auto my-6">
      <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-[#272A1F]">{title}</h3>
      <p className="text-sm text-[#5E5947] mt-1 mb-5">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" icon={RotateCcw} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;

