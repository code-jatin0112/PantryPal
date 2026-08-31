import React from "react";
import { PackageOpen } from "lucide-react";
import Button from "../ui/Button";

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = "No items found",
  description = "Get started by creating or adding your first item.",
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-[#D8C6A5]/40 shadow-sm max-w-md mx-auto my-6">
      <div className="w-14 h-14 rounded-2xl bg-[#FAF8F3] text-[#8A9070] flex items-center justify-center mb-4 border border-[#D8C6A5]/30">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold text-[#272A1F]">{title}</h3>
      <p className="text-sm text-[#5E5947] mt-1.5 mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;

