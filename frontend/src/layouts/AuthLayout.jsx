import React from "react";
import { motion } from "framer-motion";
import { UtensilsCrossed, Sparkles, Leaf, ShieldCheck, ChefHat } from "lucide-react";

export const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-[#FAF8F3] text-[#272A1F] flex flex-col lg:flex-row">
      {/* Left Panel: Branding, Tagline, Value Props & Illustration */}
      <div className="lg:w-1/2 bg-gradient-to-br from-[#8A9070] via-[#757C5F] to-[#5E5947] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none blur-2xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-[#B8C39A]/10 pointer-events-none blur-3xl" />

        {/* Top: Logo & Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-white font-sans">
                PantryPal
              </span>
              <span className="block text-xs uppercase tracking-widest text-[#B8C39A] font-semibold">
                AI Kitchen Assistant
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Tagline & Interactive Feature Highlights */}
        <div className="my-12 lg:my-0 relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium text-[#FAF8F3] mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#B8C39A]" />
              <span>Smart Kitchen Management</span>
            </div>

            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Use what you have before buying more.
            </h1>

            <p className="mt-4 text-base lg:text-lg text-white/80 leading-relaxed font-normal">
              Track ingredients, reduce food waste, dynamically scale recipes to your headcount, and plan delicious budget-conscious meals with AI assistance.
            </p>
          </motion.div>

          {/* Feature Badges Showcase */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div
              whileHover={{ y: -3 }}
              className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 shadow-sm flex items-start gap-3.5"
            >
              <div className="p-2 rounded-lg bg-white/10 text-[#B8C39A] shrink-0">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Waste Reduction</h4>
                <p className="text-xs text-white/70 mt-0.5">Prioritizes expiring ingredients automatically</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 shadow-sm flex items-start gap-3.5"
            >
              <div className="p-2 rounded-lg bg-white/10 text-[#B8C39A] shrink-0">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Dynamic Scaling</h4>
                <p className="text-xs text-white/70 mt-0.5">Calculates exact portions for any headcount</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 shadow-sm flex items-start gap-3.5"
            >
              <div className="p-2 rounded-lg bg-white/10 text-[#B8C39A] shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Grounded AI Chef</h4>
                <p className="text-xs text-white/70 mt-0.5">Recommendations based on your live inventory</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -3 }}
              className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 shadow-sm flex items-start gap-3.5"
            >
              <div className="p-2 rounded-lg bg-white/10 text-[#B8C39A] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Allergy Guardrails</h4>
                <p className="text-xs text-white/70 mt-0.5">Strict safety enforcement across all recipes</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom: Footer note */}
        <div className="relative z-10 text-xs text-white/60 flex items-center gap-2">
          <span>© {new Date().getFullYear()} PantryPal. Crafted for mindful cooking.</span>
        </div>
      </div>

      {/* Right Panel: Form & Authentication Content Container */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
