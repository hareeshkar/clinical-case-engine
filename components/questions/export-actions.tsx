"use client";

import { pdf, Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Download, FolderPlus } from "lucide-react";
import type { Question } from "@/lib/domain/types";

const styles = StyleSheet.create({ page: { padding: 36, fontSize: 10, color: "#0b1f2a" }, title: { fontSize: 22, marginBottom: 18 }, question: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "#d9dfdc", paddingBottom: 10 }, stem: { fontSize: 12, marginBottom: 6 }, option: { marginBottom: 3 }, cite: { color: "#60717a", marginTop: 5, fontSize: 8 } });
function StudyPdf({ questions }: { questions: Question[] }) { return <Document><Page size="A4" style={styles.page}><Text style={styles.title}>Atria clinical practice set</Text>{questions.map((question, index) => <View key={question.id} style={styles.question}><Text style={styles.stem}>{index + 1}. {question.stem}</Text>{question.options.map((option, optionIndex) => <Text key={option} style={styles.option}>{String.fromCharCode(65 + optionIndex)}. {option}</Text>)}<Text style={styles.cite}>Answer: {String.fromCharCode(65 + question.correctIndex)} · {question.sourceCitation}</Text></View>)}</Page></Document>; }
export function ExportActions({ questions }: { questions: Question[] }) {
  async function downloadPdf() { const blob = await pdf(<StudyPdf questions={questions}/>).toBlob(); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "atria-practice-set.pdf"; link.click(); URL.revokeObjectURL(url); }
  function downloadFlashcards() { const text = questions.map((question) => `${question.stem}\t${question.options[question.correctIndex]}\n${question.rationale.replaceAll("\n", " ")}`).join("\n\n"); const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([text], { type: "text/tab-separated-values" })); link.download = "atria-flashcards.tsv"; link.click(); URL.revokeObjectURL(link.href); }
  return <div className="no-print flex flex-wrap gap-2"><button onClick={downloadPdf} className="flex items-center gap-2 rounded-full border border-[#b8c5c0] bg-white px-3 py-2 text-sm font-semibold"><Download size={15}/>PDF set</button><button onClick={downloadFlashcards} className="flex items-center gap-2 rounded-full border border-[#b8c5c0] bg-white px-3 py-2 text-sm font-semibold"><FolderPlus size={15}/>Flashcards</button></div>;
}
