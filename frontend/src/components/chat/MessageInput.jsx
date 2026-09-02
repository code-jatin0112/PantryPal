import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Sparkles } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const MAX_CHARS = 2000;

const MessageInput = ({ onSendMessage, disabled = false }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);
  const toast = useToast();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    setText('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) {
      setText(val);
      // Auto-grow height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
      }
    }
  };

  const handlePlaceholderAction = (actionName) => {
    toast(`${actionName} will be available in future releases.`, 'info');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[rgba(138,144,112,0.20)] rounded-2xl p-2.5 sm:p-3 shadow-[0_2px_8px_rgba(39,42,31,0.04)] focus-within:border-[var(--color-sage)] focus-within:ring-2 focus-within:ring-[rgba(138,144,112,0.15)] transition-all">
      {/* Input Area */}
      <textarea
        ref={textareaRef}
        rows={1}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Ask anything about recipes, cooking, pantry ingredients, or nutrition... (Enter to send)"
        aria-label="Ask AI Assistant"
        className="w-full bg-transparent text-xs sm:text-sm text-[var(--color-dark)] placeholder-[var(--color-sage)] focus:outline-none resize-none max-h-32 font-medium px-2 py-1"
      />

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[rgba(138,144,112,0.10)] mt-1">
        {/* Placeholder Attachment & Voice Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handlePlaceholderAction('Photo Attachment & Ingredient Scanner')}
            aria-label="Attach photo or recipe"
            className="p-1.5 rounded-lg text-[var(--color-sage)] hover:text-[var(--color-dark)] hover:bg-[var(--color-parchment)] transition-colors"
          >
            <Paperclip size={15} />
          </button>
          <button
            type="button"
            onClick={() => handlePlaceholderAction('Voice Dictation')}
            aria-label="Voice input"
            className="p-1.5 rounded-lg text-[var(--color-sage)] hover:text-[var(--color-dark)] hover:bg-[var(--color-parchment)] transition-colors"
          >
            <Mic size={15} />
          </button>
        </div>

        {/* Char Counter & Send Button */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold text-[var(--color-sage)] tabular-nums">
            {text.length}/{MAX_CHARS}
          </span>

          <button
            type="submit"
            disabled={!text.trim() || disabled}
            aria-label="Send message"
            className="px-3.5 py-1.5 rounded-xl bg-[var(--color-dark)] text-white text-xs font-bold hover:bg-[var(--color-sage)] transition-colors disabled:opacity-40 disabled:hover:bg-[var(--color-dark)] flex items-center gap-1.5 shadow-xs"
          >
            <span>Send</span>
            <Send size={13} />
          </button>
        </div>
      </div>
    </form>
  );
};

export default MessageInput;
