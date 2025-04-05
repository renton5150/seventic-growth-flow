
import { Mail, Database as DatabaseIcon, User } from "lucide-react";

interface RequestTypeIconProps {
  type: string;
}

export const RequestTypeIcon = ({ type }: RequestTypeIconProps) => {
  switch (type) {
    case "email":
      return <Mail size={16} className="text-seventic-500" />;
    case "database":
      return <DatabaseIcon size={16} className="text-seventic-500" />;
    case "linkedin":
      return <User size={16} className="text-seventic-500" />;
    default:
      return null;
  }
};
