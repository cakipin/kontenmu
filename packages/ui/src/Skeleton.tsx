import React from 'react';
import './styles/promax.css';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export function Skeleton({ width = '100%', height = '20px', borderRadius = '8px', className = '', ...props }: SkeletonProps) {
  return (
    <div 
      className={`skeleton ${className}`} 
      style={{ width, height, borderRadius, ...props.style }}
      {...props}
    />
  );
}
