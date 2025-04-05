
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  Database as DatabaseIcon, 
  User 
} from "lucide-react";

interface GrowthFilterTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function GrowthFilterTabs({ activeTab, setActiveTab }: GrowthFilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 border-b pb-2">
      <Button
        variant={activeTab === "all" ? "default" : "outline"}
        size="sm"
        onClick={() => setActiveTab("all")}
      >
        Toutes
      </Button>
      <Button
        variant={activeTab === "pending" ? "default" : "outline"}
        size="sm"
        onClick={() => setActiveTab("pending")}
      >
        En attente
      </Button>
      <Button
        variant={activeTab === "inprogress" ? "default" : "outline"}
        size="sm"
        onClick={() => setActiveTab("inprogress")}
      >
        En cours
      </Button>
      <Button
        variant={activeTab === "completed" ? "default" : "outline"}
        size="sm"
        onClick={() => setActiveTab("completed")}
      >
        Terminées
      </Button>
      <Button
        variant={activeTab === "email" ? "default" : "outline"}
        size="sm"
        onClick={() => setActiveTab("email")}
      >
        <Mail className="mr-1 h-4 w-4" /> Email
      </Button>
      <Button
        variant={activeTab === "database" ? "default" : "outline"}
        size="sm"
        onClick={() => setActiveTab("database")}
      >
        <DatabaseIcon className="mr-1 h-4 w-4" /> Base de données
      </Button>
      <Button
        variant={activeTab === "linkedin" ? "default" : "outline"}
        size="sm"
        onClick={() => setActiveTab("linkedin")}
      >
        <User className="mr-1 h-4 w-4" /> LinkedIn
      </Button>
    </div>
  );
}
