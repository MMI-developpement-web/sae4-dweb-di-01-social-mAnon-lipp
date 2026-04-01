import { useNavigate } from "react-router-dom";
import { parseContent, type ContentSegment } from "../lib/hashtags";
import { cn } from "../lib/utils";

interface ContentWithHashtagsProps {
  content: string;
  className?: string;
  hashtagClassName?: string;
  mentionClassName?: string;
}

/**
 * Component that renders content with clickable hashtags and mentions
 * Hashtags are highlighted and link to hashtag search
 * Mentions are highlighted and link to user profile
 */
export default function ContentWithHashtags({
  content,
  className,
  hashtagClassName,
  mentionClassName,
}: ContentWithHashtagsProps) {
  const navigate = useNavigate();
  const segments: ContentSegment[] = parseContent(content);

  const handleHashtagClick = (hashtag: string) => {
    // Navigate to hashtag search page
    navigate(`/search?type=hashtag&q=${encodeURIComponent(hashtag)}`);
  };

  const handleMentionClick = (username: string) => {
    // Navigate to user profile
    navigate(`/profile/${encodeURIComponent(username)}`);
  };

  return (
    <div className={cn("break-words", className)}>
      {segments.map((segment, index) => {
        switch (segment.type) {
          case 'hashtag':
            return (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleHashtagClick(segment.value || segment.content);
                }}
                className={cn(
                  "text-blue-500 hover:text-blue-700 hover:underline cursor-pointer transition-colors font-medium",
                  hashtagClassName
                )}
                title={`Search #${segment.value}`}
              >
                {segment.content}
              </button>
            );

          case 'mention':
            return (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleMentionClick(segment.value || segment.content);
                }}
                className={cn(
                  "text-blue-500 hover:text-blue-700 hover:underline cursor-pointer transition-colors font-medium",
                  mentionClassName
                )}
                title={`View profile @${segment.value}`}
              >
                {segment.content}
              </button>
            );

          case 'text':
          default:
            return <span key={index}>{segment.content}</span>;
        }
      })}
    </div>
  );
}
