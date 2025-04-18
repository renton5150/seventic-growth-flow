
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  onClick?: () => void;
  isActive?: boolean;
}

export const StatCard = ({ title, value, icon, onClick, isActive }: StatCardProps) => {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md
        ${isActive ? 'ring-2 ring-primary border-primary bg-accent/50' : 'hover:bg-accent/10'}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          </div>
          <div className="p-2 bg-accent rounded-lg">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
