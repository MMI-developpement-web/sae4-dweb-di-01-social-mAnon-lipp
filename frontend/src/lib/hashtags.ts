/**
 * Utility functions for parsing and processing hashtags and mentions
 */

/**
 * Type for a parsed content segment
 */
export type ContentSegment = {
  type: 'text' | 'hashtag' | 'mention';
  content: string;
  value?: string; // The hashtag or mention without the symbol
};

/**
 * Parse content string and extract hashtags (#) and mentions (@)
 * Hashtags: #word (alphanumeric + underscore)
 * Mentions: @word (alphanumeric + underscore)
 */
export function parseContent(text: string): ContentSegment[] {
  if (!text) return [];

  const segments: ContentSegment[] = [];
  // Regex to match hashtags and mentions
  // #word matches: # followed by alphanumeric/underscore
  // @word matches: @ followed by alphanumeric/underscore
  const regex = /#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+|\S+|\s+/g;

  let match;
  while ((match = regex.exec(text)) !== null) {
    const token = match[0];

    if (token.startsWith('#')) {
      segments.push({
        type: 'hashtag',
        content: token,
        value: token.slice(1), // Remove the #
      });
    } else if (token.startsWith('@')) {
      segments.push({
        type: 'mention',
        content: token,
        value: token.slice(1), // Remove the @
      });
    } else {
      segments.push({
        type: 'text',
        content: token,
      });
    }
  }

  return segments;
}

/**
 * Extract all hashtags from content
 */
export function extractHashtags(text: string): string[] {
  const segments = parseContent(text);
  return segments
    .filter((s) => s.type === 'hashtag')
    .map((s) => s.value || '')
    .filter(Boolean);
}

/**
 * Extract all mentions from content
 */
export function extractMentions(text: string): string[] {
  const segments = parseContent(text);
  return segments
    .filter((s) => s.type === 'mention')
    .map((s) => s.value || '')
    .filter(Boolean);
}

/**
 * Check if text contains any hashtags or mentions
 */
export function hasHashtagsOrMentions(text: string): boolean {
  return /#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+/.test(text);
}
