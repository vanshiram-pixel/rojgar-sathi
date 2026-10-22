import { redirect } from "next/navigation";

// Public visitor accounts are disabled. Admin authentication is only available at the unlinked /admin/login route.
export default function LoginRedirect() {
  redirect("/");
}
