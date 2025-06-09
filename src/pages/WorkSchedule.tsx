
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { WorkScheduleTransition } from "@/components/workSchedule/WorkScheduleTransition";

const WorkSchedule = () => {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <WorkScheduleTransition />
      </div>
    </AppLayout>
  );
};

export default WorkSchedule;
