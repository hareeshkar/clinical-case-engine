import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LibraryBrowser } from "@/components/library/library-browser";
import { listAvailableSpecialties, listDocuments } from "@/lib/db/queries";

export default async function LibraryPage() {
  const { userId } = await auth();
  const [taxonomy, documents] = userId ? await Promise.all([listAvailableSpecialties(userId), listDocuments(userId)]) : [[], []];
  return <div className="mx-auto max-w-7xl px-5 pb-24 pt-12 lg:px-8"><p className="eyebrow">Your classified library</p><div className="mt-4 flex flex-wrap items-end justify-between gap-5"><div><h1 className="display max-w-3xl text-5xl leading-[.95] sm:text-6xl">Sources organised<br/>by clinical focus.</h1><p className="mt-5 max-w-2xl leading-7 text-[#60717a]">Each saved PDF can appear in every confirmed specialty collection. Parent collections open a focused hierarchy; leaf collections open sources and their question groups.</p></div><Link href="/upload" className="primary-action flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold">Ingest PDF <ArrowUpRight size={16}/></Link></div><LibraryBrowser taxonomy={taxonomy} documents={documents}/></div>;
}
