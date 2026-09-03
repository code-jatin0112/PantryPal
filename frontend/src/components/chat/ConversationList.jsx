import React, { useState } from 'react';
import { Plus, Search, Pin, Calendar, History, MessageSquarePlus } from 'lucide-react';
import ConversationCard from './ConversationCard';
import Button from '../ui/Button';

const ConversationList = ({
  conversations = [],
  activeId,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onPinToggle,
  onDeleteConversation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter conversations
  const filtered = conversations.filter((c) =>
    (c.title || '').toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  // Group into Pinned, Today, Previous
  const todayStr = new Date().toISOString().split('T')[0];

  const pinned = filtered.filter((c) => c.isPinned);
  const today = filtered.filter((c) => !c.isPinned && c.updatedAt?.startsWith(todayStr));
  const previous = filtered.filter((c) => !c.isPinned && !c.updatedAt?.startsWith(todayStr));

  return (
    <div className="flex flex-col h-full space-y-4 p-4">
      {/* Top New Chat Action */}
      <Button
        variant="primary"
        size="md"
        icon={Plus}
        onClick={onNewConversation}
        className="w-full justify-center shadow-xs"
      >
        New Kitchen Chat
      </Button>

      {/* Search Input */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-sage)] pointer-events-none"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search conversations..."
          aria-label="Search conversation history"
          className="w-full pl-9 pr-3 py-2 bg-[var(--color-parchment)]/60 border border-[rgba(138,144,112,0.18)] rounded-xl text-xs text-[var(--color-dark)] placeholder-[var(--color-sage)] focus:outline-none focus:border-[var(--color-sage)] transition-colors"
        />
      </div>

      {/* Conversations Scrollable Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {/* Pinned Section */}
        {pinned.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-[var(--color-sage)] uppercase tracking-wider flex items-center gap-1 px-1">
              <Pin size={11} className="text-amber-500" />
              <span>Pinned ({pinned.length})</span>
            </span>
            <div className="space-y-1.5">
              {pinned.map((c) => (
                <ConversationCard
                  key={c.id}
                  conversation={c}
                  isActive={c.id === activeId}
                  onSelect={onSelectConversation}
                  onRename={onRenameConversation}
                  onPinToggle={onPinToggle}
                  onDelete={onDeleteConversation}
                />
              ))}
            </div>
          </div>
        )}

        {/* Today Section */}
        {today.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-[var(--color-sage)] uppercase tracking-wider flex items-center gap-1 px-1">
              <Calendar size={11} />
              <span>Today</span>
            </span>
            <div className="space-y-1.5">
              {today.map((c) => (
                <ConversationCard
                  key={c.id}
                  conversation={c}
                  isActive={c.id === activeId}
                  onSelect={onSelectConversation}
                  onRename={onRenameConversation}
                  onPinToggle={onPinToggle}
                  onDelete={onDeleteConversation}
                />
              ))}
            </div>
          </div>
        )}

        {/* Previous Section */}
        {previous.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-[var(--color-sage)] uppercase tracking-wider flex items-center gap-1 px-1">
              <History size={11} />
              <span>Previous History</span>
            </span>
            <div className="space-y-1.5">
              {previous.map((c) => (
                <ConversationCard
                  key={c.id}
                  conversation={c}
                  isActive={c.id === activeId}
                  onSelect={onSelectConversation}
                  onRename={onRenameConversation}
                  onPinToggle={onPinToggle}
                  onDelete={onDeleteConversation}
                />
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="py-8 text-center text-xs text-[var(--color-sage)] font-semibold">
            No conversations found
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
