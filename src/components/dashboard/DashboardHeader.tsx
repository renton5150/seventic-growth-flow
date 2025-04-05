
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Mail, Database, User } from "lucide-react";

interface DashboardHeaderProps {
  isSDR: boolean;
}

export const DashboardHeader = ({ isSDR }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  const handleCreateRequest = (type: string) => {
    switch (type) {
      case "email":
        navigate("/requests/email/new");
        break;
      case "database":
        navigate("/requests/database/new");
        break;
      case "linkedin":
        navigate("/requests/linkedin/new");
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">Tableau de bord</h1>
      {isSDR && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-seventic-500 hover:bg-seventic-600">
              <Plus className="mr-2 h-4 w-4" /> Nouvelle demande
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleCreateRequest("email")}>
              <Mail className="mr-2 h-4 w-4" /> Campagne Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCreateRequest("database")}>
              <Database className="mr-2 h-4 w-4" /> Base de données
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCreateRequest("linkedin")}>
              <User className="mr-2 h-4 w-4" /> Scraping LinkedIn
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
