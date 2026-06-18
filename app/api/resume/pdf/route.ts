import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { loadResume } from "@/lib/resume/load";
import { renderResumePdf } from "@/lib/pdf/render";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response(null, { status: 401 });

  const view = await loadResume(session.user.id);
  if (!view) return new Response(null, { status: 404 });

  const name = session.user.name || session.user.email;
  const pdf = await renderResumePdf(view, name);

  return new Response(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="resume.pdf"',
    },
  });
}
