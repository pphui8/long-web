import React from 'react';
import type { Message } from '../../types';

interface MessageItemProps {
  message: Message;
}

const renderInlineMarkdown = (text: string, linkClassName: string): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  const inlinePattern = /(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlinePattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      nodes.push(<strong key={nodes.length}>{match[2]}</strong>);
    } else if (match[3]) {
      nodes.push(
        <code key={nodes.length} className="rounded bg-slate-200 px-1 py-0.5 font-mono text-[0.92em] break-words">
          {match[3]}
        </code>
      );
    } else if (match[4] && match[5]) {
      nodes.push(
        <a
          key={nodes.length}
          href={match[5]}
          className={linkClassName}
          target="_blank"
          rel="noreferrer"
        >
          {match[4]}
        </a>
      );
    }

    lastIndex = inlinePattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
};

const normalizeMarkdownLines = (content: string) => {
  return content.split('\n').flatMap((line) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('| |')) {
      return line.replace(/\|\s+\|/g, '|\n|').split('\n');
    }

    return [line];
  });
};

const isHorizontalRule = (line: string) => /^-{3,}$/.test(line.trim());

const isTableRow = (line: string) => {
  const trimmed = line.trim();
  return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|', 1);
};

const parseTableCells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());

const isTableDivider = (line: string) =>
  parseTableCells(line).every((cell) => /^:?-{3,}:?$/.test(cell));

const renderMarkdown = (content: string, linkClassName: string) => {
  const blocks: React.ReactNode[] = [];
  const lines = normalizeMarkdownLines(content);

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
        <pre key={blocks.length} className="my-3 max-w-full overflow-x-auto rounded-lg bg-slate-900 p-3 text-sm leading-6 text-slate-100">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    if (!line.trim()) {
      continue;
    }

    if (isHorizontalRule(line)) {
      blocks.push(<hr key={blocks.length} className="my-4 border-slate-300" />);
      continue;
    }

    if (isTableRow(line)) {
      const tableLines = [line];

      while (i + 1 < lines.length && isTableRow(lines[i + 1])) {
        i += 1;
        tableLines.push(lines[i]);
      }

      if (tableLines.length >= 2 && isTableDivider(tableLines[1])) {
        const headers = parseTableCells(tableLines[0]);
        const rows = tableLines.slice(2).map(parseTableCells);

        blocks.push(
          <div key={blocks.length} className="my-3 max-w-full overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-left text-sm">
              <thead>
                <tr>
                  {headers.map((header, headerIndex) => (
                    <th key={headerIndex} className="border border-slate-300 bg-slate-200 px-3 py-2 font-semibold">
                      {renderInlineMarkdown(header, linkClassName)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {headers.map((_, cellIndex) => (
                      <td key={cellIndex} className="border border-slate-300 bg-white px-3 py-2 align-top">
                        {renderInlineMarkdown(row[cellIndex] ?? '', linkClassName)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      } else {
        blocks.push(
          <p key={blocks.length} className="my-2 first:mt-0 last:mb-0">
            {renderInlineMarkdown(tableLines.join(' '), linkClassName)}
          </p>
        );
      }

      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const levelClass = heading[1].length === 1 ? 'text-lg' : heading[1].length === 2 ? 'text-base' : 'text-sm';
      blocks.push(
        <div key={blocks.length} className={`mt-3 first:mt-0 font-semibold ${levelClass}`}>
          {renderInlineMarkdown(heading[2], linkClassName)}
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
            <li key={itemIndex}>{renderInlineMarkdown(item, linkClassName)}</li>
          ))}
        </ListTag>
      );
      continue;
    }

    if (line.startsWith('> ')) {
      blocks.push(
        <blockquote key={blocks.length} className="my-2 border-l-4 border-slate-300 pl-3 text-slate-600">
          {renderInlineMarkdown(line.slice(2), linkClassName)}
        </blockquote>
      );
      continue;
    }

    const paragraphLines = [line];
    while (
      i + 1 < lines.length &&
      lines[i + 1].trim() &&
      !lines[i + 1].startsWith('```') &&
      !isHorizontalRule(lines[i + 1]) &&
      !isTableRow(lines[i + 1]) &&
      !/^(#{1,3})\s+/.test(lines[i + 1]) &&
      !/^(\d+\.|[-*])\s+/.test(lines[i + 1]) &&
      !lines[i + 1].startsWith('> ')
    ) {
      i += 1;
      paragraphLines.push(lines[i]);
    }

    blocks.push(
      <p key={blocks.length} className="my-2 first:mt-0 last:mb-0">
        {renderInlineMarkdown(paragraphLines.join(' '), linkClassName)}
      </p>
    );
  }

  return blocks;
};

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';
  const linkClassName = isAssistant
    ? 'font-medium text-primary underline underline-offset-2 break-words'
    : 'font-medium text-white underline underline-offset-2 break-words';
  
  return (
    <div className={`flex max-w-[85%] min-w-0 gap-3 md:gap-4 ${isAssistant ? '' : 'flex-row-reverse self-end'}`}>
      <div className={`
        w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm
        ${isAssistant ? 'bg-slate-200 text-sidebar-bg' : 'bg-primary text-white'}
      `}>
        {isAssistant ? 'AI' : 'U'}
      </div>
      <div className={`flex min-w-0 flex-col gap-1 ${isAssistant ? '' : 'items-end'}`}>
        <div className={`flex items-center gap-2 text-xs text-text-muted ${isAssistant ? '' : 'flex-row-reverse'}`}>
          <span className="font-semibold text-slate-700">{isAssistant ? 'Assistant' : 'You'}</span>
          <span>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className={`
          max-w-full px-4 py-3 rounded-2xl text-[15px] leading-relaxed break-words [overflow-wrap:anywhere]
          ${isAssistant 
            ? 'bg-message-ai-bg text-message-ai-text rounded-tl-none border border-slate-100' 
            : 'bg-message-user-bg text-message-user-text rounded-tr-none shadow-sm'}
        `}>
          {renderMarkdown(message.content, linkClassName)}
        </div>
      </div>
    </div>
  );
};
