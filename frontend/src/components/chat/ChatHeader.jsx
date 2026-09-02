import React from 'react';
import { Bot, Plus, Trash2, Download, Menu, Sparkles } from 'lucide-react';
import Button from '../ui/Button';

const ChatHeader = ({
  conversationTitle = 'Kitchen Assistant',
  onNewChat,
  onClearChat,
  onExportChat,
  onToggleSidebar,
}) => {
  return (
    <div className="bg-white border-b border-[rgba(138,144,112,0.18)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle chat history sidebar"
            className="md:hidden p-2 rounded-xl border border-[rgba(138,144,112,0.2)] text-[var(--color-sage)] hover:text-[var(--color-dark)]"
          >
            <Menu size={16} />
          </button>
        )}

        <div className="w-9 h-9 rounded-xl bg-[rgba(138,144,112,0.12)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0 shadow-xs">
          <Bot size={18} />
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-base sm:text-lg font-extrabold text-[var(--color-dark)] leading-tight">
              {conversationTitle}
            </h2>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="AI Ready" />
          </div>
          <p className="text-[11px] text-[var(--color-sage)] font-semibold truncate max-w-sm sm:max-w-md">
            Ask anything about recipes, pantry management, nutrition, and food safety
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Button
          variant="secondary"
          size="sm"
          icon={Download}
          onClick={onExportChat}
          aria-label="Export conversation"
          className="text-xs"
        >
          Export
        </Button>

        <Button
          variant="secondary"
          size="sm"
          icon={Trash2}
          onClick={onClearChat}
          aria-label="Clear chat"
          className="text-xs text-red-600 hover:bg-red-50 hover:border-red-200"
        >
          Clear
        </Button>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={onNewChat}
          className="text-xs font-bold"
        >
          New Chat
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;
