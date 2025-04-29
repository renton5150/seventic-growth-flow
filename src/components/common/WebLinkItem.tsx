
import React from 'react';
import { ExternalLink } from 'lucide-react';

interface WebLinkItemProps {
  url: string;
  className?: string;
}

export const WebLinkItem = ({ url, className = "" }: WebLinkItemProps) => {
  if (!url) return null;
  
  return (
    <a 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 text-blue-500 hover:text-blue-600 ${className}`}
    >
      <ExternalLink className="h-4 w-4" />
      {url}
    </a>
  );
};
