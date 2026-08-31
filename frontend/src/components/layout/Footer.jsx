import React from "react";
import { UtensilsCrossed, Heart } from "lucide-react";

export const Footer = ({ className = "" }) => {
  return (
    <footer
      className={`w-full py-6 px-4 sm:px-8 border-t border-[#D8C6A5]/30 bg-[#FAF8F3] text-[#5E5947] text-xs select-none ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#8A9070] text-white flex items-center justify-center">
            <UtensilsCrossed className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-[#272A1F]">PantryPal</span>
          <span className="text-[#5E5947]/75">
            • Mindful cooking & AI kitchen intelligence
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>for zero food waste. © {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

