import { renderToBuffer } from "@react-pdf/renderer";
import type { ResumeView } from "@/lib/resume/load";
import { ResumeDocument } from "@/lib/pdf/resume-document";

export async function renderResumePdf(
  view: ResumeView,
  name: string,
): Promise<Buffer> {
  return renderToBuffer(<ResumeDocument view={view} name={name} />);
}
