import React from "react";
import Mention from "../components/ui/Mention";
import Hashtag from "../components/ui/Hashtag";

/**
 * Regex patterns for hashtags and mentions
 * - Hashtag: # followed by word characters
 * - Mention: @ followed by word characters
 */
const HASHTAG_REGEX = /#(\w+)/g;
const MENTION_REGEX = /(@)(\w+)/g;

interface ParsedSegment {
  type: "text" | "hashtag" | "mention";
  value: string;
  username?: string; // for mentions
  hashtag?: string; // for hashtags
}

/**
 * Parse tweet content to extract hashtags and mentions
 * Returns an array of segments that can be rendered
 */
export function parseTweetContent(content: string): ParsedSegment[] {
  if (!content) return [];

  const segments: ParsedSegment[] = [];
  let lastIndex = 0;

  // Find all hashtags and mentions with their positions
  const matches: Array<{
    start: number;
    end: number;
    type: "hashtag" | "mention";
    value: string;
  }> = [];

  // Find hashtags
  let hashtagMatch;
  while ((hashtagMatch = HASHTAG_REGEX.exec(content)) !== null) {
    matches.push({
      start: hashtagMatch.index,
      end: HASHTAG_REGEX.lastIndex,
      type: "hashtag",
      value: hashtagMatch[1],
    });
  }

  // Find mentions
  let mentionMatch;
  while ((mentionMatch = MENTION_REGEX.exec(content)) !== null) {
    matches.push({
      start: mentionMatch.index,
      end: MENTION_REGEX.lastIndex,
      type: "mention",
      value: mentionMatch[2],
    });
  }

  // Sort matches by position
  matches.sort((a, b) => a.start - b.start);

  // Build segments
  for (const match of matches) {
    // Add text before this match
    if (lastIndex < match.start) {
      segments.push({
        type: "text",
        value: content.substring(lastIndex, match.start),
      });
    }

    // Add the match
    if (match.type === "hashtag") {
      segments.push({
        type: "hashtag",
        value: `#${match.value}`,
        hashtag: match.value,
      });
    } else if (match.type === "mention") {
      segments.push({
        type: "mention",
        value: `@${match.value}`,
        username: match.value,
      });
    }

    lastIndex = match.end;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    segments.push({
      type: "text",
      value: content.substring(lastIndex),
    });
  }

  return segments.length > 0
    ? segments
    : [{ type: "text", value: content }];
}

/**
 * Render parsed tweet content with styled hashtags and clickable mentions
 */
export function renderTweetContent(content: string): React.ReactNode {
  const segments = parseTweetContent(content);

  return segments.map((segment, index) => {
    if (segment.type === "text") {
      return React.createElement(React.Fragment, { key: index }, segment.value);
    }

    if (segment.type === "hashtag" && segment.hashtag) {
      return React.createElement(Hashtag, {
        key: index,
        hashtag: segment.hashtag,
      });
    }

    if (segment.type === "mention" && segment.username) {
      return React.createElement(Mention, {
        key: index,
        username: segment.username,
      });
    }

    return null;
  });
}
