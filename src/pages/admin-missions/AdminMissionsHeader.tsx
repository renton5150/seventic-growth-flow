
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import React from "react";

interface AdminMissionsHeaderProps {
  onCreateMission: () => void;
}

export const AdminMissionsHeader: React.FC<AdminMissionsHeaderProps> = ({
  onCreateMission,
}) => (
  <div className="flex justify-between items-center">
    <h1 className="text-2xl font-bold">Gestion des missions</h1>
    <Button onClick={onCreateMission} className="bg-blue-600 hover:bg-blue-700">
      <Plus className="mr-2 h-4 w-4" /> Nouvelle mission
    </Button>
  </div>
);

