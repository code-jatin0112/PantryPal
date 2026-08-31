import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, CheckCircle2, Flame, Clock } from "lucide-react";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";

export const CookingMode = ({
  recipe = {
    title: "Mediterranean Shakshuka",
    servings: 2,
    totalMinutes: 25,
    steps: [
      "Heat 2 tablespoons of olive oil in a large skillet over medium heat. Add chopped onions and bell peppers; sauté for 5 minutes until soft.",
      "Add minced garlic, cumin, paprika, and chili flakes. Cook for 1 minute until fragrant.",
      "Pour in crushed tomatoes, season with salt and black pepper, and simmer gently for 10 minutes until the sauce thickens.",
      "Use a wooden spoon to create small wells in the sauce. Gently crack eggs directly into each well.",
      "Cover the skillet with a lid and cook on low heat for 5-8 minutes until egg whites are set but yolks remain runny.",
      "Garnish with fresh cilantro, crumbled feta cheese, and serve immediately with warm pita bread.",
    ],
  },
  onFinish,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 min timer
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const steps = recipe.steps || [];
  const progressPercent = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Controls & Progress */}
      <div className="p-6 rounded-3xl bg-white border border-[#D8C6A5]/40 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="primary" size="md">
              Cooking Mode
            </Badge>
            <h2 className="text-xl sm:text-2xl font-bold text-[#272A1F] mt-1">
              {recipe.title}
            </h2>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5E5947]">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-base font-extrabold text-[#8A9070] block">
              {progressPercent}% Complete
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-[#FAF8F3] overflow-hidden border border-[#D8C6A5]/30">
          <div
            className="h-full bg-[#8A9070] transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Focus Step Card */}
      <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#D8C6A5]/50 shadow-md space-y-6 text-center">
        <span className="w-12 h-12 rounded-2xl bg-[#8A9070] text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-xs">
          {currentStep + 1}
        </span>

        <p className="text-xl sm:text-2xl lg:text-3xl font-medium text-[#272A1F] leading-relaxed max-w-2xl mx-auto">
          {steps[currentStep]}
        </p>

        {/* Built-in Cooking Timer */}
        <div className="inline-flex items-center gap-4 px-6 py-3 rounded-2xl bg-[#FAF8F3] border border-[#D8C6A5]/40 shadow-2xs mx-auto">
          <Clock className="w-5 h-5 text-[#8A9070]" />
          <span className="font-mono text-2xl font-bold text-[#272A1F]">
            {formatTimer(timerSeconds)}
          </span>

          <button
            type="button"
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className="p-2 rounded-xl bg-[#8A9070] text-white hover:bg-[#757C5F] transition-colors cursor-pointer"
            title={isTimerRunning ? "Pause" : "Start"}
          >
            {isTimerRunning ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsTimerRunning(false);
              setTimerSeconds(300);
            }}
            className="p-2 rounded-xl text-[#5E5947] hover:text-[#272A1F] hover:bg-black/5 transition-colors cursor-pointer"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Step Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="lg"
          icon={ChevronLeft}
          disabled={currentStep <= 0}
          onClick={() => setCurrentStep((prev) => prev - 1)}
        >
          Previous Step
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button
            variant="primary"
            size="lg"
            onClick={() => setCurrentStep((prev) => prev + 1)}
          >
            <span>Next Step</span>
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            icon={CheckCircle2}
            onClick={() => {
              alert("Congratulations! Cooking session recorded and pantry stock adjusted.");
              if (onFinish) onFinish();
            }}
          >
            Finish & Log Cooking
          </Button>
        )}
      </div>
    </div>
  );
};

export default CookingMode;

