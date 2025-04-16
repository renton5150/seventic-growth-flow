
import { Mail, Database as DatabaseIcon, Linkedin } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GrowthRequestTypeIconProps {
  type: string;
}

export function GrowthRequestTypeIcon({ type }: GrowthRequestTypeIconProps) {
  let icon;
  let label;
  let colorClass;
  
  switch (type) {
    case "email":
      icon = <Mail size={16} />;
      label = "Campagne Email";
      colorClass = "text-blue-500";
      break;
    case "database":
      icon = <DatabaseIcon size={16} />;
      label = "Base de données";
      colorClass = "text-green-500";
      break;
    case "linkedin":
      icon = <Linkedin size={16} />;
      label = "Scraping LinkedIn";
      colorClass = "text-purple-500";
      break;
    default:
      return null;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`${colorClass}`}>{icon}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
