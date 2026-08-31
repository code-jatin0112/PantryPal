import React from "react";
import { Link } from "react-router-dom";
import { Compass, Home } from "lucide-react";
import Button from "../../components/ui/Button";
import { ROUTES } from "../../constants/routes";

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#272A1F] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-20 h-20 rounded-3xl bg-[#8A9070]/15 text-[#8A9070] flex items-center justify-center mb-6 shadow-sm border border-[#8A9070]/30">
        <Compass className="w-10 h-10 animate-spin [animation-duration:8s]" />
      </div>

      <span className="text-sm font-extrabold uppercase tracking-widest text-[#8A9070] mb-1">
        Error 404
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#272A1F]">
        Page Not Found
      </h1>

      <p className="text-base text-[#5E5947] max-w-md mt-2 mb-8 leading-relaxed">
        The culinary page or ingredient record you're looking for doesn't exist or has been moved.
      </p>

      <Link to={ROUTES.DASHBOARD || "/"}>
        <Button variant="primary" size="lg" icon={Home}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
