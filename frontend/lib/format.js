export function initials(name) {
  return name
    .replace(/[^A-Za-z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function fmtChg(v) {
  return (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
}

export function fmtUsd(v) {
  return `$${v.toFixed(2)}`;
}
