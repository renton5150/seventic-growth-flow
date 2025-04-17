
import { Button } from "@/components/ui/button";

interface GrowthFilterButtonsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  totalRequests: number;
}

export const GrowthFilterButtons = ({ activeTab, setActiveTab, totalRequests }: GrowthFilterButtonsProps) => {
  return (
    <div className="flex space-x-2">
      <Button 
        variant={activeTab === "all" ? "default" : "outline"} 
        onClick={() => setActiveTab("all")}
        className="text-sm"
      >
        Toutes <span className="ml-1 bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full text-xs">{totalRequests}</span>
      </Button>
      <Button 
        variant={activeTab === "pending" ? "default" : "outline"} 
        onClick={() => setActiveTab("pending")}
        className="text-sm"
      >
        En attente
      </Button>
      <Button 
        variant={activeTab === "late" ? "default" : "outline"} 
        onClick={() => setActiveTab("late")}
        className="text-sm"
      >
        En retard
      </Button>
    </div>
  );
};
