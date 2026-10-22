import { redirect } from "next/navigation";

// Public visitor accounts and profile dashboards are disabled; visitors can subscribe to alerts without an account.
export default function ProfileRedirect() {
  redirect("/#notifications");
}
