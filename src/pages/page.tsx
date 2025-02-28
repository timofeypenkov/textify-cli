import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main className="flex flex-col gap-6 justify-center items-center p-6 md:p-10 min-h-svh bg-muted">
      Hello!
    </main>
  );
}
