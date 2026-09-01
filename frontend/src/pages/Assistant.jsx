import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/aiService';
import { Sparkles, Send, User, Bot, Trash2, ChefHat, Lightbulb, UtensilsCrossed, RotateCcw } from 'lucide-react';

// ─── Typing Indicator ─────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex items-end gap-3">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sage to-bark flex items-center justify-center flex-shrink-0">
      <Bot size={16} className="text-white" />
    </div>
    <div className="bg-white border border-sage/20 rounded-2xl rounded-bl-sm px-4 py-3">
      <div className="flex gap-1.5 items-center h-5">
        <div className="w-2 h-2 bg-sage rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-sage rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-sage rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

// ─── Recipe Card (renders when AI returns structured recipe data) ──────────────
const RecipeCard = ({ recipe }) => {
  if (!recipe || typeof recipe !== 'object') return null;
  return (
    <div className="mt-3 bg-parchment border border-olive/30 rounded-xl p-4 text-sm space-y-3">
      {recipe.name && <h3 className="font-bold text-bark text-base">{recipe.name}</h3>}
      {recipe.description && <p className="text-sage italic">{recipe.description}</p>}
      {recipe.prepTime && (
        <div className="flex gap-4 text-xs font-medium text-sage">
          {recipe.prepTime && <span>⏱ Prep: {recipe.prepTime}</span>}
          {recipe.cookTime && <span>🔥 Cook: {recipe.cookTime}</span>}
          {recipe.servings && <span>🍽 Serves: {recipe.servings}</span>}
        </div>
      )}
      {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && (
        <div>
          <p className="font-semibold text-bark mb-1.5">Ingredients</p>
          <ul className="space-y-1">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-2 text-bark/80">
                <span className="text-olive mt-0.5">•</span>
                <span>{typeof ing === 'string' ? ing : `${ing.quantity ?? ''} ${ing.unit ?? ''} ${ing.name ?? ''}`.trim()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {Array.isArray(recipe.instructions) && recipe.instructions.length > 0 && (
        <div>
          <p className="font-semibold text-bark mb-1.5">Instructions</p>
          <ol className="space-y-2">
            {recipe.instructions.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-bark/80">
                <span className="bg-sage text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <span>{typeof step === 'string' ? step : step.description}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

// ─── Single Message Bubble ────────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';

  // Try to extract a recipe object from the AI response
  let parsedRecipe = null;
  if (!isUser && msg.data) {
    const d = msg.data;
    if (d.recipe) parsedRecipe = d.recipe;
    else if (d.recipes && d.recipes[0]) parsedRecipe = d.recipes[0];
  }

  return (
    <div className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser
          ? 'bg-gradient-to-br from-olive to-sage'
          : 'bg-gradient-to-br from-sage to-bark'
      }`}>
        {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-sage text-white rounded-br-sm'
            : 'bg-white border border-sage/20 text-bark rounded-bl-sm'
        }`}>
          {msg.content}
        </div>
        {parsedRecipe && <RecipeCard recipe={parsedRecipe} />}
        <span className="text-xs text-sage/60 mt-1 px-1">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

// ─── Suggestion Chips ─────────────────────────────────────────────────────────
const suggestions = [
  { icon: ChefHat, text: 'What can I cook with tomatoes, pasta, and garlic?' },
  { icon: Lightbulb, text: 'Give me a healthy breakfast idea for tomorrow' },
  { icon: UtensilsCrossed, text: 'Suggest a quick 20-minute dinner recipe' },
  { icon: RotateCcw, text: 'What should I do with ingredients expiring soon?' },
];

// ─── Main AI Assistant Page ───────────────────────────────────────────────────
const Assistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

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

    // Build conversation history for the API (exclude timestamps)
    const historyForApi = messages.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await sendChatMessage(userText, historyForApi);
      const result = res.data.data;

      const aiMsg = {
        role: 'assistant',
        content: result.message || result.reply || 'Here is what I found!',
        data: result,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please make sure your backend is running!",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    if (messages.length === 0) return;
    if (window.confirm('Clear conversation history?')) setMessages([]);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-sage/20 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sage to-bark flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-bark text-lg leading-tight">AI Kitchen Assistant</h1>
            <p className="text-sage text-xs">Powered by Gemini · Grounded in your pantry</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 rounded-xl text-sage hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Clear conversation"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-olive/40 to-sage/30 flex items-center justify-center">
              <Sparkles size={32} className="text-bark" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-bark mb-2">Your AI Kitchen Assistant</h2>
              <p className="text-sage text-sm max-w-xs leading-relaxed">
                Ask me anything about recipes, meal planning, or what to cook with your pantry ingredients!
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {suggestions.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => sendMessage(text)}
                  className="flex items-start gap-3 text-left p-4 bg-white border border-sage/20 rounded-2xl hover:border-sage hover:shadow-md transition-all text-sm text-bark group"
                >
                  <Icon size={18} className="text-sage group-hover:text-bark transition-colors flex-shrink-0 mt-0.5" />
                  <span>{text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="px-6 py-4 bg-white border-t border-sage/20 flex-shrink-0">
        <div className="flex items-end gap-3 bg-parchment border border-sage/30 rounded-2xl px-4 py-3 focus-within:border-olive focus-within:ring-2 focus-within:ring-olive/30 transition-all">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me what to cook…"
            className="flex-1 bg-transparent outline-none resize-none text-sm text-bark placeholder-sage leading-relaxed max-h-32"
            style={{ fieldSizing: 'content' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 bg-sage hover:bg-bark disabled:bg-sage/30 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-sage/60 text-center mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
};

export default Assistant;
