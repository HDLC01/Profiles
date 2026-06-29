import { redirect } from "next/navigation";

// Protected by proxy.ts; signed-in users land straight on the candidate grid.
export default function Home() {
  redirect("/candidates");
}
