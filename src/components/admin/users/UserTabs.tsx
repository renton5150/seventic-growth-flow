
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const UserTabs = ({ activeTab, onTabChange }: UserTabsProps) => {
  return (
    <TabsList className="bg-blue-50">
      <TabsTrigger 
        value="all" 
        className="border-blue-300 data-[state=active]:border-blue-500 data-[state=active]:bg-blue-100"
      >
        Tous les utilisateurs
      </TabsTrigger>
      <TabsTrigger 
        value="sdr" 
        className="border-blue-300 data-[state=active]:border-blue-500 data-[state=active]:bg-blue-100"
      >
        SDR
      </TabsTrigger>
      <TabsTrigger 
        value="growth" 
        className="border-blue-300 data-[state=active]:border-blue-500 data-[state=active]:bg-blue-100"
      >
        Growth
      </TabsTrigger>
      <TabsTrigger 
        value="admin" 
        className="border-blue-300 data-[state=active]:border-blue-500 data-[state=active]:bg-blue-100"
      >
        Administrateurs
      </TabsTrigger>
    </TabsList>
  );
};
