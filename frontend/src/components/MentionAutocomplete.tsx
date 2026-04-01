import { useState, useEffect, useRef } from "react";
import { logger } from "../lib/logger";
import { searchUsers } from "../lib/api";
import type { UserProfile } from "../lib/api";
import Avatar from "./ui/Avatar";

interface MentionAutocompleteProps {
  textareaValue: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onSelectMention: (username: string) => void;
}

export default function MentionAutocomplete({
  textareaValue,
  textareaRef,
  onSelectMention,
}: MentionAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detect @ mention pattern
  useEffect(() => {
    if (!textareaRef.current) return;

    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = textareaValue.substring(0, cursorPos);

    // Find the last @ before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex === -1) {
      setIsOpen(false);
      setMentionQuery("");
      return;
    }

    // Check if @ is at word boundary (start or after space)
    const isWordBoundary = lastAtIndex === 0 || /\s/.test(textBeforeCursor[lastAtIndex - 1]);
    if (!isWordBoundary) {
      setIsOpen(false);
      return;
    }

    // Get text after @
    const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

    // Check if there's a space after @ (meaning mention ended)
    if (/\s/.test(textAfterAt)) {
      setIsOpen(false);
      return;
    }

    // Valid mention pattern
    setMentionStart(lastAtIndex);
    setMentionQuery(textAfterAt);

    // Fetch suggestions
    if (textAfterAt.length > 0) {
      fetchSuggestions(textAfterAt);
    } else {
      setSuggestions([]);
      setIsOpen(true);
    }
  }, [textareaValue, textareaRef]);

  async function fetchSuggestions(query: string) {
    if (query.length === 0) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await searchUsers(query);
      setSuggestions(response.users || []);
      setIsOpen(true);
    } catch (error) {
      logger.error("Error fetching suggestions", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectMention(username: string) {
    if (!textareaRef.current) return;

    const cursorPos = textareaRef.current.selectionStart;
    const before = textareaValue.substring(0, mentionStart);
    const after = textareaValue.substring(cursorPos);

    const newContent = `${before}@${username} ${after}`;
    onSelectMention(newContent);

    // Close dropdown
    setIsOpen(false);
    setSuggestions([]);
    setMentionQuery("");

    // Focus back to textarea and move cursor after mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = `${before}@${username} `.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [textareaRef]);

  if (!isOpen || mentionQuery === "") {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 w-64 bg-surface border border-border rounded-lg shadow-lg"
    >
      {loading ? (
        <div className="p-3 text-sm text-text-muted text-center">Chargement...</div>
      ) : suggestions.length === 0 ? (
        <div className="p-3 text-sm text-text-muted text-center">
          Aucun utilisateur trouvé
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {suggestions.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelectMention(user.username)}
              className="w-full px-3 py-2 flex items-center gap-2 hover:bg-primary/5 transition-colors text-left"
            >
              <Avatar
                src={user.profilePicture}
                alt={user.username}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-text truncate">
                  {user.username}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
