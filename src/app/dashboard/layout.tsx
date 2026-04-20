import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userEmail={session.user.email!} userRole={session.user.role} />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
