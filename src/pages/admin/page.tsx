import { auth } from "@/lib/auth";

export default async function AdminPage() {
  const session = await auth(); // Доступ гарантирован middleware
  return (
    <main className="flex flex-col gap-6 justify-center items-center p-6 md:p-10 min-h-svh bg-muted">
      <div>Welcome, {session?.user.name || "Admin"}!</div>
    </main>
  );
}
