
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Mail, Database, Linkedin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const CreateRequestMenu = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  console.log(`[CreateRequestMenu] 🎯 User role: ${user?.role}`);

  const handleCreateRequest = (type: string) => {
    console.log(`[CreateRequestMenu] 📝 Création demande type: ${type} pour role: ${user?.role}`);
    
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
        console.warn(`[CreateRequestMenu] Type de demande non reconnu: ${type}`);
    }
  };

  // CORRECTION: Autoriser TOUS les types de demandes pour SDR, Growth ET Admin
  const canCreateRequests = ['sdr', 'growth', 'admin'].includes(user?.role || '');
  
  if (!canCreateRequests) {
    console.log(`[CreateRequestMenu] ❌ Pas de permissions pour créer des demandes (rôle: ${user?.role})`);
    return null;
  }

  console.log(`[CreateRequestMenu] ✅ Permissions OK - Affichage menu complet pour: ${user?.role}`);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-seventic-500 hover:bg-seventic-600">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle demande
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleCreateRequest("email")}>
          <Mail className="h-4 w-4 mr-2 text-blue-500" />
          Campagne Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCreateRequest("database")}>
          <Database className="h-4 w-4 mr-2 text-green-500" />
          Base de données
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCreateRequest("linkedin")}>
          <Linkedin className="h-4 w-4 mr-2 text-blue-600" />
          Scraping LinkedIn
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
