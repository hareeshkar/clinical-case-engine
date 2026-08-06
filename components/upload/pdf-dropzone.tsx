"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FileUp, LoaderCircle, Save, ShieldCheck, X } from "lucide-react";
import { McqCard } from "@/components/questions/mcq-card";
import { specialties } from "@/lib/domain/specialties";
import type { Difficulty, Focus, Question } from "@/lib/domain/types";

const MAX_PDF_BYTES = 50 * 1024 * 1024;
type Draft = { blobUrl: string; originalFileName: string; size: number; questions: Question[]; overallNotes: string };

export function PdfDropzone() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const discardedUrls = useRef(new Set<string>());
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [focus, setFocus] = useState<Focus>("diagnostic");
  const [difficulty, setDifficulty] = useState<Difficulty>("undergrad");
  const [count, setCount] = useState(5);
  const [specialtyHint, setSpecialtyHint] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [studyTitle, setStudyTitle] = useState("");
  const [showNameDialog, setShowNameDialog] = useState(false);

  function removeStagedBlob(url: string) {
    if (discardedUrls.current.has(url)) return;
    discardedUrls.current.add(url);
    void fetch(`/api/blob?url=${encodeURIComponent(url)}`, { method: "DELETE", keepalive: true });
  }

  useEffect(() => {
    if (!draft) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const discardOnExit = () => removeStagedBlob(draft.blobUrl);
    window.addEventListener("beforeunload", warnBeforeLeaving);
    window.addEventListener("pagehide", discardOnExit);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeLeaving);
      window.removeEventListener("pagehide", discardOnExit);
      removeStagedBlob(draft.blobUrl);
    };
  }, [draft]);

  function choose(candidate?: File) {
    setNotice(null);
    if (!candidate) return;
    if (candidate.type !== "application/pdf" || candidate.size > MAX_PDF_BYTES) {
      setNotice("Choose a PDF no larger than 50 MB.");
      return;
    }
    setFile(candidate);
  }

  async function generate() {
    if (!file) return;
    setBusy(true);
    setNotice(null);
    try {
      const blob = await upload(`clinical-pdfs/${Date.now()}-${file.name}`, file, {
        access: "private",
        handleUploadUrl: "/api/blob",
        clientPayload: JSON.stringify({ name: file.name, size: file.size }),
        contentType: "application/pdf",
        multipart: file.size > 4 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => setProgress(percentage),
      });
      const response = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blobUrl: blob.url, originalFileName: file.name, focus, difficulty, questionCount: count, specialtyHint: specialtyHint || undefined }),
      });
      const result = await response.json() as { questions?: Question[]; overallNotes?: string; error?: string };
      if (!response.ok || !result.questions) throw new Error(result.error ?? "Generation failed.");
      setDraft({ blobUrl: blob.url, originalFileName: file.name, size: file.size, questions: result.questions, overallNotes: result.overallNotes ?? "" });
      setStudyTitle(file.name.replace(/\.pdf$/i, "").replaceAll(/[-_]/g, " "));
      setFile(null);
      setProgress(0);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Upload failed.");
    } finally { setBusy(false); }
  }

  async function saveDocument() {
    if (!draft || !studyTitle.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: studyTitle, originalFileName: draft.originalFileName, size: draft.size, blobUrl: draft.blobUrl, questions: draft.questions }),
      });
      const result = await response.json() as { id?: string; error?: string };
      if (!response.ok || !result.id) throw new Error(result.error ?? "Could not save this source.");
      discardedUrls.current.add(draft.blobUrl);
      router.push("/documents");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save this source.");
      setShowNameDialog(false);
    } finally { setBusy(false); }
  }

  function discardDraft() {
    if (!draft) return;
    removeStagedBlob(draft.blobUrl);
    setDraft(null);
    setStudyTitle("");
    setShowNameDialog(false);
    setNotice("Generated questions and temporary PDF discarded.");
  }

  return <section className="mx-auto max-w-4xl">
    {!draft && <>
      <div onDrop={(event) => { event.preventDefault(); choose(event.dataTransfer.files[0]); }} onDragOver={(event) => event.preventDefault()} onClick={() => !file && input.current?.click()} className="cursor-pointer border border-dashed border-[#6ca79c] bg-[#e8f5f2] p-8 sm:p-12">
        <input ref={input} className="hidden" type="file" accept="application/pdf" onChange={(event) => choose(event.target.files?.[0])}/>
        {file ? <div className="flex items-center justify-between gap-4"><div><p className="font-semibold">{file.name}</p><p className="mt-1 text-sm text-[#60717a]">{(file.size / 1024 / 1024).toFixed(1)} MB · PDF validated</p></div><button className="rounded-full p-2 hover:bg-white" onClick={(event) => { event.stopPropagation(); setFile(null); }}><X size={18}/></button></div> : <div className="text-center"><FileUp className="mx-auto text-[#16756a]" size={36}/><p className="display mt-4 text-3xl">Drop a teaching PDF here</p><p className="mt-2 text-sm text-[#60717a]">or select from your device · maximum 50 MB</p></div>}
      </div>
      {file && <div className="mt-5 grid gap-4 border-y border-[#d9dfdc] py-5 sm:grid-cols-4">
        <label className="text-sm font-semibold">Focus<select value={focus} onChange={(event) => setFocus(event.target.value as Focus)} className="mt-2 w-full border border-[#c9d3cf] bg-white p-2 font-normal"><option value="diagnostic">Diagnostic</option><option value="surgical_complication">Complication</option><option value="physio_management">Physio management</option></select></label>
        <label className="text-sm font-semibold">Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)} className="mt-2 w-full border border-[#c9d3cf] bg-white p-2 font-normal"><option value="undergrad">Undergrad</option><option value="postgrad">Postgrad</option><option value="licensing">Licensing</option></select></label>
        <label className="text-sm font-semibold">Questions<select value={count} onChange={(event) => setCount(Number(event.target.value))} className="mt-2 w-full border border-[#c9d3cf] bg-white p-2 font-normal">{[3, 5, 8].map((amount) => <option key={amount}>{amount}</option>)}</select></label>
        <label className="text-sm font-semibold">Specialty<select value={specialtyHint} onChange={(event) => setSpecialtyHint(event.target.value)} className="mt-2 w-full border border-[#c9d3cf] bg-white p-2 font-normal"><option value="">Auto-detect</option>{specialties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      </div>}
      {file && <button disabled={busy} onClick={generate} className="primary-action mt-6 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-50">{busy && <LoaderCircle size={16} className="animate-spin"/>}{busy ? `Processing ${Math.round(progress)}%` : "Generate grounded MCQs"}</button>}
    </>}
    {notice && <p className="mt-5 border-l-2 border-[#2a9d8f] bg-[#edf5f2] p-4 text-sm leading-6 text-[#31544f]">{notice}</p>}
    {draft && <section className="fade-up mt-10 border-t-2 border-[#0b1f2a] pt-7">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Generated review</p><h2 className="display mt-2 text-4xl">Questions from {draft.originalFileName}</h2><p className="mt-3 max-w-2xl leading-7 text-[#60717a]">Review this set now. It only exists in this browser until saved; leaving discards it and removes the temporary PDF.</p></div><button disabled={busy} onClick={() => setShowNameDialog(true)} className="primary-action flex shrink-0 items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"><Save size={16}/>Save to Document</button></div>
      <div className="mt-8">{draft.questions.map((question) => <McqCard key={question.id} question={question} compact/>)}</div>
      <button disabled={busy} onClick={discardDraft} className="mt-5 text-sm font-semibold text-[#b3503e] underline underline-offset-4">Discard generated set</button>
    </section>}
    {showNameDialog && <div className="fixed inset-0 z-30 grid place-items-center bg-[#0b1f2a]/45 p-5" role="dialog" aria-modal="true" aria-labelledby="save-document-title"><div className="w-full max-w-md bg-[#f7f5ef] p-6 shadow-2xl"><p className="eyebrow">Save to Documents</p><h2 id="save-document-title" className="display mt-2 text-4xl">What should this source be called?</h2><label className="mt-6 block text-sm font-semibold">Document name<input autoFocus value={studyTitle} onChange={(event) => setStudyTitle(event.target.value)} placeholder="e.g. Heart disease" className="mt-2 w-full border border-[#9ab8b1] bg-white px-4 py-3 text-base font-normal outline-none focus:border-[#16756a]"/></label><p className="mt-2 text-xs text-[#60717a]">Original PDF: {draft?.originalFileName}</p><div className="mt-6 flex justify-end gap-3"><button disabled={busy} onClick={() => setShowNameDialog(false)} className="rounded-full px-4 py-2 text-sm font-semibold">Cancel</button><button disabled={busy || !studyTitle.trim()} onClick={saveDocument} className="primary-action rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50">{busy ? "Saving..." : "Save document"}</button></div></div></div>}
    <p className="mt-6 flex gap-2 text-xs leading-5 text-[#60717a]"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#2a9d8f]"/>Saved PDFs remain private and count toward the 1 GB Blob allowance. Delete old study sources from Documents to reclaim space.</p>
  </section>;
}
