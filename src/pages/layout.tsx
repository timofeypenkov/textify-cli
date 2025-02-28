// app/layout.tsx или где находится PagesLayout
import { Navbar } from "@/components/Navbar";
import { auth } from "@/lib/auth";
import { SessionProvider } from "next-auth/react";
import { redirect } from "next/navigation";

export default async function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <SessionProvider session={session}>
      <Navbar />
      <div>{children}</div>
    </SessionProvider>
  );
}
