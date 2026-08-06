import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@/app/globals.css";

export const metadata: Metadata = { title: "Atria | Clinical Case Study Engine", description: "Document-grounded clinical learning and MCQ practice." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Local builds have no secrets. Production always requires Clerk through protected routes.
  return <html lang="en"><body>{process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? <ClerkProvider>{children}</ClerkProvider> : children}</body></html>;
}
