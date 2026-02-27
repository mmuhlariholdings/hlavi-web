"use client";

import { useEffect, useState } from "react";

interface TextRotatorProps {
  texts: string[];
  interval?: number;
  className?: string;
}

export function TextRotator({ texts, interval = 2500, className = "" }: TextRotatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % texts.length);
        setIsAnimating(false);
      }, 300);
    }, interval);

    return () => clearInterval(timer);
  }, [texts.length, interval]);

  return (
    <span
      className={`inline-block transition-all duration-300 ${
        isAnimating ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
      } ${className}`}
    >
      {texts[currentIndex]}
    </span>
  );
}
