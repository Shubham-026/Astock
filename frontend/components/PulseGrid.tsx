// Numeric SVG path coordinates (offset-path: path() does not support
// percentage units), sized against an assumed ~1400x640 viewport. Purely
// decorative, so minor scale drift across breakpoints is acceptable.
const PATHS = [
  "M -60 130 C 240 60, 480 200, 700 100 S 1100 170, 1460 70",
  "M -60 380 C 200 440, 460 280, 660 350 S 1040 250, 1460 350",
  "M -60 540 C 280 580, 520 440, 760 500 S 1080 410, 1460 490",
  "M -60 260 C 240 220, 560 350, 780 240 S 1140 300, 1460 220",
];

const NODE_CONFIG = [
  { path: 0, duration: 16, delay: 0, color: "aqua" },
  { path: 0, duration: 16, delay: 8, color: "violet" },
  { path: 1, duration: 20, delay: 3, color: "aqua" },
  { path: 1, duration: 20, delay: 13, color: "aqua" },
  { path: 2, duration: 24, delay: 6, color: "violet" },
  { path: 2, duration: 24, delay: 18, color: "aqua" },
  { path: 3, duration: 18, delay: 1, color: "aqua" },
  { path: 3, duration: 18, delay: 10, color: "violet" },
];

export default function PulseGrid() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-grid-lines bg-grid opacity-70 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_20%,black,transparent)]" />
      <div className="absolute inset-0 bg-radial-fade" />

      {NODE_CONFIG.map((node, i) => (
        <span
          key={i}
          className={`absolute h-[6px] w-[6px] rounded-full ${
            node.color === "aqua"
              ? "bg-aqua shadow-[0_0_12px_3px_rgba(94,234,212,0.7)]"
              : "bg-violet shadow-[0_0_12px_3px_rgba(167,139,250,0.7)]"
          }`}
          style={{
            offsetPath: `path('${PATHS[node.path]}')`,
            offsetRotate: "0deg",
            animation: `node-travel ${node.duration}s linear ${node.delay}s infinite`,
            top: 0,
            left: 0,
          }}
        />
      ))}
    </div>
  );
}
