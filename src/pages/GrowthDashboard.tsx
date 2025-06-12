
import { UltraSimpleDashboard } from "@/components/growth/UltraSimpleDashboard";

interface GrowthDashboardProps {
  defaultTab?: string;
}

const GrowthDashboard = ({ defaultTab }: GrowthDashboardProps) => {
  console.log("[GrowthDashboard] 🚀 NOUVEAU SYSTÈME ULTRA-SIMPLE DÉPLOYÉ");
  console.log(`[GrowthDashboard] Default tab: ${defaultTab}`);
  
  return <UltraSimpleDashboard />;
};

export default GrowthDashboard;
