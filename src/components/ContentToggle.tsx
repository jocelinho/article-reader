"use client";

import { useState, useRef, useEffect } from "react";

interface ContentToggleProps {
  mode: "enhanced" | "original";
  onToggle: (mode: "enhanced" | "original") => void;
}

export function ContentToggle({ mode, onToggle }: ContentToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors text-sm font-medium text-zinc-700 dark:text-zinc-300"
        aria-label="Toggle content view"
      >
        <span className="text-base">📖</span>
        <span>{mode === "enhanced" ? "Enhanced" : "Original"}</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden z-50">
          <button
            onClick={() => {
              onToggle("enhanced");
              setIsOpen(false);
            }}
            className={`w-full px-4 py-2.5 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors ${
              mode === "enhanced"
                ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-medium"
                : "text-zinc-700 dark:text-zinc-300"
            }`}
          >
            Enhanced
          </button>
          <button
            onClick={() => {
              onToggle("original");
              setIsOpen(false);
            }}
            className={`w-full px-4 py-2.5 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors ${
              mode === "original"
                ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-medium"
                : "text-zinc-700 dark:text-zinc-300"
            }`}
          >
            Original
          </button>
        </div>
      )}
    </div>
  );
}
