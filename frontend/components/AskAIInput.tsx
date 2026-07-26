"use client";

import { useState, useRef, type FormEvent } from "react";

interface AskAIInputProps {
  /** Placeholder shown in the collapsed state */
  collapsedLabel?: string;
  /** Placeholder shown inside the input once expanded */
  inputPlaceholder?: string;
  /** Called when the user submits a message */
  onSubmit: (text: string) => void;
  /** Disable the input + send button (e.g. while streaming) */
  disabled?: boolean;
}

/**
 * Polished "Ask AI" input.
 *
 * Collapsed by default: a small greyed-out pill that just says "Ask AI".
 * On hover (or focus) it smoothly widens to full width and reveals the
 * text input + send button so the user can type.
 */
export function AskAIInput({
  collapsedLabel = "Ask AI",
  inputPlaceholder = "Ask AI anything…",
  onSubmit,
  disabled = false,
}: AskAIInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
  };

  return (
    <form
      className={`ask-ai ${value ? "has-text" : ""}`}
      onClick={() => inputRef.current?.focus()}
      onSubmit={handleSubmit}
      aria-label="Ask AI"
    >
      <span className="ask-ai__label">{collapsedLabel}</span>
      <input
        ref={inputRef}
        type="text"
        className="ask-ai__input"
        placeholder={inputPlaceholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        aria-label="Ask AI input"
      />
      <button
        type="submit"
        className="ask-ai__send"
        disabled={disabled || !value.trim()}
        aria-label="Send"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12l14-7-5 7 5 7-14-7z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </form>
  );
}
