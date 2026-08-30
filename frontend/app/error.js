"use client";

import Link from "next/link";

export default function GlobalError({ error, reset }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        fontFamily: "'IBM Plex Mono', monospace",
        color: "var(--pale)",
        background: "var(--void)",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <span className="brand" style={{ fontSize: "22px" }}>
        ASTOCK
      </span>
      <p style={{ color: "var(--mist)", maxWidth: "40ch" }}>
        Couldn&apos;t load live market data. The backend may be unreachable
        or restarting.
      </p>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={() => reset()} className="back" style={{ cursor: "pointer" }}>
          Try again
        </button>
        <Link href="/" className="back">
          Back home
        </Link>
      </div>
    </div>
  );
}
