import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CookingProgress from '../components/cooking/CookingProgress';
import StepCard from '../components/cooking/StepCard';
import IngredientChecklist from '../components/cooking/IngredientChecklist';
import CompletionModal from '../components/cooking/CompletionModal';
import CookingMode from '../pages/CookingMode/CookingMode';
import {
  getActiveCookingSession,
  updateCookingProgress,
  startCookingSession,
  completeCookingSession,
} from '../services/cookingService';
import * as cookingService from '../services/cookingService';
import * as recipeService from '../services/recipeService';
import api from '../services/api';

vi.mock('../hooks/usePantry', () => ({
  usePantry: () => ({
    activePantry: { id: 'pantry-123', name: 'Main Kitchen' },
    refresh: vi.fn(),
  }),
}));

const mockRecipe = {
  id: 'rec-test-1',
  title: 'Classic Margherita Pizza',
  servings: 2,
  prepTime: 15,
  cookTime: 15,
  cuisine: 'Italian',
  difficulty: 'EASY',
  instructions: [
    'Prepare pizza dough and preheat oven.',
    'Roll out the dough into a 12-inch circle.',
    'Spread tomato sauce evenly over the crust.',
    'Top with fresh mozzarella and basil leaves.',
    'Bake at 475°F for 12-15 minutes until bubbly and golden.',
  ],
};

const mockIngredients = [
  { name: 'Pizza Dough', quantity: 1, unit: 'ball' },
  { name: 'Tomato Sauce', quantity: 150, unit: 'ml' },
  { name: 'Fresh Mozzarella', quantity: 200, unit: 'g' },
  { name: 'Fresh Basil', quantity: 10, unit: 'leaves' },
];

const mockStep = {
  title: 'Step 1: Marinate Chicken',
  instruction: 'Whisk yogurt, lemon juice, ginger, garlic, garam masala, and chili powder.',
  estimatedTime: 15,
};

