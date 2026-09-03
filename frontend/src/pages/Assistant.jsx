import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessage } from '../services/aiService';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  Sparkles, Send, User, Bot, Trash2,
  ChefHat, Lightbulb, UtensilsCrossed, RotateCcw,
} from 'lucide-react';

// ── Typing Indicator ──────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex items-end gap-3">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-bark)] flex items-center justify-center flex-shrink-0 shadow-sm">
      <Bot size={16} className="text-white" />
    </div>
    <div className="bg-white border border-[rgba(138,144,112,0.18)] rounded-2xl rounded-bl-sm px-4 py-3">
      <div className="flex gap-1.5 items-center h-5">
        {[0, 150, 300].map((delay) => (
          <div key={delay} className="w-2 h-2 bg-[var(--color-sage)] rounded-full animate-bounce"
            style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
    </div>
  </div>
);

// ── Recipe Card ───────────────────────────────────────────
const RecipeCard = ({ recipe }) => {
  if (!recipe || typeof recipe !== 'object') return null;
  return (
    <div className="mt-3 bg-[var(--color-parchment)] border border-[rgba(184,195,154,0.4)] rounded-xl p-4 text-sm space-y-3">
      {recipe.name && <h3 className="font-bold text-[var(--color-dark)] text-base">{recipe.name}</h3>}
      {recipe.description && <p className="text-[var(--color-sage)] italic text-sm">{recipe.description}</p>}
      {(recipe.prepTime || recipe.cookTime || recipe.servings) && (
        <div className="flex flex-wrap gap-3 text-xs font-semibold text-[var(--color-sage)]">
          {recipe.prepTime  && <span className="flex items-center gap-1">⏱ Prep: {recipe.prepTime}</span>}
          {recipe.cookTime  && <span className="flex items-center gap-1">🔥 Cook: {recipe.cookTime}</span>}
          {recipe.servings  && <span className="flex items-center gap-1">🍽 Serves: {recipe.servings}</span>}
        </div>
      )}
      {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && (
        <div>
          <p className="font-bold text-[var(--color-dark)] mb-1.5">Ingredients</p>
          <ul className="space-y-1">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-2 text-[var(--color-dark)] opacity-80">
                <span className="text-[var(--color-olive)] mt-0.5">•</span>
                <span>{typeof ing === 'string' ? ing : `${ing.quantity ?? ''} ${ing.unit ?? ''} ${ing.name ?? ''}`.trim()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {Array.isArray(recipe.instructions) && recipe.instructions.length > 0 && (
        <div>
          <p className="font-bold text-[var(--color-dark)] mb-1.5">Instructions</p>
          <ol className="space-y-2">
            {recipe.instructions.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-[var(--color-dark)] opacity-80">
                <span className="w-5 h-5 rounded-full bg-[var(--color-sage)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <span className="leading-relaxed">{typeof step === 'string' ? step : step.description}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

// ── Message Bubble ────────────────────────────────────────
const MessageBubble = ({ msg, index }) => {
  const isUser = msg.role === 'user';
  let parsedRecipe = null;
  if (!isUser && msg.data) {
    const d = msg.data;
    if (d.recipe) parsedRecipe = d.recipe;
    else if (d.recipes?.[0]) parsedRecipe = d.recipes[0];
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
        isUser
          ? 'bg-gradient-to-br from-[var(--color-olive)] to-[var(--color-sage)]'
          : 'bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-bark)]'
      }`}>
        {isUser ? <User size={15} className="text-white" /> : <Bot size={15} className="text-white" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-[var(--color-sage)] text-white rounded-br-sm shadow-sm'
            : 'bg-white border border-[rgba(138,144,112,0.18)] text-[var(--color-dark)] rounded-bl-sm shadow-sm'
        }`}>
          {msg.content}
        </div>
        {parsedRecipe && <RecipeCard recipe={parsedRecipe} />}
        <span className="text-[10px] text-[rgba(138,144,112,0.55)] mt-1 px-1">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
};

// ── Suggestion Chips ──────────────────────────────────────
const SUGGESTIONS = [
  { icon: ChefHat,          text: 'What can I cook with tomatoes, pasta, and garlic?' },
  { icon: Lightbulb,        text: 'Give me a healthy breakfast idea for tomorrow' },
  { icon: UtensilsCrossed,  text: 'Suggest a quick 20-minute dinner recipe' },
  { icon: RotateCcw,        text: 'What should I do with ingredients expiring soon?' },
];

// ── Main Assistant Page ───────────────────────────────────
const Assistant = () => {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showClear, setShowClear] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || isLoading) return;

    const userMsg = { role: 'user', content: userText, timestamp: new Date().toISOString() };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setIsLoading(true);

    const historyForApi = messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await sendChatMessage(userText, historyForApi);
      const result = res.data.data;
      setMessages((prev) => [...prev, {
        role:      'assistant',
        content:   result.message || result.reply || 'Here is what I found!',
        data:      result,
        timestamp: new Date().toISOString(),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        role:      'assistant',
        content:   "Sorry, I'm having trouble connecting right now. Please make sure your backend is running and try again.",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="h-[calc(100vh-60px)] md:h-screen flex flex-col bg-[var(--color-parchment)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(138,144,112,0.12)] bg-white flex-shrink-0 shadow-[0_1px_4px_rgba(39,42,31,0.05)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-bark)] flex items-center justify-center shadow-sm">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-[var(--color-dark)] text-base leading-tight">AI Kitchen Assistant</h1>
            <p className="text-[var(--color-sage)] text-xs">Powered by Gemini · Grounded in your pantry</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setShowClear(true)}
            className="p-2 rounded-xl text-[var(--color-sage)] hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Clear conversation"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
        {/* Welcome state */}
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full gap-6 text-center py-8"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-sage)]/20 to-[var(--color-olive)]/30 flex items-center justify-center">
                <Sparkles size={30} className="text-[var(--color-bark)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--color-dark)] mb-2">Your AI Kitchen Assistant</h2>
                <p className="text-sm text-[var(--color-sage)] max-w-xs leading-relaxed">
                  Ask me anything about recipes, meal planning, or what to cook with your pantry ingredients!
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {SUGGESTIONS.map(({ icon: Icon, text }) => (
                  <button
                    key={text}
                    onClick={() => sendMessage(text)}
                    className="flex items-start gap-3 text-left p-4 bg-white border border-[rgba(138,144,112,0.18)] rounded-2xl hover:border-[var(--color-sage)] hover:shadow-sm transition-all text-sm text-[var(--color-dark)] group"
                  >
                    <Icon size={16} className="text-[var(--color-sage)] group-hover:text-[var(--color-bark)] transition-colors flex-shrink-0 mt-0.5" />
                    <span>{text}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} index={i} />
        ))}

        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="px-5 py-4 bg-white border-t border-[rgba(138,144,112,0.12)] flex-shrink-0">
        <div className="flex items-end gap-3 bg-[var(--color-parchment)] border border-[rgba(138,144,112,0.3)] rounded-2xl px-4 py-3 focus-within:border-[var(--color-sage)] focus-within:shadow-[0_0_0_3px_rgba(138,144,112,0.12)] transition-all">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me what to cook…"
            className="flex-1 bg-transparent outline-none resize-none text-sm text-[var(--color-dark)] placeholder-[var(--color-sage)] leading-relaxed max-h-32"
            style={{ fieldSizing: 'content' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 bg-[var(--color-sage)] hover:bg-[var(--color-bark)] disabled:bg-[rgba(138,144,112,0.3)] text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
            aria-label="Send message"
          >
            <Send size={15} />
          </button>
        </div>
        <p className="text-[10px] text-[rgba(138,144,112,0.5)] text-center mt-2">Enter to send · Shift+Enter for new line</p>
      </div>

      {/* Clear confirm */}
      <ConfirmDialog
        isOpen={showClear}
        onClose={() => setShowClear(false)}
        onConfirm={() => { setMessages([]); setShowClear(false); }}
        title="Clear conversation?"
        description="All messages will be removed. This cannot be undone."
        confirmLabel="Clear Chat"
        variant="warning"
      />
    </div>
  );
};

export default Assistant;
