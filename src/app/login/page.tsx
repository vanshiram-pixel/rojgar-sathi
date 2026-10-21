import { redirect } from "next/navigation";

// Public visitor accounts are disabled. Authentication is admin-only.
export default function LoginRedirect() {
  redirect("/admin/login");
}
