
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyMissionStateProps {
  isSdr: boolean;
  onCreateMission: () => void;
}

export const EmptyMissionState = ({ isSdr, onCreateMission }: EmptyMissionStateProps) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-6">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Aucune mission trouvée</h3>
        {isSdr ? (
          <p className="text-muted-foreground text-center mt-2">
            Vous n'avez pas encore de mission. Créez votre première mission pour commencer.
          </p>
        ) : (
          <p className="text-muted-foreground text-center mt-2">
            Aucune mission n'est assignée à votre compte.
          </p>
        )}
        {isSdr && (
          <Button onClick={onCreateMission} className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Créer une mission
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
