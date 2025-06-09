
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { WorkScheduleView } from "@/components/workSchedule/WorkScheduleView";

const WorkSchedule = () => {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <WorkScheduleView />
      </div>
    </AppLayout>
  );
};

export default WorkSchedule;
