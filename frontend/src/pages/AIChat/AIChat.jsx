import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import ChatLayout from '../../components/chat/ChatLayout';
import ConversationList from '../../components/chat/ConversationList';
import MessageBubble from '../../components/chat/MessageBubble';
import MessageInput from '../../components/chat/MessageInput';
import TypingIndicator from '../../components/chat/TypingIndicator';
import QuickPromptBar from '../../components/chat/QuickPromptBar';
import ChatHeader from '../../components/chat/ChatHeader';
import ChatEmptyState from '../../components/chat/ChatEmptyState';

import { sendChatMessage } from '../../services/aiChatService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errorHandler';

const STORAGE_CONVERSATIONS_KEY = 'pantrypal_chat_conversations';
const STORAGE_ACTIVE_ID_KEY = 'pantrypal_active_conversation_id';

const createDefaultConversation = () => ({
  id: `conv-${Date.now()}`,
  title: 'Pantry Cooking Assistant',
  isPinned: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: [
    {
      id: `msg-welcome`,
      role: 'assistant',
      content:
        "Hello Chef! 👋 I'm your **PantryPal AI Kitchen Assistant**.\n\nI can analyze your pantry inventory, suggest waste-reducing dinners, provide instant ingredient substitutions, or calculate nutritional macros.\n\nWhat are we cooking or planning today?",
      timestamp: new Date().toISOString(),
      metadata: {
        intent: 'general',
        suggestedActions: [
          'What can I cook tonight?',
          'Use my pantry ingredients',
          'What expires this week?',
        ],
      },
    },
  ],
});

const AIChat = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const messagesEndRef = useRef(null);

  // Conversations State
  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CONVERSATIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [createDefaultConversation()];
  });

  const [activeId, setActiveId] = useState(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
      if (savedId) return savedId;
    } catch {}
    return conversations[0]?.id || `conv-1`;
  });

  const [loading, setLoading] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Active conversation object
  const activeConversation =
    conversations.find((c) => c.id === activeId) || conversations[0] || createDefaultConversation();

  // Save conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CONVERSATIONS_KEY, JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  // Save active ID
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVE_ID_KEY, activeId);
    } catch {}
  }, [activeId]);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, loading]);

  // Send Message
  const handleSendMessage = async (userText) => {
    if (!userText.trim() || loading) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userText.trim(),
      timestamp: new Date().toISOString(),
    };

    // Update conversation with user message
    const updatedMessages = [...(activeConversation.messages || []), userMsg];

    // Set first message as conversation title if untitled
    const updatedTitle =
      activeConversation.messages?.length <= 1
        ? userText.trim().slice(0, 32) + (userText.length > 32 ? '...' : '')
        : activeConversation.title;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              title: updatedTitle,
              updatedAt: new Date().toISOString(),
              messages: updatedMessages,
            }
          : c
      )
    );

    setLoading(true);

    try {
      // Build conversation history for API context
      const history = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendChatMessage({
        message: userText.trim(),
        conversationHistory: history,
      });

      const aiMsg = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toISOString(),
        metadata: {
          intent: res.intent,
          relevantItems: res.relevantItems,
          suggestedActions: res.suggestedActions,
          warnings: res.warnings,
        },
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                updatedAt: new Date().toISOString(),
                messages: [...updatedMessages, aiMsg],
              }
            : c
        )
      );
    } catch (err) {
      toast(getErrorMessage(err) || 'Failed to get AI response.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Create new conversation
  const handleNewConversation = () => {
    const newConv = createDefaultConversation();
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
    setMobileSidebarOpen(false);
    toast('New kitchen chat started! 🍳', 'info');
  };

  // Select conversation
  const handleSelectConversation = (id) => {
    setActiveId(id);
    setMobileSidebarOpen(false);
  };

  // Rename conversation
  const handleRenameConversation = (id, newTitle) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
    toast('Conversation renamed.', 'info');
  };

  // Pin toggle
  const handlePinToggle = (id) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
  };

  // Delete conversation
  const handleDeleteConversation = (id) => {
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        const fresh = createDefaultConversation();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (activeId === id) {
        setActiveId(remaining[0].id);
      }
      return remaining;
    });
    toast('Conversation deleted.', 'info');
  };

  // Clear current chat
  const handleClearChat = () => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              messages: [],
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
    toast('Chat history cleared for this conversation.', 'info');
  };

  // Export conversation transcript
  const handleExportChat = () => {
    if (!activeConversation || !activeConversation.messages) return;

    const markdownContent = [
      `# ${activeConversation.title || 'PantryPal AI Chat Transcript'}`,
      `*Exported on: ${new Date().toLocaleString()}*`,
      `---\n`,
      ...activeConversation.messages.map(
        (m) =>
          `### ${m.role === 'user' ? '👤 You' : '🤖 PantryPal AI'} (${new Date(m.timestamp).toLocaleTimeString()})\n\n${m.content}\n`
      ),
    ].join('\n\n');

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activeConversation.title || 'chat').replace(/[^a-zA-Z0-9]/g, '_')}_transcript.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('Conversation transcript exported! 📄', 'success');
  };

  // Action click handler
  const handleActionClick = (actionText) => {
    if (actionText === 'Start Cooking Mode') {
      navigate('/cooking/demo');
    } else if (actionText === 'Save to Cookbook') {
      navigate('/recipes/new');
    } else if (actionText === 'Add to Meal Planner') {
      navigate('/meal-plans/new');
    } else {
      handleSendMessage(actionText);
    }
  };

  const messages = activeConversation?.messages || [];

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* ── Chat Layout (Split Screen) ── */}
      <ChatLayout
        sidebar={
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onRenameConversation={handleRenameConversation}
            onPinToggle={handlePinToggle}
            onDeleteConversation={handleDeleteConversation}
          />
        }
        mobileSidebarOpen={mobileSidebarOpen}
        onCloseMobileSidebar={() => setMobileSidebarOpen(false)}
      >
        {/* Top Chat Header */}
        <ChatHeader
          conversationTitle={activeConversation?.title || 'Kitchen Assistant'}
          onNewChat={handleNewConversation}
          onClearChat={handleClearChat}
          onExportChat={handleExportChat}
          onToggleSidebar={() => setMobileSidebarOpen(true)}
        />

        {/* Middle Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-gradient-to-b from-white to-[var(--color-parchment)]/20">
          {messages.length === 0 ? (
            <ChatEmptyState onSelectPrompt={handleSendMessage} />
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onActionClick={handleActionClick}
              />
            ))
          )}

          {/* Typing Indicator */}
          {loading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input & Quick Prompts Studio */}
        <div className="p-3 sm:p-4 bg-white border-t border-[rgba(138,144,112,0.15)] space-y-2">
          <QuickPromptBar onSelectPrompt={handleSendMessage} disabled={loading} />
          <MessageInput onSendMessage={handleSendMessage} disabled={loading} />
        </div>
      </ChatLayout>
    </div>
  );
};

export default AIChat;
