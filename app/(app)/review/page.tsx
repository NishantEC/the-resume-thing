import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadResume } from "@/lib/resume/load";
import { ReviewWorkspace } from "@/components/app/review-workspace";
import { activeResumeId } from "@/lib/resume/active";

export default async function ReviewPage(): Promise<React.ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;
  const rid = await activeResumeId(userId);
  const resume = rid ? await loadResume(rid) : null;
  if (!resume) redirect("/home");
  const name = session!.user.name || session!.user.email;
  return <ReviewWorkspace initialView={resume} name={name} />;
}
