"use client";

import { useState, useEffect } from "react";
import { BookOpen, X, Maximize2, Minimize2, ShieldAlert, AlertCircle, LoaderCircle } from "lucide-react";

interface BookReaderModalProps {
  programCode: string;
  programName: string;
  participantName: string;
  registrationId: string;
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pdfUrl = `/api/participant/book-reader/${programCode}#toolbar=0&navpanes=0&scrollbar=1`;

  // Pre-check if book is accessible when opened
  useEffect(() => {
    if (!isOpen) {
      setLoading(true);
      setErrorMsg(null);
      return;
    }

    let isMounted = true;
    fetch(`/api/participant/book-reader/${programCode}`, { method: "HEAD" })
      .then((res) => {
        if (!isMounted) return;
        if (!res.ok) {
          if (res.status === 404) {
            setErrorMsg(
              "Book PDF file is not found on the server. Please ensure 'fs001-book.pdf' is placed in 'private_assets/books/' or 'public/books/'."
            );
          } else if (res.status === 403) {
            setErrorMsg("Access Restricted: You are not registered for this Book Test programme.");
          } else {
            setErrorMsg("Unable to load the book. Please try again later.");
          }
        }
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl/Cmd + S (Save), Ctrl/Cmd + P (Print), Ctrl/Cmd + C (Copy)
      if ((e.ctrlKey || e.metaKey) && ["s", "p", "c"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
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
  }, [isOpen, programCode]);

  return (
    <>
      {/* Trigger Button on Dashboard Card */}
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
          className={`fixed inset-0 z-[100] flex flex-col bg-black/85 backdrop-blur-md transition-all ${
            isFullscreen ? "p-0" : "p-2 sm:p-4 md:p-6"
          }`}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Print protection style injection */}
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
                : "mx-auto h-[92vh] w-full max-w-5xl rounded-3xl border border-gold/30"
            }`}
          >
            {/* Header / Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#08201a] px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-gold/20 text-gold">
                  <BookOpen size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-gold/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-gold">
                      {programCode}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-300">
                      • Registered: {registrationId}
                    </span>
                  </div>
                  <h2 className="font-serif text-base font-bold text-white sm:text-lg">
                    {programName}
                  </h2>
                </div>
              </div>

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

            {/* Confidentiality Notice Banner */}
            <div className="flex items-center justify-between gap-2 border-b border-white/5 bg-gold/10 px-4 py-1.5 text-[11px] font-bold text-gold">
              <span className="flex items-center gap-1.5">
                <ShieldAlert size={14} />
                Confidential Document • Online Reading Only (Downloading and sharing are disabled)
              </span>
              <span className="hidden sm:inline text-[10px] text-gold/80">
                Participant: {participantName} ({registrationId})
              </span>
            </div>

            {/* Viewer Content Area */}
            <div className="relative flex-1 bg-[#1a1f1d] select-none">
              {loading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#111816] text-white">
                  <LoaderCircle size={32} className="animate-spin text-gold" />
                  <p className="font-serif text-sm font-semibold text-emerald-200">
                    Loading book for online reading...
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
              ) : (
                <iframe
                  src={pdfUrl}
                  title={`${programName} Online Book`}
                  onLoad={() => setLoading(false)}
                  className="h-full w-full border-0 select-none bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