describe('Cooking Mode Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });
  it('renders cooking progress bar with step progress and recipe summary', () => {
    render(
      <CookingProgress
        recipeTitle="Royal Butter Chicken"
        cuisine="Indian"
        difficulty="MEDIUM"
        totalTime={40}
        servings={4}
        currentStepIndex={0}
        totalSteps={6}
        completedStepIds={new Set()}
        onExit={vi.fn()}
        onStepSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Royal Butter Chicken')).toBeInTheDocument();
    expect(screen.getByText(/40 mins/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of 6/i)).toBeInTheDocument();
  });

  it('renders StepCard with step instruction and navigation controls', () => {
    const handleNext = vi.fn();
    const handleToggleComplete = vi.fn();

    render(
      <StepCard
        step={mockStep}
        stepIndex={0}
        totalSteps={5}
        isCompleted={false}
        onToggleComplete={handleToggleComplete}
        onPrevious={vi.fn()}
        onNext={handleNext}
        onFinish={vi.fn()}
      />
    );

    expect(screen.getByText(/Step 1: Marinate Chicken/i)).toBeInTheDocument();
    expect(screen.getByText(/Whisk yogurt/i)).toBeInTheDocument();

    const completeBtn = screen.getByRole('button', { name: /Mark as Complete/i });
    fireEvent.click(completeBtn);
    expect(handleToggleComplete).toHaveBeenCalled();
  });

  it('renders ingredient checklist and toggles check state', () => {
    const handleToggle = vi.fn();
    const ingredients = [
      { name: 'Chicken Thighs', quantity: 800, unit: 'g' },
      { name: 'Greek Yogurt', quantity: 150, unit: 'g' },
    ];

    render(
      <IngredientChecklist
        ingredients={ingredients}
        checkedIndices={new Set([0])}
        onToggleIngredient={handleToggle}
      />
    );

    expect(screen.getByText(/Chicken Thighs/i)).toBeInTheDocument();
    expect(screen.getByText(/Greek Yogurt/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Greek Yogurt/i));
    expect(handleToggle).toHaveBeenCalledWith(1);
  });

  it('renders CompletionModal with celebration details', () => {
    render(
      <CompletionModal
        isOpen={true}
        onClose={vi.fn()}
        recipeTitle="Tuscan Salmon"
        totalTime={25}
        servings={2}
        onCookAgain={vi.fn()}
        onBackToRecipes={vi.fn()}
      />
    );

    expect(screen.getByText(/Bon Appétit!/i)).toBeInTheDocument();
    expect(screen.getByText('Tuscan Salmon')).toBeInTheDocument();
    expect(screen.getByText('25 Mins Total')).toBeInTheDocument();
    expect(screen.getByText('2 Portions')).toBeInTheDocument();
  });

  it('getActiveCookingSession returns null on 404 but re-throws network or server errors', async () => {
    const apiGetSpy = vi.spyOn(api, 'get');

    // 404 case: returns null
    apiGetSpy.mockRejectedValueOnce({ response: { status: 404 } });
    const result404 = await getActiveCookingSession('rec-1');
    expect(result404).toBeNull();

    // 500 error case: re-throws
    apiGetSpy.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Internal error' } } });
    await expect(getActiveCookingSession('rec-1')).rejects.toMatchObject({
      response: { status: 500 },
    });

    // Network error case: re-throws
    apiGetSpy.mockRejectedValueOnce(new Error('Network failure'));
    await expect(getActiveCookingSession('rec-1')).rejects.toThrow('Network failure');

    apiGetSpy.mockRestore();
  });

  it('updateCookingProgress ensures 1-based indexing for backend persistence', async () => {
    const apiPatchSpy = vi.spyOn(api, 'patch').mockResolvedValueOnce({ data: { success: true } });

    await updateCookingProgress('session-123', { currentStep: 0 });
    expect(apiPatchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/cooking-sessions/session-123/progress'),
      { currentStep: 1 }
    );

    apiPatchSpy.mockRestore();
  });

  it('restores local progress ahead of server state and displays accurate diff banner', async () => {
    vi.spyOn(recipeService, 'getRecipeById').mockResolvedValue({
      data: { data: { recipe: mockRecipe } },
    });
    vi.spyOn(recipeService, 'getRecipeIngredients').mockResolvedValue({
      data: { data: { ingredients: mockIngredients } },
    });
    // Server is at step 3 (currentStep: 3)
    vi.spyOn(cookingService, 'getActiveCookingSession').mockResolvedValue({
      session: { id: 'sess-active-100', currentStep: 3, totalSteps: 5 },
    });

    // Local storage has matching session ID at step 5 (0-based currentStep: 4)
    localStorage.setItem(
      'pantrypal_cooking_rec-test-1',
      JSON.stringify({
        backendSessionId: 'sess-active-100',
        currentStep: 4,
        completedSteps: [0, 1, 2, 3],
        notes: 'Extra crispy crust',
      })
    );

    render(
      <MemoryRouter initialEntries={['/recipes/rec-test-1/cook']}>
        <Routes>
          <Route path="/recipes/:recipeId/cook" element={<CookingMode />} />
        </Routes>
      </MemoryRouter>
    );

    // Should restore local progress at Step 5
    await screen.findByText('Step 5 of 5');

    // Should display exact server vs local diff banner
    expect(
      screen.getByText(/Progress not synced to server \(Server: Step 3 \/ Local: Step 5\)/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry Sync/i })).toBeInTheDocument();
  });

  it('reloads and successfully syncs pending local progress on retry', async () => {
    vi.spyOn(recipeService, 'getRecipeById').mockResolvedValue({
      data: { data: { recipe: mockRecipe } },
    });
    vi.spyOn(recipeService, 'getRecipeIngredients').mockResolvedValue({
      data: { data: { ingredients: mockIngredients } },
    });
    vi.spyOn(cookingService, 'getActiveCookingSession').mockResolvedValue({
      session: { id: 'sess-active-100', currentStep: 2, totalSteps: 5 },
    });

    localStorage.setItem(
      'pantrypal_cooking_rec-test-1',
      JSON.stringify({
        backendSessionId: 'sess-active-100',
        currentStep: 3, // UI Step 4
        completedSteps: [0, 1, 2],
      })
    );

    const updateProgressSpy = vi
      .spyOn(cookingService, 'updateCookingProgress')
      .mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter initialEntries={['/recipes/rec-test-1/cook']}>
        <Routes>
          <Route path="/recipes/:recipeId/cook" element={<CookingMode />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Step 4 of 5');

    const retryBtn = screen.getByRole('button', { name: /Retry Sync/i });
    fireEvent.click(retryBtn);

    // Must call updateCookingProgress with 1-based local pending step (4)
    await waitFor(() => {
      expect(updateProgressSpy).toHaveBeenCalledWith(
        'sess-active-100',
        expect.objectContaining({ currentStep: 4 })
      );
    });

    // Banner clears after successful sync
    await waitFor(() => {
      expect(
        screen.queryByText(/Progress not synced to server/i)
      ).not.toBeInTheDocument();
    });
  });

  it('failed retry preserves pending progress and keeps banner visible', async () => {
    vi.spyOn(recipeService, 'getRecipeById').mockResolvedValue({
      data: { data: { recipe: mockRecipe } },
    });
    vi.spyOn(recipeService, 'getRecipeIngredients').mockResolvedValue({
      data: { data: { ingredients: mockIngredients } },
    });
    vi.spyOn(cookingService, 'getActiveCookingSession').mockResolvedValue({
      session: { id: 'sess-active-100', currentStep: 2, totalSteps: 5 },
    });

    localStorage.setItem(
      'pantrypal_cooking_rec-test-1',
      JSON.stringify({
        backendSessionId: 'sess-active-100',
        currentStep: 4, // Step 5
        completedSteps: [0, 1, 2, 3],
      })
    );

    vi.spyOn(cookingService, 'updateCookingProgress').mockRejectedValueOnce(
      new Error('Connection timed out')
    );

    render(
      <MemoryRouter initialEntries={['/recipes/rec-test-1/cook']}>
        <Routes>
          <Route path="/recipes/:recipeId/cook" element={<CookingMode />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Step 5 of 5');

    const retryBtn = screen.getByRole('button', { name: /Retry Sync/i });
    fireEvent.click(retryBtn);

    // Progress is preserved on Step 5
    await screen.findByText(/Sync failed/i);
    expect(screen.getByText('Step 5 of 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry Sync/i })).toBeInTheDocument();
  });

  it('discards stale local data belonging to a different session', async () => {
    vi.spyOn(recipeService, 'getRecipeById').mockResolvedValue({
      data: { data: { recipe: mockRecipe } },
    });
    vi.spyOn(recipeService, 'getRecipeIngredients').mockResolvedValue({
      data: { data: { ingredients: mockIngredients } },
    });
    // Active session on server has ID 'sess-brand-new' at step 1
    vi.spyOn(cookingService, 'getActiveCookingSession').mockResolvedValue({
      session: { id: 'sess-brand-new', currentStep: 1, totalSteps: 5 },
    });

    // localStorage contains stale data from old completed session 'sess-stale-999' at step 4
    localStorage.setItem(
      'pantrypal_cooking_rec-test-1',
      JSON.stringify({
        backendSessionId: 'sess-stale-999',
        currentStep: 3,
        completedSteps: [0, 1, 2],
        notes: 'Stale notes from yesterday',
      })
    );

    render(
      <MemoryRouter initialEntries={['/recipes/rec-test-1/cook']}>
        <Routes>
          <Route path="/recipes/:recipeId/cook" element={<CookingMode />} />
        </Routes>
      </MemoryRouter>
    );

    // Must start clean at Step 1, ignoring stale data
    await screen.findByText('Step 1 of 5');
    expect(screen.queryByText(/Progress not synced to server/i)).not.toBeInTheDocument();

    // Verify localStorage was cleaned of stale session ID
    const saved = JSON.parse(localStorage.getItem('pantrypal_cooking_rec-test-1'));
    expect(saved.backendSessionId).toBe('sess-brand-new');
  });

  it('Cook Again creates a genuinely new session ID and resets all cooking state', async () => {
    vi.spyOn(recipeService, 'getRecipeById').mockResolvedValue({
      data: { data: { recipe: mockRecipe } },
    });
    vi.spyOn(recipeService, 'getRecipeIngredients').mockResolvedValue({
      data: { data: { ingredients: mockIngredients } },
    });
    // Initial active session
    vi.spyOn(cookingService, 'getActiveCookingSession').mockResolvedValue({
      session: { id: 'sess-first-run', currentStep: 5, totalSteps: 5 },
    });
    vi.spyOn(cookingService, 'completeCookingSession').mockResolvedValue({
      data: { success: true },
    });
    const startSessionSpy = vi.spyOn(cookingService, 'startCookingSession').mockResolvedValue({
      session: { id: 'sess-second-run', currentStep: 1, totalSteps: 5 },
    });

    render(
      <MemoryRouter initialEntries={['/recipes/rec-test-1/cook']}>
        <Routes>
          <Route path="/recipes/:recipeId/cook" element={<CookingMode />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Step 5 of 5');

    // Complete the recipe to open CompletionModal
    const finishBtn = screen.getByRole('button', { name: /Finish Recipe/i });
    fireEvent.click(finishBtn);

    await screen.findByText(/Bon Appétit!/i);

    // Click Cook Again
    const cookAgainBtn = screen.getByRole('button', { name: /Cook Again/i });
    fireEvent.click(cookAgainBtn);

    // Verifies startCookingSession was called for recipe
    await waitFor(() => {
      expect(startSessionSpy).toHaveBeenCalledWith('rec-test-1', expect.anything());
    });

    // Completion modal closes and UI resets to Step 1
    await waitFor(() => {
      expect(screen.queryByText(/Bon Appétit!/i)).not.toBeInTheDocument();
    });
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();

    // Local storage has new session ID
    const saved = JSON.parse(localStorage.getItem('pantrypal_cooking_rec-test-1'));
    expect(saved.backendSessionId).toBe('sess-second-run');
  });

  it('failure creating a second session displays error and does not reset completion modal', async () => {
    vi.spyOn(recipeService, 'getRecipeById').mockResolvedValue({
      data: { data: { recipe: mockRecipe } },
    });
    vi.spyOn(recipeService, 'getRecipeIngredients').mockResolvedValue({
      data: { data: { ingredients: mockIngredients } },
    });
    vi.spyOn(cookingService, 'getActiveCookingSession').mockResolvedValue({
      session: { id: 'sess-first-run', currentStep: 5, totalSteps: 5 },
    });
    vi.spyOn(cookingService, 'completeCookingSession').mockResolvedValue({
      data: { success: true },
    });
    vi.spyOn(cookingService, 'startCookingSession').mockRejectedValueOnce(
      new Error('Database connectivity issue')
    );

    render(
      <MemoryRouter initialEntries={['/recipes/rec-test-1/cook']}>
        <Routes>
          <Route path="/recipes/:recipeId/cook" element={<CookingMode />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Step 5 of 5');

    const finishBtn = screen.getByRole('button', { name: /Finish Recipe/i });
    fireEvent.click(finishBtn);

    await screen.findByText(/Bon Appétit!/i);

    const cookAgainBtn = screen.getByRole('button', { name: /Cook Again/i });
    fireEvent.click(cookAgainBtn);

    // Modal remains open on failure
    await waitFor(() => {
      expect(screen.getByText(/Bon Appétit!/i)).toBeInTheDocument();
    });
  });

  it('prevents outdated async responses from overwriting newer progress', async () => {
    vi.spyOn(recipeService, 'getRecipeById').mockResolvedValue({
      data: { data: { recipe: mockRecipe } },
    });
    vi.spyOn(recipeService, 'getRecipeIngredients').mockResolvedValue({
      data: { data: { ingredients: mockIngredients } },
    });
    vi.spyOn(cookingService, 'getActiveCookingSession').mockResolvedValue({
      session: { id: 'sess-seq-test', currentStep: 1, totalSteps: 5 },
    });

    let resolveStep2;
    let resolveStep3;
    const progressPromiseStep2 = new Promise((resolve) => {
      resolveStep2 = resolve;
    });
    const progressPromiseStep3 = new Promise((resolve) => {
      resolveStep3 = resolve;
    });

    vi.spyOn(cookingService, 'updateCookingProgress')
      .mockImplementationOnce(() => progressPromiseStep2)
      .mockImplementationOnce(() => progressPromiseStep3);

    render(
      <MemoryRouter initialEntries={['/recipes/rec-test-1/cook']}>
        <Routes>
          <Route path="/recipes/:recipeId/cook" element={<CookingMode />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Step 1 of 5');

    // Click Next Step (advances to Step 2)
    const nextBtn1 = screen.getByRole('button', { name: /Next Step/i });
    fireEvent.click(nextBtn1);
    await screen.findByText('Step 2 of 5');

    // Click Next Step again (advances to Step 3)
    const nextBtn2 = screen.getByRole('button', { name: /Next Step/i });
    fireEvent.click(nextBtn2);
    await screen.findByText('Step 3 of 5');

    // Resolve Step 3 first
    resolveStep3({ data: { success: true } });
    await waitFor(() => {
      expect(screen.queryByText(/Progress not synced/i)).not.toBeInTheDocument();
    });

    // Resolve older Step 2 later
    resolveStep2({ data: { success: true } });

    // UI remains steady on Step 3 and is not downgraded or marked unsynced
    expect(screen.getByText('Step 3 of 5')).toBeInTheDocument();
    expect(screen.queryByText(/Progress not synced/i)).not.toBeInTheDocument();
  });

  it('updateCookingProgress serializes rapid calls and coalesces intermediate steps', async () => {
    let resolvePatch1;
    let resolvePatch2;

    const patchPromise1 = new Promise((resolve) => {
      resolvePatch1 = resolve;
    });
    const patchPromise2 = new Promise((resolve) => {
      resolvePatch2 = resolve;
    });

    const apiPatchSpy = vi.spyOn(api, 'patch')
      .mockImplementationOnce(() => patchPromise1)
      .mockImplementationOnce(() => patchPromise2);

    // Call Step 2
    const p1 = updateCookingProgress('session-queue-1', { currentStep: 2 });
    // Rapidly call Step 3 and Step 4 while Step 2 is in-flight
    const p2 = updateCookingProgress('session-queue-1', { currentStep: 3 });
    const p3 = updateCookingProgress('session-queue-1', { currentStep: 4 });

    expect(apiPatchSpy).toHaveBeenCalledTimes(1);
    expect(apiPatchSpy).toHaveBeenLastCalledWith(
      expect.stringContaining('/cooking-sessions/session-queue-1/progress'),
      { currentStep: 2 }
    );

    // Resolve Step 2
    resolvePatch1({ data: { session: { currentStep: 2 } } });
    await p1;

    // Queue should now automatically dispatch the latest pending step (4), coalescing intermediate step 3
    expect(apiPatchSpy).toHaveBeenCalledTimes(2);
    expect(apiPatchSpy).toHaveBeenLastCalledWith(
      expect.stringContaining('/cooking-sessions/session-queue-1/progress'),
      { currentStep: 4 }
    );

    // Resolve Step 4
    resolvePatch2({ data: { session: { currentStep: 4 } } });
    await Promise.all([p2, p3]);

    apiPatchSpy.mockRestore();
  });

  it('updateCookingProgress reliably persists intentional backward navigation in order', async () => {
    let resolvePatch1;
    let resolvePatch2;

    const patchPromise1 = new Promise((resolve) => {
      resolvePatch1 = resolve;
    });
    const patchPromise2 = new Promise((resolve) => {
      resolvePatch2 = resolve;
    });

    const apiPatchSpy = vi.spyOn(api, 'patch')
      .mockImplementationOnce(() => patchPromise1)
      .mockImplementationOnce(() => patchPromise2);

    // Navigating back: currently on Step 4, user clicks Step 3
    const p1 = updateCookingProgress('session-queue-2', { currentStep: 3 });
    // User quickly clicks Step 2 while Step 3 is in-flight
    const p2 = updateCookingProgress('session-queue-2', { currentStep: 2 });

    expect(apiPatchSpy).toHaveBeenCalledTimes(1);
    expect(apiPatchSpy).toHaveBeenLastCalledWith(
      expect.stringContaining('/cooking-sessions/session-queue-2/progress'),
      { currentStep: 3 }
    );

    // Step 3 finishes
    resolvePatch1({ data: { session: { currentStep: 3 } } });
    await p1;

    // Step 2 is dispatched next
    expect(apiPatchSpy).toHaveBeenCalledTimes(2);
    expect(apiPatchSpy).toHaveBeenLastCalledWith(
      expect.stringContaining('/cooking-sessions/session-queue-2/progress'),
      { currentStep: 2 }
    );

    resolvePatch2({ data: { session: { currentStep: 2 } } });
    await p2;

    apiPatchSpy.mockRestore();
  });
});
