import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHat, ArrowLeft, Plus, AlertCircle } from 'lucide-react';

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
  getActiveCookingSession,
  updateCookingProgress,
  completeCookingSession,
} from '../../services/cookingService';
import { usePantry } from '../../hooks/usePantry';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorHandler';

const CookingMode = () => {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const rawToast = useToast();
  const toast = useCallback(
    (msg, type) => {
      if (typeof rawToast === 'function') {
        rawToast(msg, type);
      }
    },
    [rawToast]
  );
  const { activePantry, refresh: refreshPantry } = usePantry() || {};

  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [startingNewSession, setStartingNewSession] = useState(false);
  const [syncedStep, setSyncedStep] = useState(0);
  const [syncError, setSyncError] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [steps, setSteps] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [backendSessionId, setBackendSessionId] = useState(null);

  const syncSeqRef = useRef(0);

  // Cooking state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [checkedIngredients, setCheckedIngredients] = useState(new Set());
  const [notes, setNotes] = useState('');
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Storage key
  const storageKey = `pantrypal_cooking_${recipeId || recipe?.id || 'default'}`;

  // 1. Fetch recipe and initialize or resume cooking session
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

        const [recipeRes, ingRes] = await Promise.allSettled([
          getRecipeById(activeId),
          getRecipeIngredients(activeId),
        ]);

        if (isMounted) {
          let rData = null;
          if (recipeRes.status === 'fulfilled') {
            rData = recipeRes.value.data?.data?.recipe || recipeRes.value.data?.data;
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
            const ingList = ingRes.value.data?.data?.ingredients || ingRes.value.data?.data || [];
            setIngredients(ingList);
          }

          // Resume active cooking session or start a new one
          let session = null;
          try {
            const activeRes = await getActiveCookingSession(activeId);
            session = activeRes?.data?.session || activeRes?.session || null;
          } catch (err) {
            // Re-thrown errors represent genuine auth, server, or network errors
            const errMsg = getErrorMessage(err, 'Failed to connect to active cooking session.');
            toast(errMsg, 'error');
            setSyncError(errMsg);
            return;
          }

          if (!session) {
            try {
              const startRes = await startCookingSession(activeId, {
                servings: rData?.servings || 4,
              });
              session = startRes.data?.session || startRes.session;
            } catch (err) {
              if (err.response?.status === 409 && (err.response?.data?.data?.session || err.response?.data?.session)) {
                session = err.response.data.data?.session || err.response.data.session;
              } else {
                const errMsg = getErrorMessage(err, 'Failed to start cooking session.');
                toast(errMsg, 'error');
                setSyncError(errMsg);
                return;
              }
            }
          }

          if (session?.id) {
            setBackendSessionId(session.id);
            const serverStep =
              typeof session.currentStep === 'number' && session.currentStep >= 1
                ? session.currentStep - 1
                : 0;

            let restoredFromLocal = false;
            try {
              const saved = localStorage.getItem(storageKey);
              if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.backendSessionId === session.id) {
                  // Matching active session
                  const localStep =
                    typeof parsed.currentStep === 'number' ? parsed.currentStep : serverStep;

                  if (localStep > serverStep) {
                    setCurrentStepIndex(localStep);
                    setSyncedStep(serverStep);
                    setSyncError(
                      `Local progress (Step ${localStep + 1}) is ahead of server (Step ${serverStep + 1}).`
                    );
                  } else {
                    setCurrentStepIndex(serverStep);
                    setSyncedStep(serverStep);
                    setSyncError(null);
                  }

                  if (Array.isArray(parsed.completedSteps)) {
                    setCompletedSteps(new Set(parsed.completedSteps));
                  } else {
                    const prevCompleted = new Set();
                    const activeStep = Math.max(localStep, serverStep);
                    for (let i = 0; i < activeStep; i++) {
                      prevCompleted.add(i);
                    }
                    setCompletedSteps(prevCompleted);
                  }

                  if (Array.isArray(parsed.checkedIngredients)) {
                    setCheckedIngredients(new Set(parsed.checkedIngredients));
                  }
                  if (typeof parsed.notes === 'string') {
                    setNotes(parsed.notes);
                  }

                  restoredFromLocal = true;
                } else {
                  // Stale data belonging to another session: discard it!
                  localStorage.removeItem(storageKey);
                }
              }
            } catch {}

            if (!restoredFromLocal) {
              setCurrentStepIndex(serverStep);
              setSyncedStep(serverStep);
              setSyncError(null);
              setCheckedIngredients(new Set());
              setNotes('');

              const prevCompleted = new Set();
              for (let i = 0; i < serverStep; i++) {
                prevCompleted.add(i);
              }
              setCompletedSteps(prevCompleted);

              try {
                localStorage.setItem(
                  storageKey,
                  JSON.stringify({
                    currentStep: serverStep,
                    completedSteps: Array.from(prevCompleted),
                    checkedIngredients: [],
                    notes: '',
                    backendSessionId: session.id,
                    updatedAt: new Date().toISOString(),
                  })
                );
              } catch {}
            }
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

  // 2. Save progress with sequence tracking to prevent stale async overwrites
  const saveProgress = useCallback(
    async (stepIdx, compSteps, chkIngs, notesText) => {
      // 1. Immediately persist locally
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
      } catch {}

      // 2. Sync to backend if session is active
      if (backendSessionId) {
        const reqSeq = ++syncSeqRef.current;
        setSyncing(true);
        try {
          // Backend step index is 1-based (min: 1)
          await updateCookingProgress(backendSessionId, {
            currentStep: stepIdx + 1,
            completedSteps: Array.from(compSteps),
          });
          // Prevent outdated async responses from overwriting newer progress
          if (reqSeq === syncSeqRef.current) {
            setSyncedStep(stepIdx);
            setSyncError(null);
          }
        } catch (err) {
          if (reqSeq === syncSeqRef.current) {
            const msg = getErrorMessage(err, 'Failed to save progress to server.');
            setSyncError(msg);
            toast(`${msg} Progress saved locally only.`, 'warning');
          }
        } finally {
          if (reqSeq === syncSeqRef.current) {
            setSyncing(false);
          }
        }
      }
    },
    [storageKey, backendSessionId, toast]
  );

  const retrySyncProgress = async () => {
    if (!backendSessionId) return;
    const reqSeq = ++syncSeqRef.current;
    setSyncing(true);
    try {
      // Retry using actual pending local state
      await updateCookingProgress(backendSessionId, {
        currentStep: currentStepIndex + 1,
        completedSteps: Array.from(completedSteps),
      });
      if (reqSeq === syncSeqRef.current) {
        setSyncedStep(currentStepIndex);
        setSyncError(null);
        toast('Progress synced with server! ☁️', 'success');

        try {
          const stateToSave = {
            currentStep: currentStepIndex,
            completedSteps: Array.from(completedSteps),
            checkedIngredients: Array.from(checkedIngredients),
            notes,
            backendSessionId,
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem(storageKey, JSON.stringify(stateToSave));
        } catch {}
      }
    } catch (err) {
      if (reqSeq === syncSeqRef.current) {
        const msg = getErrorMessage(err, 'Failed to sync progress with server.');
        setSyncError(`Sync failed: ${msg}. Local progress (Step ${currentStepIndex + 1}) remains saved locally.`);
        toast(msg, 'error');
      }
    } finally {
      if (reqSeq === syncSeqRef.current) {
        setSyncing(false);
      }
    }
  };

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
    if (!backendSessionId) {
      toast('No active cooking session to complete.', 'error');
      return;
    }

    if (!activePantry?.id) {
      toast('Please select or create a pantry to deduct ingredients from.', 'error');
      return;
    }

    setCompleting(true);
    try {
      await completeCookingSession(backendSessionId, { pantryId: activePantry.id });

      const allDone = new Set(Array.from({ length: steps.length }, (_, i) => i));
      setCompletedSteps(allDone);
      setShowCompletionModal(true);
      // Clear completed session ID so it cannot be reused
      setBackendSessionId(null);
      localStorage.removeItem(storageKey);

      if (refreshPantry) {
        refreshPantry();
      }
      toast('Recipe completed! Pantry items have been deducted. 🍳', 'success');
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to complete cooking session.');
      toast(msg, 'error');
    } finally {
      setCompleting(false);
    }
  };

  const handleCookAgain = async () => {
    const targetRecipeId = recipeId || recipe?.id;
    if (!targetRecipeId) {
      toast('Cannot restart: recipe ID not found.', 'error');
      return;
    }

    setStartingNewSession(true);
    try {
      // 1. Create a genuinely new backend cooking session
      const startRes = await startCookingSession(targetRecipeId, {
        servings: recipe?.servings || 4,
      });
      const newSession = startRes.data?.session || startRes.session;

      if (!newSession?.id) {
        throw new Error('New cooking session creation did not return a valid session ID.');
      }

      // 2. Never reuse a completed session ID — assign the fresh one
      setBackendSessionId(newSession.id);
      setCurrentStepIndex(0);
      setSyncedStep(0);
      setSyncError(null);
      setCompletedSteps(new Set());
      setCheckedIngredients(new Set());
      setNotes('');

      // 3. Reset locally saved state for the new session
      localStorage.removeItem(storageKey);
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            currentStep: 0,
            completedSteps: [],
            checkedIngredients: [],
            notes: '',
            backendSessionId: newSession.id,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch {}

      // 4. Close modal and inform user
      setShowCompletionModal(false);
      toast('New cooking session started. Ready to cook again! 🍳', 'success');
    } catch (err) {
      // If new session creation fails, do not claim cooking has restarted
      const msg = getErrorMessage(err, 'Failed to start a new cooking session.');
      toast(msg, 'error');
    } finally {
      setStartingNewSession(false);
    }
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

      {/* ── Unsynced Server State / Retry Banner ── */}
      {(Boolean(syncError) || currentStepIndex !== syncedStep) && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-bold block">
                Progress not synced to server (Server: Step {syncedStep + 1} / Local: Step {currentStepIndex + 1})
              </span>
              <span className="text-[11px] text-amber-800/90">
                {syncError || 'Local changes have not been confirmed by the server.'}
              </span>
            </div>
          </div>
          <button
            type="button"
            disabled={syncing}
            onClick={retrySyncProgress}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors cursor-pointer self-end sm:self-auto"
          >
            {syncing ? 'Syncing...' : 'Retry Sync'}
          </button>
        </div>
      )}

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
            finishLoading={completing}
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
        isRestarting={startingNewSession}
      />
    </motion.div>
  );
};

export default CookingMode;
