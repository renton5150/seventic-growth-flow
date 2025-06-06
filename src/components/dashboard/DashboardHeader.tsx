
import { CreateRequestMenu } from "./CreateRequestMenu";

interface DashboardHeaderProps {
  title?: string;
}

export const DashboardHeader = ({ title = "Tableau de bord" }: DashboardHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <CreateRequestMenu />
    </div>
  );
};
