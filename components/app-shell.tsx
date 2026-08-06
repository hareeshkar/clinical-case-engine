import Link from "next/link";
import { BookOpen, FileText, Library, Upload, type LucideIcon } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Brand } from "@/components/brand";

const links: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/library", label: "Library", icon: Library }, { href: "/questions", label: "Question bank", icon: BookOpen }, { href: "/upload", label: "Ingest PDF", icon: Upload }, { href: "/documents", label: "Documents", icon: FileText },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f7f5ef]"><header className="no-print sticky top-0 z-20 border-b border-[#d9dfdc] bg-[#f7f5ef]/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8"><Brand href="/library" /><nav className="hidden items-center gap-1 md:flex">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-[#53656c] transition hover:bg-[#e8f0ed] hover:text-[#0b1f2a]"><Icon size={15} />{label}</Link>)}</nav><div className="flex items-center gap-3"><Link href="/upload" className="hidden rounded-full bg-[#0b1f2a] px-4 py-2 text-sm font-semibold text-white sm:block">New study set</Link><UserButton /></div></div></header><main>{children}</main><nav className="no-print fixed bottom-0 z-20 flex w-full justify-around border-t border-[#d9dfdc] bg-[#f7f5ef] px-2 py-2 md:hidden">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex flex-col items-center gap-1 px-2 text-[10px] text-[#53656c]"><Icon size={17}/>{label}</Link>)}</nav></div>;
}
