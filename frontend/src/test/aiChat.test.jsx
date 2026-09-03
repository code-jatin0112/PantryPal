import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageBubble from '../components/chat/MessageBubble';
import QuickPromptBar from '../components/chat/QuickPromptBar';
import TypingIndicator from '../components/chat/TypingIndicator';

describe('AI Chat Assistant Test Suite', () => {
  it('renders user message bubble correctly', () => {
    const userMsg = {
      id: 'msg-1',
      role: 'user',
      content: 'What can I substitute for buttermilk?',
      timestamp: new Date().toISOString(),
    };

    render(<MessageBubble message={userMsg} />);
    expect(screen.getByText('What can I substitute for buttermilk?')).toBeInTheDocument();
  });

  it('renders assistant response with markdown parser and copy button', () => {
    const aiMsg = {
      id: 'msg-2',
      role: 'assistant',
      content: 'You can mix 1 cup of whole milk with 1 tablespoon of lemon juice or vinegar.',
      timestamp: new Date().toISOString(),
    };

    render(<MessageBubble message={aiMsg} />);
    expect(screen.getByText(/You can mix 1 cup of whole milk/i)).toBeInTheDocument();
  });

  it('renders quick prompt suggestions and triggers query select', () => {
    const handleSelect = vi.fn();
    render(<QuickPromptBar onSelectPrompt={handleSelect} />);

    const promptBtn = screen.getByRole('button', { name: /What can I cook tonight\?/i });
    fireEvent.click(promptBtn);
    expect(handleSelect).toHaveBeenCalledWith('What can I cook tonight?');
  });

  it('renders animated typing indicator', () => {
    render(<TypingIndicator />);
    expect(screen.getByText(/Analyzing pantry stock.../i)).toBeInTheDocument();
  });
});
