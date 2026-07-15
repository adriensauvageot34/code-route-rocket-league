"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

type AccessibleTooltipProps = {
  buttonClassName?: string;
  children: ReactNode;
  className?: string;
  content: string;
  label: string;
};

export function AccessibleTooltip({
  buttonClassName,
  children,
  className,
  content,
  label,
}: AccessibleTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    setIsOpen(false);
  }

  return (
    <span
      className={`accessible-tooltip${className ? ` ${className}` : ""}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => {
        if (!rootRef.current?.contains(document.activeElement)) setIsOpen(false);
      }}
      ref={rootRef}
    >
      <button
        aria-describedby={isOpen ? tooltipId : undefined}
        aria-expanded={isOpen}
        aria-label={label}
        className={buttonClassName}
        onBlur={() => setIsOpen(false)}
        onClick={() => setIsOpen(true)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        type="button"
      >
        {children}
      </button>
      <span className="accessible-tooltip-content" hidden={!isOpen} id={tooltipId} role="tooltip">
        {content}
      </span>
    </span>
  );
}
