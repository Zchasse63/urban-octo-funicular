"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          background: "#FDFDFD",
          color: "#121212",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 400, padding: 24 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "rgba(255, 59, 48, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 32,
            }}
          >
            !
          </div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              margin: "0 0 8px",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#666",
              margin: "0 0 24px",
            }}
          >
            A critical error occurred. Please try refreshing the page.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: 12,
                fontFamily: "monospace",
                color: "#999",
                margin: "0 0 16px",
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 500,
              color: "white",
              background: "#007AFF",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
