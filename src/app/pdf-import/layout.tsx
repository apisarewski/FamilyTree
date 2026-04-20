import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";

export default async function PdfImportLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userEmail={session.user.email!} userRole={session.user.role} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">{children}</main>
    </div>
  );
}
