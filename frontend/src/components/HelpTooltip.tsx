import React, { useState } from "react";
import { HelpCircle } from "lucide-react";

interface HelpTooltipProps {
  text: string;
}

export function HelpTooltip({ text }: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="text-blue-500 hover:text-blue-700 focus:outline-none ml-1"
        onClick={() => setIsVisible(!isVisible)}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        aria-label="Help"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      {isVisible && (
        <div className="absolute z-10 w-64 p-3 mt-2 -ml-56 text-sm text-left text-white bg-blue-700 rounded-lg shadow-lg">
          <div className="relative">
            {/* Triangle pointer */}
            <div className="absolute -top-2 right-8 w-4 h-4 bg-blue-700 transform rotate-45"></div>
            <p>{text}</p>
          </div>
        </div>
      )}
    </div>
  );
}
