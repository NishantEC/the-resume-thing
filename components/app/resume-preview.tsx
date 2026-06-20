import type { ResumeView } from "@/lib/resume/load";

export function ResumePreview({ view, name }: { view: ResumeView; name: string }): React.ReactElement {
  const groups = view.groups
    .map((group) => ({
      group,
      lines: group.items.filter((item) => item.accepted).map((item) => item.content),
    }))
    .filter((entry) => entry.lines.length > 0);

  const isEmpty = view.acceptedCount === 0;

  return (
    <div className="mx-auto w-full max-w-[46rem] rounded-lg border border-border bg-card px-12 py-14 text-foreground shadow-sm">
      {isEmpty ? (
        <p className="text-center text-sm text-muted-foreground">Apply checks to build your résumé.</p>
      ) : (
        <article className="space-y-7 text-[0.9375rem] leading-relaxed">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
            {view.headline ? <p className="text-muted-foreground">{view.headline}</p> : null}
          </header>

          {view.summary ? <p className="text-foreground/90">{view.summary}</p> : null}

          {view.skills.length > 0 ? (
            <section className="space-y-1.5">
              {view.skills.map((skill) => (
                <p key={skill.label}>
                  <span className="font-semibold">{skill.label}</span>
                  {" — "}
                  <span className="text-foreground/90">{skill.list}</span>
                </p>
              ))}
            </section>
          ) : null}

          {groups.map(({ group, lines }) => (
            <section key={group.project} className="space-y-2">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <h2 className="font-semibold">{group.project}</h2>
                {group.meta ? <span className="text-sm text-muted-foreground">{group.meta}</span> : null}
              </div>
              <ul className="ml-5 list-disc space-y-1 marker:text-muted-foreground">
                {lines.map((content, index) => (
                  <li key={`${group.project}-${index}`} className="text-foreground/90">
                    {content}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </article>
      )}
    </div>
  );
}
