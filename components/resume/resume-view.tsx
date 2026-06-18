import type { ReactElement } from "react";
import {
  groupItemsByKind,
  type Kind,
  type ResumeItemView,
  type ResumeView as ResumeViewType,
} from "@/lib/resume/load";

const SECTIONS: { kind: Kind; label: string }[] = [
  { kind: "experience", label: "Experience" },
  { kind: "project", label: "Projects" },
  { kind: "skill", label: "Skills" },
  { kind: "highlight", label: "Highlights" },
];

function ItemRow({ item }: { item: ResumeItemView }): ReactElement {
  return (
    <li className="text-sm leading-relaxed">
      <span>{item.content}</span>
      {item.evidence.length > 0 && (
        <sup className="ml-1 inline-flex gap-1 align-super">
          {item.evidence.map((e, i) => (
            <a
              key={`${e.url}-${i}`}
              href={e.url}
              target="_blank"
              rel="noreferrer"
              title={e.title}
              className="font-mono text-[0.65rem] text-muted-foreground hover:text-foreground hover:underline"
            >
              source
            </a>
          ))}
        </sup>
      )}
    </li>
  );
}

export function ResumeView({
  view,
  name,
}: {
  view: ResumeViewType;
  name: string;
}): ReactElement {
  const grouped = groupItemsByKind(view.items);

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {name}
        </h1>
        {view.headline && (
          <p className="text-lg text-muted-foreground">{view.headline}</p>
        )}
      </header>

      {view.summary && (
        <p className="text-sm leading-relaxed text-foreground">{view.summary}</p>
      )}

      {SECTIONS.map(({ kind, label }) => {
        const items = grouped[kind];
        if (items.length === 0) return null;
        return (
          <section key={kind} className="flex flex-col gap-2">
            <h2 className="font-heading text-base font-medium tracking-tight text-foreground">
              {label}
            </h2>
            <ul className="flex flex-col gap-1.5">
              {items.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </ul>
          </section>
        );
      })}
    </article>
  );
}
