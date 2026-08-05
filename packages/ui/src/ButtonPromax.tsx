import React from "react";
import "./styles/promax.css";

interface ButtonPromaxProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function ButtonPromax({
  children,
  className = "",
  ...props
}: ButtonPromaxProps) {
  return (
    <button className={`btn-promax ${className}`} {...props}>
      {children}
    </button>
  );
}
