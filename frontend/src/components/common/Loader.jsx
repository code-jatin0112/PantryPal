import React from "react";
import { Loader2 } from "lucide-react";

export const Loader = ({ message = "Loading...", fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 p-6 select-none">
      <Loader2 className="w-8 h-8 animate-spin text-[#8A9070]" />
      <p className="text-sm font-medium text-[#5E5947]">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[#FAF8F3]/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;
