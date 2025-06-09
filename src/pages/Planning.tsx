
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { InteractiveCalendar } from "@/components/calendar/InteractiveCalendar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

const Planning = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Planning des Missions</h2>
            <p className="text-muted-foreground">
              Gérez vos missions avec un calendrier interactif. Glissez-déposez pour réorganiser.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("/missions")}
              variant="outline"
            >
              Vue Liste
            </Button>
            <Button
              onClick={() => navigate("/missions")}
              className="bg-seventic-500 hover:bg-seventic-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Mission
            </Button>
          </div>
        </div>

        <InteractiveCalendar />
      </div>
    </AppLayout>
  );
};

export default Planning;
