"use client";

import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Expand, Minus, Plus, RotateCcw } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

const MIN_ZOOM = 0.65;
const MAX_ZOOM = 3;
const clamp = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

type TouchPoint = { x: number; y: number };

export default function PdfViewerCanvas({ url, title }: { url: string; title: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const points = useRef(new Map<number, TouchPoint>());
  const pan = useRef<{ id: number; x: number; y: number; left: number; top: number } | null>(null);
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(420);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const resize = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width - 24)));
    resize.observe(viewport);
    return () => resize.disconnect();
  }, []);

  function updatePoint(event: PointerEvent<HTMLDivElement>) { points.current.set(event.pointerId, { x: event.clientX, y: event.clientY }); }
  function distance() { const [a, b] = [...points.current.values()]; return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0; }
  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    updatePoint(event);
    if (points.current.size === 2) pinch.current = { distance: distance(), zoom };
    if (points.current.size === 1 && viewportRef.current) pan.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: viewportRef.current.scrollLeft, top: viewportRef.current.scrollTop };
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!points.current.has(event.pointerId)) return;
    updatePoint(event);
    if (points.current.size === 2 && pinch.current) {
      setZoom(clamp(pinch.current.zoom * (distance() / pinch.current.distance)));
      return;
    }
    const activePan = pan.current;
    const viewport = viewportRef.current;
    if (activePan?.id === event.pointerId && viewport) { viewport.scrollLeft = activePan.left - (event.clientX - activePan.x); viewport.scrollTop = activePan.top - (event.clientY - activePan.y); }
  }
  function onPointerEnd(event: PointerEvent<HTMLDivElement>) { points.current.delete(event.pointerId); if (points.current.size < 2) pinch.current = null; if (pan.current?.id === event.pointerId) pan.current = null; }
  function onWheel(event: WheelEvent<HTMLDivElement>) { if (!event.ctrlKey && !event.metaKey) return; event.preventDefault(); setZoom((current) => clamp(current + (event.deltaY < 0 ? 0.1 : -0.1))); }

  return <div className="flex h-full min-h-[32rem] flex-col overflow-hidden border border-[#c9d3cf] bg-[#dde5e2]">
    <div className="no-print flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-[#c9d3cf] bg-[#f7f5ef] px-2 py-1.5">
      <div className="flex items-center gap-1"><button onClick={() => setPageNumber((current) => Math.max(1, current - 1))} disabled={pageNumber <= 1} className="grid size-10 place-items-center rounded-full hover:bg-[#e8f5f2] disabled:opacity-35" aria-label="Previous page"><ChevronLeft size={18}/></button><span className="min-w-20 text-center text-xs font-semibold">{pageCount ? `${pageNumber} / ${pageCount}` : "Loading"}</span><button onClick={() => setPageNumber((current) => Math.min(pageCount, current + 1))} disabled={!pageCount || pageNumber >= pageCount} className="grid size-10 place-items-center rounded-full hover:bg-[#e8f5f2] disabled:opacity-35" aria-label="Next page"><ChevronRight size={18}/></button></div>
      <div className="flex items-center gap-1"><button onClick={() => setZoom((current) => clamp(current - 0.2))} className="grid size-10 place-items-center rounded-full hover:bg-[#e8f5f2]" aria-label="Zoom out"><Minus size={17}/></button><span className="min-w-12 text-center text-xs font-semibold">{Math.round(zoom * 100)}%</span><button onClick={() => setZoom((current) => clamp(current + 0.2))} className="grid size-10 place-items-center rounded-full hover:bg-[#e8f5f2]" aria-label="Zoom in"><Plus size={17}/></button><button onClick={() => setZoom(1)} className="grid size-10 place-items-center rounded-full hover:bg-[#e8f5f2]" aria-label="Reset zoom"><RotateCcw size={15}/></button></div>
    </div>
    <div ref={viewportRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd} onWheel={onWheel} className="flex-1 overflow-auto p-3" style={{ touchAction: "none" }} aria-label={`${title} PDF viewer`}>
      <div className="flex min-h-full min-w-max items-start justify-center">
        <Document file={url} onLoadSuccess={({ numPages }) => { setPageCount(numPages); setPageNumber(1); }} loading={<p className="p-8 text-sm text-[#60717a]">Loading source PDF…</p>} error={<p className="p-8 text-sm text-[#b3503e]">This PDF could not be displayed.</p>}>
          <Page pageNumber={pageNumber} width={width} scale={zoom} renderAnnotationLayer={false} renderTextLayer={false} loading={null}/>
        </Document>
      </div>
    </div>
    <p className="border-t border-[#c9d3cf] bg-[#f7f5ef] px-3 py-2 text-xs text-[#60717a]"><span className="hidden sm:inline"><Expand className="mr-1 inline" size={13}/>Pinch to zoom · drag to pan · </span>Use controls to navigate and zoom</p>
  </div>;
}
