import React from "react";
import "./styles/promax.css";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassCard({
  children,
  className = "",
  style,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={`glass ${className}`}
      style={{ padding: "24px", ...style }}
      {...props}
    >
      {children}
    </div>
  );
}
