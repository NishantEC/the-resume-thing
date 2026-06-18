import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { effectiveResumeTex } from "@/lib/latex/resume-tex";
import { LatexEditor } from "@/components/app/latex-editor";

export default async function ResumeEditPage(): Promise<React.ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;
  const tex = await effectiveResumeTex(
    userId,
    session!.user.name || session!.user.email,
  );
  if (!tex) redirect("/activity");

  return <LatexEditor initialTex={tex} />;
}
