import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { effectiveResumeTex } from "@/lib/latex/resume-tex";
import { compileLatex } from "@/lib/latex/compile";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response(null, { status: 401 });

  const tex = await effectiveResumeTex(
    session.user.id,
    session.user.name || session.user.email,
  );
  if (!tex) return new Response(null, { status: 404 });

  try {
    const pdf = await compileLatex(tex);
    return new Response(pdf as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="resume.pdf"',
      },
    });
  } catch (err) {
    console.error("[pdf] LaTeX compile failed", err);
    return new Response("PDF generation failed", { status: 500 });
  }
}
