import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Copy, Check } from 'lucide-react';
import AIResponseCard from './AIResponseCard';

// Simple lightweight Markdown formatter (bold, lists, headers, code, tables)
const formatMarkdown = (text = '') => {
  if (!text) return '';

  const lines = text.split('\n');
  const elements = [];
  let inTable = false;
  let tableRows = [];

  const flushTable = (key) => {
    if (tableRows.length > 0) {
      const header = tableRows[0];
      const body = tableRows.slice(2); // Skip separator line

      elements.push(
        <div key={`table-${key}`} className="my-2 overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-[rgba(138,144,112,0.2)]">
            <thead>
              <tr className="bg-[var(--color-parchment)]">
                {header.map((th, i) => (
                  <th key={i} className="p-2 border border-[rgba(138,144,112,0.15)] font-bold text-[var(--color-dark)]">
                    {th.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(138,144,112,0.1)]">
              {body.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[var(--color-parchment)]/40">
                  {row.map((td, cIdx) => (
                    <td key={cIdx} className="p-2 border border-[rgba(138,144,112,0.12)] font-medium">
                      {td.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Table Row detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      const cols = trimmed.slice(1, -1).split('|');
      tableRows.push(cols);
      return;
    } else if (inTable) {
      inTable = false;
      flushTable(idx);
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={idx} className="text-sm font-extrabold text-[var(--color-dark)] mt-2 mb-1">
          {trimmed.replace('### ', '')}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={idx} className="text-base font-extrabold text-[var(--color-dark)] mt-2 mb-1">
          {trimmed.replace('## ', '')}
        </h3>
      );
      return;
    }

    // Bullet list
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <li key={idx} className="ml-4 list-disc text-xs leading-relaxed font-medium">
          {parseInlineFormatting(trimmed.substring(2))}
        </li>
      );
      return;
    }

    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      elements.push(
        <li key={idx} className="ml-4 list-decimal text-xs leading-relaxed font-medium">
          {parseInlineFormatting(trimmed.replace(/^\d+\.\s/, ''))}
        </li>
      );
      return;
    }

    // Paragraph
    if (trimmed.length > 0) {
      elements.push(
        <p key={idx} className="text-xs sm:text-sm leading-relaxed font-medium">
          {parseInlineFormatting(trimmed)}
        </p>
      );
    }
  });

  if (tableRows.length > 0) {
    flushTable('end');
  }

  return elements;
};

// Parse inline **bold**, *italic*, `code`
const parseInlineFormatting = (str) => {
  const parts = str.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-extrabold text-[var(--color-dark)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic text-[var(--color-sage)]">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-[var(--color-parchment)] font-mono text-[11px] text-[var(--color-bark)]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

const MessageBubble = ({
  message,
  onActionClick,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Bot Avatar (Left for AI) */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-[var(--color-sage)] text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-1">
          <Bot size={16} />
        </div>
      )}

      {/* Bubble Container */}
      <div className={`max-w-[85%] sm:max-w-[75%] space-y-2 text-left ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`p-4 rounded-2xl shadow-[0_1px_3px_rgba(39,42,31,0.04)] space-y-2 relative group ${
            isUser
              ? 'bg-[var(--color-dark)] text-white rounded-tr-sm'
              : 'bg-white border border-[rgba(138,144,112,0.18)] text-[var(--color-dark)] rounded-tl-sm'
          }`}
        >
          {/* Formatted Content */}
          <div className="space-y-1.5">
            {isUser ? (
              <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            ) : (
              formatMarkdown(message.content)
            )}
          </div>

          {/* Structured AI Response Card */}
          {!isUser && message.metadata && (
            <AIResponseCard
              intent={message.metadata.intent}
              relevantItems={message.metadata.relevantItems}
              suggestedActions={message.metadata.suggestedActions}
              warnings={message.metadata.warnings}
              onActionClick={onActionClick}
            />
          )}

          {/* Copy Button on hover */}
          {!isUser && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy AI message"
              className="absolute top-2.5 right-2.5 p-1 rounded-md bg-white border border-[rgba(138,144,112,0.15)] text-[var(--color-sage)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-dark)] transition-opacity"
            >
              {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            </button>
          )}
        </div>

        {/* Timestamp */}
        {time && (
          <span className={`text-[10px] font-semibold text-[var(--color-sage)] block px-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {time}
          </span>
        )}
      </div>

      {/* User Avatar (Right for User) */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-[var(--color-parchment)] border border-[rgba(138,144,112,0.2)] text-[var(--color-dark)] flex items-center justify-center flex-shrink-0 shadow-xs mt-1">
          <User size={16} />
        </div>
      )}
    </motion.div>
  );
};

export default MessageBubble;
