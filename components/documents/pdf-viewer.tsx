"use client";

import dynamic from "next/dynamic";

const PdfViewerCanvas = dynamic(() => import("@/components/documents/pdf-viewer-canvas"), {
  ssr: false,
  loading: () => <div className="grid h-full min-h-[32rem] place-items-center border border-[#c9d3cf] bg-[#e9efed] text-sm text-[#60717a]">Loading source viewer…</div>,
});

export function PdfViewer({ url, title }: { url: string; title: string }) {
  return <PdfViewerCanvas url={url} title={title}/>;
}
