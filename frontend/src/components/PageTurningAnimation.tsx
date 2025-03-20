import React, { useState, useEffect } from "react";
import { cn } from "utils/cn";

interface PageTurningAnimationProps {
  children: React.ReactNode;
  className?: string;
  isAnimating: boolean;
  direction: "forward" | "backward";
}

export function PageTurningAnimation({ 
  children, 
  className,
  isAnimating,
  direction
}: PageTurningAnimationProps) {
  const [content, setContent] = useState<React.ReactNode>(children);
  const [newContent, setNewContent] = useState<React.ReactNode>(null);
  
  // When children change and animation is complete, update content
  useEffect(() => {
    if (!isAnimating) {
      setContent(children);
      setNewContent(null);
    }
  }, [children, isAnimating]);

  // When animation starts, set new content
  useEffect(() => {
    if (isAnimating) {
      setNewContent(children);
    }
  }, [isAnimating, children]);

  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg",
      className
    )}>
      {/* Current page content */}
      <div className={cn(
        "w-full",
        isAnimating && direction === "forward" ? "page-turn-forward" : "",
        isAnimating && direction === "backward" ? "page-turn-backward" : ""
      )}>
        {content}
      </div>

      {/* New page content (visible during animation) */}
      {isAnimating && newContent && (
        <div className={cn(
          "absolute top-0 left-0 w-full",
          direction === "forward" ? "page-turn-forward-new" : "page-turn-backward-new"
        )}>
          {newContent}
        </div>
      )}
    </div>
  );
}

