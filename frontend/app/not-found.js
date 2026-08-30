import Link from "next/link";

export default function NotFound() {
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
        textAlign: "center",
        padding: "24px",
      }}
    >
      <span className="brand" style={{ fontSize: "22px" }}>
        ASTOCK
      </span>
      <p style={{ color: "var(--mist)" }}>
        That ticker isn&apos;t under coverage.
      </p>
      <Link href="/" className="back">
        Back to search
      </Link>
    </div>
  );
}
