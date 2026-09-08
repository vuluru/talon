// Context extraction for AI summon
export function extractParagraphContext(content: string, cursorPos: number): string {
  // Find the current paragraph (text between blank lines)
  const lines = content.split('\n');
  let lineStart = 0;
  let currentLineIndex = 0;

  // Find which line the cursor is on
  for (let i = 0; i < lines.length; i++) {
    const lineEnd = lineStart + lines[i].length + 1; // +1 for newline
    if (cursorPos <= lineEnd) {
      currentLineIndex = i;
      break;
    }
    lineStart = lineEnd;
  }

  // Find paragraph boundaries (lines separated by blank lines)
  let paragraphStart = currentLineIndex;
  let paragraphEnd = currentLineIndex;

  // Go backward to find paragraph start
  for (let i = currentLineIndex; i >= 0; i--) {
    if (lines[i].trim() === '') {
      paragraphStart = i + 1;
      break;
    }
    if (i === 0) {
      paragraphStart = 0;
    }
  }

  // Go forward to find paragraph end
  for (let i = currentLineIndex; i < lines.length; i++) {
    if (lines[i].trim() === '') {
      paragraphEnd = i;
      break;
    }
    if (i === lines.length - 1) {
      paragraphEnd = i + 1;
    }
  }

  // Find prior heading (any line starting with #)
  let priorHeading = '';
  for (let i = paragraphStart - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith('#')) {
      priorHeading = line + '\n\n';
      break;
    }
  }

  // Extract paragraph
  const paragraph = lines.slice(paragraphStart, paragraphEnd).join('\n').trim();

  return priorHeading + paragraph;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}
