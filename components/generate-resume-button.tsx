"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { generateResumeAction } from "@/app/actions";

export function GenerateResumeButton({
  label = "Generate resume",
}: {
  label?: string;
}): React.ReactElement {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="secondary"
        loading={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await generateResumeAction();
              router.push("/resume");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Generation failed");
            }
          });
        }}
      >
        {label}
      </Button>
      {error && <p className="text-sm text-destructive-foreground">{error}</p>}
    </div>
  );
}
