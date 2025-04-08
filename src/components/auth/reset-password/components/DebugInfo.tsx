
import React from "react";

interface DebugInfoProps {
  debugInfo: string;
}

export const DebugInfo: React.FC<DebugInfoProps> = ({ debugInfo }) => {
  if (!import.meta.env.DEV || !debugInfo) return null;
  
  return (
    <div className="mt-4 p-2 bg-gray-100 text-xs text-gray-600 rounded">
      <p className="font-mono break-all">Debug: {debugInfo}</p>
    </div>
  );
};
