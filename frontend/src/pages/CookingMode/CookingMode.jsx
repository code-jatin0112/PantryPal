import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHat, ArrowLeft, Plus } from 'lucide-react';

import CookingProgress from '../../components/cooking/CookingProgress';
import StepCard from '../../components/cooking/StepCard';
import IngredientChecklist from '../../components/cooking/IngredientChecklist';
import CookingTimer from '../../components/cooking/CookingTimer';
import RecipeSummary from '../../components/cooking/RecipeSummary';
import NotesPanel from '../../components/cooking/NotesPanel';
import CompletionModal from '../../components/cooking/CompletionModal';
import Button from '../../components/ui/Button';

import { getRecipes, getRecipeById, getRecipeIngredients } from '../../services/recipeService';
import {
  startCookingSession,
  updateCookingProgress,
  completeCookingSession,
} from '../../services/cookingService';
import { useToast } from '../../context/ToastContext';

const CookingMode = () => {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [recipe, setRecipe] = useState(null);
  const [steps, setSteps] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [backendSessionId, setBackendSessionId] = useState(null);

  // Cooking state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [checkedIngredients, setCheckedIngredients] = useState(new Set());
  const [notes, setNotes] = useState('');
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Storage key
  const storageKey = `pantrypal_cooking_${recipeId || recipe?.id || 'default'}`;

  // 1. Fetch recipe from backend
  useEffect(() => {
    let isMounted = true;

    const loadRecipeForCooking = async () => {
      setLoading(true);
      try {
        let activeId = recipeId;

        // If no specific recipeId, fetch first available from user's cookbook
        if (!activeId) {
          const recipesRes = await getRecipes();
          const list = recipesRes.data?.data?.recipes || recipesRes.data?.data || [];
          if (list.length > 0) {
            activeId = list[0].id;
          }
        }

        if (!activeId) {
          if (isMounted) {
            setRecipe(null);
            setLoading(false);
          }
          return;
        }

        const [recipeRes, ingRes, sessionRes] = await Promise.allSettled([
          getRecipeById(activeId),
          getRecipeIngredients(activeId),
          startCookingSession(activeId),
        ]);

        if (isMounted) {
          if (recipeRes.status === 'fulfilled') {
            const rData = recipeRes.value.data.data?.recipe || recipeRes.value.data.data;
            if (rData) {
              setRecipe(rData);

              // Parse instructions into structured steps
              let parsedSteps = [];
              if (Array.isArray(rData.instructions)) {
                parsedSteps = rData.instructions.map((inst, i) => ({
                  title: `Step ${i + 1}`,
                  instruction: typeof inst === 'string' ? inst : inst.description || '',
                  estimatedTime: 5,
                }));
              } else if (typeof rData.instructions === 'string' && rData.instructions.trim()) {
                parsedSteps = rData.instructions
                  .split('\n')
                  .map((l) => l.trim())
                  .filter((line) => line.length > 0)
                  .map((inst, i) => ({
                    title: `Step ${i + 1}`,
                    instruction: inst.replace(/^\d+[\.\)]\s*/, ''),
                    estimatedTime: 5,
                  }));
              }

              if (parsedSteps.length === 0) {
                parsedSteps = [
                  { title: 'Step 1: Preparation', instruction: 'Prepare ingredients according to recipe specifications.', estimatedTime: 5 },
                  { title: 'Step 2: Cooking', instruction: 'Cook the ingredients as required.', estimatedTime: 15 },
                  { title: 'Step 3: Plating', instruction: 'Plate and serve warm.', estimatedTime: 5 },
                ];
              }
              setSteps(parsedSteps);
            }
          }

          if (ingRes.status === 'fulfilled') {
            const ingList = ingRes.value.data.data?.ingredients || ingRes.value.data.data || [];
            setIngredients(ingList);
          }

          if (sessionRes.status === 'fulfilled' && sessionRes.value?.data?.id) {
            setBackendSessionId(sessionRes.value.data.id);
          }
        }
      } catch (err) {
        console.error('Failed to load cooking session recipe:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadRecipeForCooking();

    return () => {
      isMounted = false;
    };
  }, [recipeId]);

  // 2. Load saved progress from localStorage
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
    } catch {}
  }, [storageKey]);

  // 3. Save progress
  const saveProgress = useCallback(
    (stepIdx, compSteps, chkIngs, notesText) => {
      try {
        const stateToSave = {
          currentStep: stepIdx,
          completedSteps: Array.from(compSteps),
          checkedIngredients: Array.from(chkIngs),
          notes: notesText,
          backendSessionId,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));

        if (backendSessionId) {
          updateCookingProgress(backendSessionId, {
            currentStep: stepIdx,
            completedSteps: Array.from(compSteps),
          }).catch(() => {});
        }
      } catch {}
    },
    [storageKey, backendSessionId]
  );

  // Step navigation
  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      const nextCompleted = new Set(completedSteps).add(currentStepIndex);
      setCurrentStepIndex(nextIdx);
      setCompletedSteps(nextCompleted);
      saveProgress(nextIdx, nextCompleted, checkedIngredients, notes);
    } else {
      handleFinishRecipe();
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      saveProgress(prevIdx, completedSteps, checkedIngredients, notes);
    }
  };

  const handleSelectStep = (index) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
      saveProgress(index, completedSteps, checkedIngredients, notes);
    }
  };

  const handleToggleStepComplete = (index) => {
    const updated = new Set(completedSteps);
    if (updated.has(index)) {
      updated.delete(index);
    } else {
      updated.add(index);
      toast(`Step ${index + 1} completed! ✨`, 'success');
    }
    setCompletedSteps(updated);
    saveProgress(currentStepIndex, updated, checkedIngredients, notes);
  };

  const handleToggleIngredient = (index) => {
    const updated = new Set(checkedIngredients);
    if (updated.has(index)) {
      updated.delete(index);
    } else {
      updated.add(index);
    }
    setCheckedIngredients(updated);
    saveProgress(currentStepIndex, completedSteps, updated, notes);
  };

  const handleNotesChange = (newNotes) => {
    setNotes(newNotes);
    saveProgress(currentStepIndex, completedSteps, checkedIngredients, newNotes);
  };

  const handleFinishRecipe = async () => {
    const allDone = new Set(Array.from({ length: steps.length }, (_, i) => i));
    setCompletedSteps(allDone);
    setShowCompletionModal(true);

    if (backendSessionId) {
      try {
        await completeCookingSession(backendSessionId);
      } catch {}
    }
  };

  const handleCookAgain = () => {
    setCurrentStepIndex(0);
    setCompletedSteps(new Set());
    setCheckedIngredients(new Set());
    setShowCompletionModal(false);
    localStorage.removeItem(storageKey);
    toast('Cooking studio session reset. Ready to cook again! 🍳', 'info');
  };

  const handleExit = () => {
    navigate('/recipes');
  };

  const handleBackToRecipes = () => {
    navigate('/recipes');
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(138,144,112,0.15)] flex items-center justify-center text-[var(--color-sage)] animate-pulse">
          <ChefHat size={24} />
        </div>
        <p className="text-sm font-semibold text-[var(--color-sage)]">Loading Cooking Studio...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="py-16 max-w-lg mx-auto text-center space-y-5 bg-white p-8 rounded-3xl border border-[rgba(138,144,112,0.2)] shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-parchment)] flex items-center justify-center text-[var(--color-sage)] mx-auto">
          <ChefHat size={32} />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-[var(--color-dark)]">No recipe selected</h2>
          <p className="text-xs text-[var(--color-sage)]">
            Select a recipe from your personal cookbook or create a new recipe to launch the cooking studio.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2.5 pt-2 flex-wrap">
          <Button variant="secondary" size="md" icon={ArrowLeft} onClick={() => navigate('/recipes')}>
            Cookbook
          </Button>
          <Button variant="secondary" size="md" onClick={() => navigate('/ai-recommendations')}>
            AI Recipes
          </Button>
          <Button variant="primary" size="md" icon={Plus} onClick={() => navigate('/recipes/new')}>
            Create Recipe
          </Button>
        </div>
      </div>
    );
  }

  const currentStep = steps[currentStepIndex] || {
    title: `Step ${currentStepIndex + 1}`,
    instruction: 'Follow recipe instructions.',
    estimatedTime: 5,
  };

  const totalCookTime = (recipe.prepTime || 0) + (recipe.cookTime || 0) || 30;

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
            recipeId={recipe.id}
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
