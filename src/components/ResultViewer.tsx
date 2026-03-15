"use client";

import { useState } from "react";
import { FileText, X, Download, Loader2, ExternalLink } from "lucide-react";

interface ResultViewerProps {
  bookingId: string;
  packageTitle: string;
}

export default function ResultViewer({ bookingId, packageTitle }: ResultViewerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUrl = async () => {
    if (url) return url; // reuse if already fetched this session
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/result-url`);
      if (!res.ok) throw new Error("Could not load result");
      const data = await res.json();
      setUrl(data.url);
      return data.url as string;
    } catch (e) {
      setError("Failed to load result. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleView = async () => {
    await fetchUrl();
    setOpen(true);
  };

  const handleDownload = async () => {
    const pdfUrl = await fetchUrl();
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `${packageTitle.replace(/\s+/g, "_")}_result.pdf`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handleView}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-[#8a3a7a] font-medium disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          View Result
        </button>
        <button
          onClick={handleDownload}
          disabled={loading}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
          title="Download PDF"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {open && url && (
        <div className="fixed inset-0 bg-black/70 flex flex-col z-50">
          {/* Modal header */}
          <div className="bg-white flex items-center justify-between px-5 py-3 shadow">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-semibold text-gray-900 text-sm">{packageTitle} — Result</span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={url}
                download={`${packageTitle.replace(/\s+/g, "_")}_result.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-[#8a3a7a]"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50"
              >
                <ExternalLink className="w-4 h-4" />
                Open
              </a>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* PDF iframe */}
          <div className="flex-1 bg-gray-800">
            <iframe
              src={`${url}#toolbar=0`}
              className="w-full h-full"
              title={`${packageTitle} result`}
            />
          </div>
        </div>
      )}
    </>
  );
}
