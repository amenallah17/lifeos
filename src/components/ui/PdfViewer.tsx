'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface PdfViewerProps {
  url: string;
  title?: string;
  className?: string;
}

export default function PdfViewer({ url, title, className = '' }: PdfViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => setLoading(false), []);
  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  const isDataUrl = url.startsWith('data:');
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-lg ${className}`}
    >
      {title && (
        <div className="border-b border-white/10 px-4 py-3">
          <h3 className="truncate text-sm font-medium text-white/80">{title}</h3>
        </div>
      )}

      <div className="relative" style={{ aspectRatio: '4 / 3' }}>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-indigo-400" />
            <div className="flex w-full max-w-[200px] flex-col gap-2">
              <div className="h-2 w-full animate-pulse rounded-full bg-white/5" />
              <div className="h-2 w-3/4 animate-pulse rounded-full bg-white/5" />
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-red-400">Failed to load PDF</p>
            <p className="text-xs text-white/40">The document could not be rendered.</p>
          </div>
        )}

        {isDataUrl ? (
          <iframe
            src={url}
            className={`h-full w-full border-0 ${loading || error ? 'invisible absolute' : ''}`}
            onLoad={handleLoad}
            onError={handleError}
            title={title || 'PDF Viewer'}
          />
        ) : (
          <>
            <iframe
              src={googleViewerUrl}
              className={`h-full w-full border-0 ${loading || error ? 'invisible absolute' : ''}`}
              onLoad={handleLoad}
              onError={handleError}
              title={title || 'PDF Viewer'}
            />
            <embed
              src={url}
              type="application/pdf"
              className={`h-full w-full border-0 ${!error ? 'hidden' : ''}`}
              onLoad={handleLoad}
              onError={handleError}
              title={title || 'PDF Viewer'}
            />
          </>
        )}
      </div>
    </motion.div>
  );
}
