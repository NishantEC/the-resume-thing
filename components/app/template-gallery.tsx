"use client";

import { TEMPLATES } from "@/lib/latex/template";
import type { TemplateName } from "@/lib/latex/template";

/**
 * Modal gallery of résumé templates rendered as thumbnails (static PNGs under
 * /public/templates, generated from a sample résumé). Picking one delegates to
 * the editor's template-switch handler.
 */
export function TemplateGallery({
  active,
  busy,
  onPick,
  onClose,
}: {
  active: string;
  busy: boolean;
  onPick: (id: TemplateName) => void;
  onClose: () => void;
}): React.ReactElement {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Choose a résumé template"
      >
        <div className="flex flex-none items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Templates</h2>
            <p className="text-[12px] text-muted-foreground">
              Switching regenerates the source from your accepted items.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 overflow-auto p-5 sm:grid-cols-3 md:grid-cols-4">
          {TEMPLATES.map((t) => {
            const isActive = t.id === active;
            return (
              <button
                key={t.id}
                type="button"
                disabled={busy}
                onClick={() => onPick(t.id)}
                aria-pressed={isActive}
                className={`group flex flex-col overflow-hidden rounded-lg border text-left transition disabled:opacity-60 ${
                  isActive
                    ? "border-primary ring-2 ring-primary"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <span className="relative block aspect-[3/4] w-full overflow-hidden bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/templates/${t.id}.png`}
                    alt={`${t.label} résumé template preview`}
                    loading="lazy"
                    className="h-full w-full object-cover object-top"
                  />
                  {isActive ? (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                      Active
                    </span>
                  ) : null}
                </span>
                <span className="block border-t border-border px-2.5 py-2">
                  <span className="block text-[12.5px] font-medium text-foreground">{t.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{t.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
