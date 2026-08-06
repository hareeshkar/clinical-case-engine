import { auth } from "@clerk/nextjs/server";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await auth.protect();
  return <AppShell>{children}</AppShell>;
}
