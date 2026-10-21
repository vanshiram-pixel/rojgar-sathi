import { redirect } from "next/navigation";

// Visitors subscribe to alerts without creating an account.
export default function RegisterRedirect() {
  redirect("/#notifications");
}
