import { Activity } from "lucide-react";
import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return <Link href={href} className="flex items-center gap-2.5" aria-label="Atria home"><span className="grid size-8 place-items-center rounded-full bg-[#0b1f2a] text-[#e8f5f2]"><Activity size={17} strokeWidth={2.5} /></span><span className="display text-2xl font-semibold tracking-tight">atria</span></Link>;
}
