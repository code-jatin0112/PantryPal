import React, { useState } from 'react';
import { Pin, Trash2, Edit2, Check, X, MessageSquare } from 'lucide-react';

const ConversationCard = ({
  conversation,
  isActive = false,
  onSelect,
  onRename,
  onPinToggle,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [titleText, setTitleText] = useState(conversation.title || 'New Conversation');

  const handleSaveRename = (e) => {
    e.stopPropagation();
    if (titleText.trim()) {
      onRename(conversation.id, titleText.trim());
    }
    setIsEditing(false);
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setTitleText(conversation.title || 'New Conversation');
    setIsEditing(false);
  };

  const lastMsg =
    conversation.messages && conversation.messages.length > 0
      ? conversation.messages[conversation.messages.length - 1]?.content || ''
      : 'No messages yet';

  return (
    <div
      onClick={() => onSelect(conversation.id)}
      className={`p-3 rounded-xl border transition-all cursor-pointer select-none group text-left space-y-1 ${
        isActive
          ? 'bg-[var(--color-dark)] text-white border-[var(--color-dark)] shadow-sm'
          : 'bg-white border-[rgba(138,144,112,0.15)] hover:border-[var(--color-sage)] hover:bg-[var(--color-parchment)]/40'
      }`}
    >
      {/* Title & Actions Row */}
      <div className="flex items-center justify-between gap-1">
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              autoFocus
              className="px-2 py-0.5 rounded text-xs bg-white text-[var(--color-dark)] border border-[var(--color-sage)] flex-1 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSaveRename}
              className="p-1 text-emerald-500 hover:scale-110"
            >
              <Check size={13} />
            </button>
            <button
              type="button"
              onClick={handleCancelRename}
              className="p-1 text-red-400 hover:scale-110"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <MessageSquare size={13} className={isActive ? 'text-white/80' : 'text-[var(--color-sage)]'} />
              <span className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-[var(--color-dark)]'}`}>
                {conversation.title || 'Conversation'}
              </span>
            </div>

            <div
              className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${
                isActive ? 'opacity-100' : ''
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => onPinToggle(conversation.id)}
                aria-label={conversation.isPinned ? 'Unpin' : 'Pin'}
                className={`p-1 rounded hover:scale-110 transition-transform ${
                  conversation.isPinned
                    ? 'text-amber-400'
                    : isActive
                    ? 'text-white/70 hover:text-white'
                    : 'text-[var(--color-sage)] hover:text-[var(--color-dark)]'
                }`}
              >
                <Pin size={12} fill={conversation.isPinned ? 'currentColor' : 'none'} />
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                aria-label="Rename"
                className={`p-1 rounded hover:scale-110 transition-transform ${
                  isActive ? 'text-white/70 hover:text-white' : 'text-[var(--color-sage)] hover:text-[var(--color-dark)]'
                }`}
              >
                <Edit2 size={12} />
              </button>

              <button
                type="button"
                onClick={() => onDelete(conversation.id)}
                aria-label="Delete"
                className={`p-1 rounded hover:scale-110 transition-transform ${
                  isActive ? 'text-red-300 hover:text-red-100' : 'text-[var(--color-sage)] hover:text-red-500'
                }`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Snippet Preview */}
      <p
        className={`text-[11px] truncate font-medium ${
          isActive ? 'text-white/75' : 'text-[var(--color-sage)]'
        }`}
      >
        {lastMsg}
      </p>
    </div>
  );
};

export default ConversationCard;
