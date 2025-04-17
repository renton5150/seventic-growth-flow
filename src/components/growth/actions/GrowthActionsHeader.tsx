
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { GrowthFilterButtons } from "../filters/GrowthFilterButtons";
import { useNavigate } from "react-router-dom";

interface GrowthActionsHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  totalRequests: number;
}

export const GrowthActionsHeader = ({ activeTab, setActiveTab, totalRequests }: GrowthActionsHeaderProps) => {
  const navigate = useNavigate();

  const handleCreateRequest = () => {
    navigate("/requests/email/new");
  };

  return (
    <div className="flex justify-between items-center">
      <GrowthFilterButtons
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalRequests={totalRequests}
      />
      <Button onClick={handleCreateRequest}>
        <Plus className="mr-2 h-4 w-4" /> Nouvelle demande
      </Button>
    </div>
  );
};
