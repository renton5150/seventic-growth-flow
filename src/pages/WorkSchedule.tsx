
import { AppLayout } from "@/components/layout/AppLayout";
import { TeleworkView } from "@/components/telework/TeleworkView";

const WorkSchedule = () => {
  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <TeleworkView />
      </div>
    </AppLayout>
  );
};

export default WorkSchedule;
