
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  Database as DatabaseIcon, 
  User, 
  CheckCircle,
  AlertCircle,
  Clock,
  ClipboardCheck,
  UserCheck
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
        variant={activeTab === "to_assign" ? "default" : "outline"}
        size="sm"
        onClick={() => setActiveTab("to_assign")}
        className={activeTab === "to_assign" ? "bg-orange-500 hover:bg-orange-600" : ""}
      >
        <ClipboardCheck className="mr-1 h-4 w-4" /> À affecter
      </Button>
      <Button
        variant={activeTab === "my_assignments" ? "default" : "outline"}
        size="sm"
        onClick={() => setActiveTab("my_assignments")}
        className={activeTab === "my_assignments" ? "bg-blue-500 hover:bg-blue-600" : ""}
      >
        <UserCheck className="mr-1 h-4 w-4" /> Mes assignations
      </Button>
      <Button
        variant={activeTab === "inprogress" ? "default" : "outline"}
        size="sm"
        onClick={() => setActiveTab("inprogress")}
      >
        <Clock className="mr-1 h-4 w-4" /> En cours
      </Button>
      <Button
        variant={activeTab === "completed" ? "default" : "outline"}
        size="sm"
        onClick={() => setActiveTab("completed")}
      >
        <CheckCircle className="mr-1 h-4 w-4" /> Terminées
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
