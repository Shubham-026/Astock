import { HTMLAttributes } from "react";
import clsx from "clsx";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export default function GlassCard({
  className,
  hoverable = false,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={clsx("glass-panel", hoverable && "glass-card", className)}
      {...props}
    >
      {children}
    </div>
  );
}
