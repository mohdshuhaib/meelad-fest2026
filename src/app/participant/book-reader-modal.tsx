"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  BookOpen,
  X,
  Maximize2,
  Minimize2,
  ShieldAlert,
  AlertCircle,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Layers,
  FileText,
} from "lucide-react";

interface BookReaderModalProps {
  programCode: string;
  programName: string;
  participantName: string;
  registrationId: string;
}

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

export function BookReaderModal({
  programCode,
  programName,
  participantName,
  registrationId,
}: BookReaderModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState("Initializing secure viewer...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // PDF Document State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"single" | "scroll">("scroll");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  const pdfUrl = `/api/participant/book-reader/${programCode}`;

  // Load PDF.js library script dynamically
  const loadPdfJsScript = useCallback(async (): Promise<boolean> => {
    if (window.pdfjsLib) return true;

    return new Promise((resolve) => {
      const existingScript = document.getElementById("pdfjs-lib-script");
      if (existingScript) {
        if (window.pdfjsLib) {
          resolve(true);
          return;
        }
        existingScript.addEventListener("load", () => resolve(true));
        existingScript.addEventListener("error", () => resolve(false));
        return;
      }

      const script = document.createElement("script");
      script.id = "pdfjs-lib-script";
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.async = true;
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          resolve(true);
        } else {
          resolve(false);
        }
      };
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }, []);

  // Initialize and load PDF document when modal opens
  useEffect(() => {
    if (!isOpen) {
      setPdfDoc(null);
      setNumPages(0);
      setCurrentPage(1);
      setErrorMsg(null);
      setLoading(true);
      return;
    }

    let isMounted = true;

    async function initPdf() {
      setLoading(true);
      setErrorMsg(null);
      setLoadingProgress("Loading secure reader engine...");

      // 1. Load PDF.js library
      const ready = await loadPdfJsScript();
      if (!isMounted) return;
      if (!ready || !window.pdfjsLib) {
        setErrorMsg("Could not initialize the online reader engine. Please check your internet connection.");
        setLoading(false);
        return;
      }

      // 2. Fetch and parse PDF document
      setLoadingProgress("Fetching book content...");
      try {
        const loadingTask = window.pdfjsLib.getDocument({
          url: pdfUrl,
          withCredentials: true,
        });

        loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
          if (progressData.total > 0) {
            const percent = Math.round((progressData.loaded / progressData.total) * 100);
            setLoadingProgress(`Loading book... ${percent}%`);
          }
        };

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        setLoading(false);
        if (err?.status === 404 || err?.message?.includes("404")) {
          setErrorMsg(
            "Book PDF is not found on the server. Please ensure 'fs001-book.pdf' is uploaded to 'private_assets/books/'."
          );
        } else if (err?.status === 403 || err?.message?.includes("403")) {
          setErrorMsg("Access Restricted: Only participants registered for this Book Test programme can view this book.");
        } else {
          setErrorMsg("Could not load book file. Please ensure 'fs001-book.pdf' is placed in 'private_assets/books/'.");
        }
      }
    }

    initPdf();

    // Security event listeners: block shortcuts and right-click
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["s", "p", "c", "u"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
      if (e.key === "ArrowLeft") {
        setCurrentPage((prev) => Math.max(1, prev - 1));
      }
      if (e.key === "ArrowRight") {
        setCurrentPage((prev) => Math.min(numPages || 1, prev + 1));
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      isMounted = false;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [isOpen, pdfUrl, loadPdfJsScript, numPages]);

  // Render single page onto canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || viewMode !== "single") return;

    let isCancelled = false;

    async function renderPage() {
      if (renderTaskRef.current) {
        try {
          await renderTaskRef.current.cancel();
        } catch {}
      }

      try {
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled || !canvasRef.current) return;

        const viewport = page.getViewport({ scale, rotation });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        // Support high-DPI (Retina / Mobile OLED) screens
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error("Canvas render error:", err);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, currentPage, scale, rotation, viewMode]);

  // Handle mobile / desktop responsive auto-scale on open
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setScale(0.95);
        setViewMode("scroll");
      } else {
        setScale(1.2);
        setViewMode("scroll");
      }
    }
  }, [isOpen]);

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-amber-500 px-4 py-2 text-xs font-black text-emerald shadow-sm transition-all hover:scale-[1.02] hover:shadow-md active:scale-95 cursor-pointer"
      >
        <BookOpen size={16} className="text-emerald" />
        <span>Read Book (Online Viewer)</span>
      </button>

      {/* Reader Modal Overlay */}
      {isOpen && (
        <div
          className={`fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-md transition-all ${
            isFullscreen ? "p-0" : "p-2 sm:p-4 md:p-6"
          }`}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Print protection style */}
          <style jsx global>{`
            @media print {
              body {
                display: none !important;
              }
            }
          `}</style>

          <div
            className={`flex flex-col overflow-hidden bg-[#0d2822] shadow-2xl transition-all ${
              isFullscreen
                ? "h-full w-full rounded-none"
                : "mx-auto h-[94vh] w-full max-w-5xl rounded-3xl border border-gold/30"
            }`}
          >
            {/* Header / Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#08201a] px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gold/20 text-gold">
                  <BookOpen size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-gold/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-gold">
                      {programCode}
                    </span>
                    <span className="truncate text-[10px] font-bold text-emerald-300">
                      • {registrationId}
                    </span>
                  </div>
                  <h2 className="truncate font-serif text-sm font-bold text-white sm:text-base">
                    {programName}
                  </h2>
                </div>
              </div>

              {/* Top Controls */}
              <div className="flex items-center gap-2">
                {/* Fullscreen Toggle */}
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  className="grid size-9 place-items-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition hover:bg-white/15 hover:text-white"
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close Reader"
                  className="grid size-9 place-items-center rounded-xl bg-red-500/20 text-red-300 transition hover:bg-red-500 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Reading Toolbar & Controls */}
            {pdfDoc && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0c2e26] px-4 py-2 text-xs text-white">
                {/* Navigation Controls (Single page mode) */}
                {viewMode === "single" ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="grid size-8 place-items-center rounded-lg bg-white/10 text-white disabled:opacity-30 hover:bg-white/20"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="font-bold text-gold">
                      Page {currentPage} of {numPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= numPages}
                      onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                      className="grid size-8 place-items-center rounded-lg bg-white/10 text-white disabled:opacity-30 hover:bg-white/20"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gold">
                    <FileText size={15} />
                    <span>Total {numPages} Pages</span>
                  </div>
                )}

                {/* Zoom & View Options */}
                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <button
                    type="button"
                    onClick={() => setViewMode(viewMode === "scroll" ? "single" : "scroll")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-white/90 hover:bg-white/15"
                  >
                    <Layers size={13} />
                    <span className="hidden sm:inline">
                      {viewMode === "scroll" ? "All Pages (Scroll)" : "Single Page"}
                    </span>
                  </button>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 p-0.5">
                    <button
                      type="button"
                      disabled={scale <= 0.6}
                      onClick={() => setScale((s) => Math.max(0.6, Number((s - 0.15).toFixed(2))))}
                      title="Zoom Out"
                      className="grid size-7 place-items-center rounded text-white/90 hover:bg-white/15 disabled:opacity-30"
                    >
                      <ZoomOut size={14} />
                    </button>
                    <span className="px-1 text-[11px] font-bold text-gold select-none">
                      {Math.round(scale * 100)}%
                    </span>
                    <button
                      type="button"
                      disabled={scale >= 2.5}
                      onClick={() => setScale((s) => Math.min(2.5, Number((s + 0.15).toFixed(2))))}
                      title="Zoom In"
                      className="grid size-7 place-items-center rounded text-white/90 hover:bg-white/15 disabled:opacity-30"
                    >
                      <ZoomIn size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Confidentiality Notice Banner */}
            <div className="flex items-center justify-between gap-2 border-b border-white/5 bg-gold/10 px-4 py-1.5 text-[10px] font-bold text-gold sm:text-[11px]">
              <span className="flex items-center gap-1.5 truncate">
                <ShieldAlert size={14} className="shrink-0" />
                Online Reading Only • Downloading, printing, and sharing are disabled
              </span>
              <span className="hidden sm:inline shrink-0 text-gold/80">
                Participant: {participantName} ({registrationId})
              </span>
            </div>

            {/* Viewer Content Area */}
            <div
              ref={scrollContainerRef}
              className="relative flex-1 overflow-auto bg-[#141b18] p-3 select-none flex justify-center sm:p-6"
            >
              {loading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0d2822]/95 text-white">
                  <LoaderCircle size={36} className="animate-spin text-gold" />
                  <p className="font-serif text-sm font-semibold text-emerald-200">
                    {loadingProgress}
                  </p>
                </div>
              )}

              {errorMsg ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center text-white">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 mb-4">
                    <AlertCircle size={28} />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-red-300 mb-2">
                    Unable to Open Book
                  </h3>
                  <p className="max-w-md text-sm text-white/80 mb-6">
                    {errorMsg}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full bg-white/10 px-6 py-2.5 text-xs font-bold text-white hover:bg-white/20"
                  >
                    Close Reader
                  </button>
                </div>
              ) : pdfDoc ? (
                viewMode === "single" ? (
                  // SINGLE PAGE MODE
                  <div className="flex flex-col items-center justify-start py-2">
                    <canvas
                      ref={canvasRef}
                      className="rounded-lg shadow-2xl bg-white max-w-full"
                      style={{
                        pointerEvents: "auto",
                        userSelect: "none",
                      }}
                    />
                  </div>
                ) : (
                  // CONTINUOUS SCROLL MODE (All pages rendered onto canvases sequentially)
                  <ContinuousPagesViewer
                    pdfDoc={pdfDoc}
                    scale={scale}
                    rotation={rotation}
                    numPages={numPages}
                  />
                )
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Sub-component for rendering all pages in continuous scroll mode onto canvas elements
function ContinuousPagesViewer({
  pdfDoc,
  scale,
  rotation,
  numPages,
}: {
  pdfDoc: any;
  scale: number;
  rotation: number;
  numPages: number;
}) {
  const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-col items-center gap-6 py-2 max-w-full">
      {pageNumbers.map((pageNum) => (
        <SinglePageCanvas
          key={pageNum}
          pdfDoc={pdfDoc}
          pageNum={pageNum}
          scale={scale}
          rotation={rotation}
        />
      ))}
    </div>
  );
}

function SinglePageCanvas({
  pdfDoc,
  pageNum,
  scale,
  rotation,
}: {
  pdfDoc: any;
  pageNum: number;
  scale: number;
  rotation: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function renderPage() {
      if (!canvasRef.current || !pdfDoc) return;

      try {
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled || !canvasRef.current) return;

        const viewport = page.getViewport({ scale, rotation });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        if (!isCancelled) setRendered(true);
      } catch (err) {
        console.error(`Page ${pageNum} render error:`, err);
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, pageNum, scale, rotation]);

  return (
    <div className="relative flex flex-col items-center max-w-full">
      <div className="mb-1 text-[10px] font-bold text-white/50">
        Page {pageNum}
      </div>
      <canvas
        ref={canvasRef}
        className="rounded-lg shadow-2xl bg-white max-w-full"
        style={{
          pointerEvents: "auto",
          userSelect: "none",
        }}
      />
    </div>
  );
}
