import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

import CookingProgress from '../../components/cooking/CookingProgress';
import StepCard from '../../components/cooking/StepCard';
import IngredientChecklist from '../../components/cooking/IngredientChecklist';
import CookingTimer from '../../components/cooking/CookingTimer';
import RecipeSummary from '../../components/cooking/RecipeSummary';
import NotesPanel from '../../components/cooking/NotesPanel';
import CompletionModal from '../../components/cooking/CompletionModal';
import { DEFAULT_COOKING_RECIPE } from '../../components/cooking/cookingMockData';

import { getRecipeById, getRecipeIngredients } from '../../services/recipeService';
import { useToast } from '../../context/ToastContext';

const CookingMode = () => {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [recipe, setRecipe] = useState(DEFAULT_COOKING_RECIPE);
  const [steps, setSteps] = useState(DEFAULT_COOKING_RECIPE.steps);
  const [ingredients, setIngredients] = useState(DEFAULT_COOKING_RECIPE.ingredients);

  // Cooking state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [checkedIngredients, setCheckedIngredients] = useState(new Set());
  const [notes, setNotes] = useState('');
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Storage key
  const storageKey = `pantrypal_cooking_${recipeId || 'default'}`;

  // 1. Load initial saved state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.currentStep === 'number') setCurrentStepIndex(parsed.currentStep);
        if (Array.isArray(parsed.completedSteps)) setCompletedSteps(new Set(parsed.completedSteps));
        if (Array.isArray(parsed.checkedIngredients)) setCheckedIngredients(new Set(parsed.checkedIngredients));
        if (typeof parsed.notes === 'string') setNotes(parsed.notes);
      }
    } catch {
      // Ignore localStorage parse errors
    }
  }, [storageKey]);

  // 2. Fetch recipe from backend if exists, otherwise fallback to realistic mock recipe
  useEffect(() => {
    if (!recipeId || recipeId === 'demo' || recipeId === 'butter-chicken') {
      return;
    }

    const fetchRecipe = async () => {
      try {
        const [recipeRes, ingRes] = await Promise.allSettled([
          getRecipeById(recipeId),
          getRecipeIngredients(recipeId),
        ]);

        if (recipeRes.status === 'fulfilled') {
          const rData = recipeRes.value.data.data?.recipe || recipeRes.value.data.data;
          if (rData) {
            setRecipe((prev) => ({
              ...prev,
              ...rData,
              title: rData.title || rData.name || prev.title,
            }));

            // Parse instructions into structured steps if available
            if (rData.instructions) {
              const parsedSteps = Array.isArray(rData.instructions)
                ? rData.instructions.map((inst, i) => ({
                    title: `Step ${i + 1}`,
                    instruction: typeof inst === 'string' ? inst : inst.description || '',
                    estimatedTime: 5,
                  }))
                : String(rData.instructions)
                    .split('\n')
                    .filter((line) => line.trim().length > 0)
                    .map((inst, i) => ({
                      title: `Step ${i + 1}`,
                      instruction: inst.replace(/^\d+[\.\)]\s*/, ''),
                      estimatedTime: 5,
                    }));

              if (parsedSteps.length > 0) {
                setSteps(parsedSteps);
              }
            }
          }
        }

        if (ingRes.status === 'fulfilled') {
          const ingList = ingRes.value.data.data?.ingredients || ingRes.value.data.data || [];
          if (ingList.length > 0) {
            setIngredients(ingList);
          }
        }
      } catch {
        // Fallback gracefully to default rich recipe data
      }
    };

    fetchRecipe();
  }, [recipeId]);

  // 3. Save progress to localStorage
  const saveProgress = useCallback(
    (stepIdx, compSteps, chkIngs, notesText) => {
      try {
        const stateToSave = {
          currentStep: stepIdx,
          completedSteps: Array.from(compSteps),
          checkedIngredients: Array.from(chkIngs),
          notes: notesText,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      } catch {
        // LocalStorage quota or access error
      }
    },
    [storageKey]
  );

  // Toggle step complete
  const handleToggleStepComplete = () => {
    const next = new Set(completedSteps);
    if (next.has(currentStepIndex)) {
      next.delete(currentStepIndex);
    } else {
      next.add(currentStepIndex);
      toast(`Step ${currentStepIndex + 1} completed! ✨`, 'success');
    }
    setCompletedSteps(next);
    saveProgress(currentStepIndex, next, checkedIngredients, notes);
  };

  // Step navigation
  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      saveProgress(nextIdx, completedSteps, checkedIngredients, notes);
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      saveProgress(prevIdx, completedSteps, checkedIngredients, notes);
    }
  };

  const handleSelectStep = (idx) => {
    setCurrentStepIndex(idx);
    saveProgress(idx, completedSteps, checkedIngredients, notes);
  };

  // Toggle ingredient checklist
  const handleToggleIngredient = (idx) => {
    const next = new Set(checkedIngredients);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setCheckedIngredients(next);
    saveProgress(currentStepIndex, completedSteps, next, notes);
  };

  // Notes update
  const handleNotesChange = (text) => {
    setNotes(text);
    saveProgress(currentStepIndex, completedSteps, checkedIngredients, text);
  };

  // Finish Recipe
  const handleFinishRecipe = () => {
    // Mark all steps complete
    const all = new Set(steps.map((_, i) => i));
    setCompletedSteps(all);
    saveProgress(currentStepIndex, all, checkedIngredients, notes);
    setShowCompletionModal(true);
  };

  // Cook Again action
  const handleCookAgain = () => {
    setCurrentStepIndex(0);
    setCompletedSteps(new Set());
    setCheckedIngredients(new Set());
    setShowCompletionModal(false);
    localStorage.removeItem(storageKey);
    toast('Cook session reset! Ready to start fresh. 🍳', 'info');
  };

  const handleBackToRecipes = () => {
    setShowCompletionModal(false);
    navigate('/recipes');
  };

  const handleExit = () => {
    navigate(`/recipes/${recipeId && recipeId !== 'butter-chicken-demo' ? recipeId : ''}`);
  };

  const currentStep = steps[currentStepIndex] || steps[0];
  const totalCookTime = (recipe.prepTime || 15) + (recipe.cookTime || 25);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* ── Top Header & Progress ── */}
      <CookingProgress
        recipeTitle={recipe.title || recipe.name}
        cuisine={recipe.cuisine || recipe.cuisineType}
        difficulty={recipe.difficulty || 'MEDIUM'}
        totalTime={totalCookTime}
        servings={recipe.servings || 4}
        currentStepIndex={currentStepIndex}
        totalSteps={steps.length}
        completedStepIds={completedSteps}
        onExit={handleExit}
        onStepSelect={handleSelectStep}
      />

      {/* ── Main 3-Column Studio Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Recipe Snapshot & Ingredient Checklist (3 Cols) */}
        <div className="lg:col-span-3 space-y-5 order-2 lg:order-1">
          <RecipeSummary recipe={recipe} />
          <IngredientChecklist
            ingredients={ingredients}
            checkedIndices={checkedIngredients}
            onToggleIngredient={handleToggleIngredient}
          />
        </div>

        {/* Center Main: Large Step Card (6 Cols) */}
        <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
          <StepCard
            step={currentStep}
            stepIndex={currentStepIndex}
            totalSteps={steps.length}
            isCompleted={completedSteps.has(currentStepIndex)}
            onToggleComplete={handleToggleStepComplete}
            onPrevious={handlePreviousStep}
            onNext={handleNextStep}
            onFinish={handleFinishRecipe}
          />

          {/* Bottom Notes Panel */}
          <NotesPanel
            recipeId={recipeId}
            initialNotes={notes}
            onNotesChange={handleNotesChange}
          />
        </div>

        {/* Right Sidebar: Kitchen Countdown Timer (3 Cols) */}
        <div className="lg:col-span-3 space-y-5 order-3">
          <CookingTimer />
        </div>
      </div>

      {/* ── Completion Celebration Modal ── */}
      <CompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        recipeTitle={recipe.title || recipe.name}
        totalTime={totalCookTime}
        servings={recipe.servings || 4}
        onCookAgain={handleCookAgain}
        onBackToRecipes={handleBackToRecipes}
      />
    </motion.div>
  );
};

export default CookingMode;
