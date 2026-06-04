import { redirect } from "next/navigation";

// The standalone /resume hub has been folded into the profile page — there's
// already a "이력서" tab at /profile?tab=resume that lists/manages resumes.
// We keep this server-side redirect so any external links or bookmarks land
// on the canonical entry point.
export default function Page() {
  redirect("/profile?tab=resume");
}
