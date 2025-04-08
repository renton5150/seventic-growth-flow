
import React from "react";

interface DebugInfoProps {
  debugInfo: string;
}

export const DebugInfo: React.FC<DebugInfoProps> = ({ debugInfo }) => {
  if (!import.meta.env.DEV || !debugInfo) return null;
  
  // Extract and format hash and search params for better debugging
  const urlInfo = () => {
    try {
      const hashParams = window.location.hash 
        ? Object.fromEntries(new URLSearchParams(window.location.hash.substring(1))) 
        : {};
      
      const searchParams = window.location.search 
        ? Object.fromEntries(new URLSearchParams(window.location.search))
        : {};
      
      // Remove sensitive data from the debug output
      if (hashParams.access_token) hashParams.access_token = "[PRESENT]";
      if (hashParams.refresh_token) hashParams.refresh_token = "[PRESENT]";
      
      // Return formatted debug info
      return `Hash params: ${JSON.stringify(hashParams)}, Search params: ${JSON.stringify(searchParams)}`;
    } catch (e) {
      return `Error parsing URL params: ${e}`;
    }
  };
  
  return (
    <div className="mt-4 p-2 bg-gray-100 text-xs text-gray-600 rounded">
      <p className="font-mono break-all">Debug: {debugInfo || urlInfo()}</p>
    </div>
  );
};
