import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRightLeft,
  CheckCircle2,
  ChevronRight,
  Download,
  FilePlus2,
  FileText,
  FileUp,
  Lock,
  Merge,
  Sparkles,
  SplitSquareHorizontal,
  Upload,
  Wand2,
  X,
  Zap,
} from "lucide-react";

const API_BASE = "http://localhost:8000";

function App() {
  const [activeTool, setActiveTool] = useState("word-to-pdf");
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([
    { name: "Resume.docx", action: "Word → PDF", time: "2 min ago" },
    { name: "Notes.pdf", action: "Merged PDFs", time: "14 min ago" },
  ]);
  const inputRef = useRef(null);

  const toolCards = [
    {
      id: "word-to-pdf",
      title: "Word to PDF",
      desc: "Convert DOCX files into clean, share-ready PDFs.",
      icon: FileText,
      badge: "Most used",
      accept: ".doc,.docx",
      output: ".pdf",
      endpoint: "/word-to-pdf",
      multiple: false,
    },
    {
      id: "pdf-to-word",
      title: "PDF to Word",
      desc: "Turn PDFs into editable DOCX documents.",
      icon: ArrowRightLeft,
      badge: "Editable output",
      accept: ".pdf",
      output: ".docx",
      endpoint: "/pdf-to-word",
      multiple: false,
    },
    {
      id: "merge-pdf",
      title: "Merge PDFs",
      desc: "Combine multiple PDF files into one document.",
      icon: Merge,
      badge: "Fast merge",
      accept: ".pdf",
      output: ".pdf",
      endpoint: "/merge-pdfs",
      multiple: true,
    },
    {
      id: "split-pdf",
      title: "Split PDF",
      desc: "Separate pages from a PDF into smaller files.",
      icon: SplitSquareHorizontal,
      badge: "Coming soon",
      accept: ".pdf",
      output: ".pdf",
      endpoint: "/split-pdf",
      multiple: false,
      disabled: true,
    },
  ];

  const activeToolData = useMemo(
    () => toolCards.find((t) => t.id === activeTool) || toolCards[0],
    [activeTool]
  );

  const onPickFiles = (picked) => {
    const next = Array.from(picked || []).map((file) => ({
      id: `${file.name}-${file.lastModified}`,
      file,
      name: file.name,
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
    }));
    setFiles((prev) => (activeToolData.multiple ? [...prev, ...next] : next.slice(0, 1)));
    setResult(null);
    setError("");
  };

  const onDrop = (e) => {
    e.preventDefault();
    onPickFiles(e.dataTransfer.files);
  };

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));
  const clearAll = () => {
    setFiles([]);
    setResult(null);
    setError("");
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const startAction = async () => {
    if (!files.length || isProcessing) return;
    if (activeToolData.disabled) {
      setError("This feature is coming soon.");
      return;
    }

    setIsProcessing(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();

      if (activeTool === "merge-pdf") {
        files.forEach((item) => formData.append("files", item.file));
      } else {
        formData.append("file", files[0].file);
      }

      const response = await fetch(`${API_BASE}${activeToolData.endpoint}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Conversion failed.");
      }

      const blob = await response.blob();
      const filename =
        activeTool === "merge-pdf"
          ? "merged.pdf"
          : activeTool === "pdf-to-word"
          ? "converted.docx"
          : "converted.pdf";

      downloadBlob(blob, filename);

      const newest = files[0];
      const displayName =
        activeTool === "merge-pdf"
          ? `${files.length} PDFs`
          : newest?.name || "File";

      setResult({
        name: filename,
        action: activeToolData.title,
        time: "just now",
      });
      setHistory((prev) => [
        {
          name: displayName,
          action: activeToolData.title,
          time: "just now",
        },
        ...prev,
      ]);
      setFiles([]);
    } catch (err) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setIsProcessing(false);
    }
  };

  const activeTitle = activeToolData.title;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_35%),radial-gradient(circle_at_80%_20%,_rgba(168,85,247,0.16),_transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]" />

      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 shadow-lg backdrop-blur">
            <Sparkles className="h-6 w-6 text-cyan-300" />
          </div>
          <div>
            <p className="text-sm text-slate-300">DocFlow Studio</p>
            <p className="font-semibold">Convert, merge, and manage documents</p>
          </div>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg transition hover:scale-[1.02]"
        >
          Upload files
        </button>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-14 lg:px-10">
        <section className="grid gap-8 lg:grid-cols-2 lg:items-center lg:pt-6">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              A beautiful place to convert and merge documents.
            </motion.h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              This starter website gives you a polished interface for Word to PDF,
              PDF to Word, PDF merging, and more. The buttons are now connected to
              the backend API.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                Secure uploads
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                Fast workflow
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                Simple design
              </div>
            </div>

            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              {[
                { label: "No clutter", value: "Clean UI" },
                { label: "One click", value: "Easy actions" },
                { label: "Future-ready", value: "Backend-ready" },
              ].map((item) => (
                <div
                  key={item.value}
                  className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-1 font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/8 p-4 shadow-2xl backdrop-blur-xl">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {toolCards.map((tool) => {
                const Icon = tool.icon;
                const selected = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`rounded-3xl border p-4 text-left transition ${
                      selected
                        ? "border-cyan-300/60 bg-cyan-300/10 shadow-lg"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10">
                        <Icon className="h-5 w-5 text-cyan-200" />
                      </div>
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-slate-200">
                        {tool.badge}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white">{tool.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{tool.desc}</p>
                  </button>
                );
              })}
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className="mt-4 rounded-[1.75rem] border border-dashed border-cyan-300/30 bg-slate-950/45 p-6"
            >
              <div className="flex flex-col items-center justify-center rounded-[1.4rem] border border-white/8 bg-white/5 px-6 py-10 text-center">
                <Upload className="h-12 w-12 text-cyan-300" />
                <h2 className="mt-4 text-xl font-bold text-white">
                  Drop files here for {activeTitle}
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
                  Drag and drop documents, or choose them from your device.
                </p>
                <p className="mt-3 text-xs text-slate-400">
                  Expected input: <span className="text-slate-200">{activeToolData.accept}</span>
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="rounded-full bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                  >
                    Choose files
                  </button>
                  <button
                    onClick={startAction}
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    {isProcessing ? "Processing..." : "Start process"}
                  </button>
                </div>
              </div>

              <input
                ref={inputRef}
                type="file"
                multiple={activeToolData.multiple}
                accept={activeToolData.accept}
                className="hidden"
                onChange={(e) => onPickFiles(e.target.files)}
              />
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-white">Selected files</h2>
                <p className="mt-1 text-sm text-slate-300">
                  Add one or more files, then run the selected action.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                {files.length} file(s)
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-3xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            )}

            <div className="mt-5 space-y-3">
              {files.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center text-slate-400">
                  No files selected yet.
                </div>
              ) : (
                files.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-950/50 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
                        <FilePlus2 className="h-5 w-5 text-cyan-200" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="text-sm text-slate-400">{item.size}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(item.id)}
                      className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={startAction}
                disabled={isProcessing || activeToolData.disabled}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing ? "Working..." : "Convert / Merge"}
              </button>
              <button
                onClick={clearAll}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Clear list
              </button>
            </div>

            {result && (
              <div className="mt-6 rounded-[1.75rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 grid h-10 w-10 place-items-center rounded-2xl bg-emerald-300/15">
                      <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Output ready</h3>
                      <p className="mt-1 text-sm text-slate-300">
                        {result.name} has been created successfully and downloaded.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={startAction}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                  >
                    Run again
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/15">
                  <Lock className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Built for trust</h3>
                  <p className="text-sm text-slate-300">Clean, simple, and ready for secure processing.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between rounded-2xl bg-slate-950/40 px-4 py-3">
                  <span>Upload limit</span>
                  <span className="font-semibold text-white">100 MB</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-950/40 px-4 py-3">
                  <span>Supported files</span>
                  <span className="font-semibold text-white">PDF, DOCX, DOC</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-950/40 px-4 py-3">
                  <span>Output</span>
                  <span className="font-semibold text-white">Instant download</span>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
              <h3 className="text-xl font-bold text-white">Recent activity</h3>
              <div className="mt-5 space-y-3">
                {history.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="text-sm text-slate-400">{item.action}</p>
                    </div>
                    <span className="text-xs text-slate-400">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "1. Upload",
              desc: "Select the file or files you want to work on.",
              icon: FileUp,
            },
            {
              title: "2. Process",
              desc: "Convert, merge, or split your document with one click.",
              icon: Wand2,
            },
            {
              title: "3. Download",
              desc: "Save the finished file directly to your device.",
              icon: Download,
            },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
                  <Icon className="h-6 w-6 text-cyan-200" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{step.desc}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-10 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Next step</p>
              <h2 className="mt-1 text-2xl font-bold text-white">Connect the real conversion engine</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                This design is ready. The backend now receives files, converts them, and returns the output file for download.
              </p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950">
              Backend connected <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              "Upload files from the browser",
              "Process them on the server",
              "Return the finished document",
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-4 text-sm text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-12 rounded-[2rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-300 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>DocFlow Studio — a polished starter for your document tools website.</p>
            <p className="flex items-center gap-2 text-slate-200">
              Backend-ready <Zap className="h-4 w-4" />
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
