import React from 'react';
import type { Message } from '../../types';

interface MessageItemProps {
  message: Message;
}

const renderInlineMarkdown = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="rounded bg-slate-200 px-1 py-0.5 font-mono text-[0.92em]">
          {part.slice(1, -1)}
        </code>
      );
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          className="font-medium text-primary underline underline-offset-2"
          target="_blank"
          rel="noreferrer"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return part;
  });
};

const renderMarkdown = (content: string) => {
  const blocks: React.ReactNode[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i += 1;

      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }

      blocks.push(
        <pre key={blocks.length} className="my-3 overflow-x-auto rounded-lg bg-slate-900 p-3 text-sm leading-6 text-slate-100">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    if (!line.trim()) {
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const levelClass = heading[1].length === 1 ? 'text-lg' : heading[1].length === 2 ? 'text-base' : 'text-sm';
      blocks.push(
        <div key={blocks.length} className={`mt-3 first:mt-0 font-semibold ${levelClass}`}>
          {renderInlineMarkdown(heading[2])}
        </div>
      );
      continue;
    }

    const listItems: string[] = [];
    const orderedList = /^\d+\.\s+/.test(line);
    const unorderedList = /^[-*]\s+/.test(line);

    if (orderedList || unorderedList) {
      const itemPattern = orderedList ? /^\d+\.\s+/ : /^[-*]\s+/;

      while (i < lines.length && itemPattern.test(lines[i])) {
        listItems.push(lines[i].replace(itemPattern, ''));
        i += 1;
      }

      i -= 1;

      const ListTag = orderedList ? 'ol' : 'ul';
      blocks.push(
        <ListTag key={blocks.length} className={`my-2 space-y-1 pl-5 ${orderedList ? 'list-decimal' : 'list-disc'}`}>
          {listItems.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInlineMarkdown(item)}</li>
          ))}
        </ListTag>
      );
      continue;
    }

    if (line.startsWith('> ')) {
      blocks.push(
        <blockquote key={blocks.length} className="my-2 border-l-4 border-slate-300 pl-3 text-slate-600">
          {renderInlineMarkdown(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    const paragraphLines = [line];
    while (
      i + 1 < lines.length &&
      lines[i + 1].trim() &&
      !lines[i + 1].startsWith('```') &&
      !/^(#{1,3})\s+/.test(lines[i + 1]) &&
      !/^(\d+\.|[-*])\s+/.test(lines[i + 1]) &&
      !lines[i + 1].startsWith('> ')
    ) {
      i += 1;
      paragraphLines.push(lines[i]);
    }

    blocks.push(
      <p key={blocks.length} className="my-2 first:mt-0 last:mb-0">
        {renderInlineMarkdown(paragraphLines.join(' '))}
      </p>
    );
  }

  return blocks;
};

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';
  
  return (
    <div className={`flex gap-4 max-w-[85%] ${isAssistant ? '' : 'flex-row-reverse self-end'}`}>
      <div className={`
        w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm
        ${isAssistant ? 'bg-slate-200 text-sidebar-bg' : 'bg-primary text-white'}
      `}>
        {isAssistant ? 'AI' : 'U'}
      </div>
      <div className={`flex flex-col gap-1 ${isAssistant ? '' : 'items-end'}`}>
        <div className={`flex items-center gap-2 text-xs text-text-muted ${isAssistant ? '' : 'flex-row-reverse'}`}>
          <span className="font-semibold text-slate-700">{isAssistant ? 'Assistant' : 'You'}</span>
          <span>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className={`
          px-4 py-3 rounded-2xl text-[15px] leading-relaxed break-words
          ${isAssistant 
            ? 'bg-message-ai-bg text-message-ai-text rounded-tl-none border border-slate-100' 
            : 'bg-message-user-bg text-message-user-text rounded-tr-none shadow-sm'}
        `}>
          {isAssistant ? renderMarkdown(message.content) : message.content}
        </div>
      </div>
    </div>
  );
};
