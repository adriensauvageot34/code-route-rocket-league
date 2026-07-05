"use client";

/* eslint-disable @next/next/no-img-element -- Glossary terms may later carry local illustrations. */

import { useMemo, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import type { GlossaryTerm } from "@/types/content";

type GlossaryTextProps = {
  terms: GlossaryTerm[];
  text: string;
};

export function GlossaryText({ terms, text }: GlossaryTextProps) {
  const [activeTerm, setActiveTerm] = useState<GlossaryTerm | null>(null);
  const parts = useMemo(() => splitTextWithTerms(text, terms), [terms, text]);

  if (parts.length === 1 && parts[0].type === "text") {
    return text;
  }

  function showTerm(event: PointerEvent<HTMLSpanElement>, term: GlossaryTerm) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setActiveTerm(term);
  }

  function hideTerm(event?: PointerEvent<HTMLSpanElement>) {
    event?.preventDefault();
    event?.stopPropagation();

    if (event?.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setActiveTerm(null);
  }

  function showTermFromKeyboard(event: KeyboardEvent<HTMLSpanElement>, term: GlossaryTerm) {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      setActiveTerm(term);
    }
  }

  function hideTermFromKeyboard(event: KeyboardEvent<HTMLSpanElement>) {
    if (event.key === " " || event.key === "Enter" || event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setActiveTerm(null);
    }
  }

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === "text") {
          return <span key={`${part.value}-${index}`}>{part.value}</span>;
        }

        return (
          <span
            aria-label={`${part.term.term}: ${part.term.definition}`}
            className="glossary-inline-term"
            key={`${part.term.term_id}-${index}`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onKeyDown={(event) => showTermFromKeyboard(event, part.term)}
            onKeyUp={hideTermFromKeyboard}
            onMouseEnter={() => setActiveTerm(part.term)}
            onMouseLeave={() => setActiveTerm(null)}
            onPointerCancel={hideTerm}
            onPointerDown={(event) => showTerm(event, part.term)}
            onPointerLeave={hideTerm}
            onPointerUp={hideTerm}
            role="note"
            tabIndex={0}
          >
            {part.value}
          </span>
        );
      })}

      {activeTerm ? (
        <span className="glossary-popover" role="tooltip">
          <strong>{activeTerm.term}</strong>
          <span>{activeTerm.definition}</span>
          {activeTerm.image_path || activeTerm.illustration_path ? (
            <img alt="" src={activeTerm.image_path ?? activeTerm.illustration_path} />
          ) : null}
        </span>
      ) : null}
    </>
  );
}

type TextPart = {
  type: "text";
  value: string;
};

type TermPart = {
  term: GlossaryTerm;
  type: "term";
  value: string;
};

function splitTextWithTerms(text: string, terms: GlossaryTerm[]): Array<TextPart | TermPart> {
  const orderedTerms = terms
    .filter((term) => term.term.trim().length > 0)
    .sort((first, second) => second.term.length - first.term.length);

  if (orderedTerms.length === 0) {
    return [{ type: "text", value: text }];
  }

  const matcher = new RegExp(`(${orderedTerms.map((term) => escapeRegExp(term.term)).join("|")})`, "gi");
  const pieces = text.split(matcher).filter((piece) => piece.length > 0);

  return pieces.map((piece) => {
    const term = orderedTerms.find((candidate) => candidate.term.toLowerCase() === piece.toLowerCase());

    return term ? { term, type: "term", value: piece } : { type: "text", value: piece };
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
