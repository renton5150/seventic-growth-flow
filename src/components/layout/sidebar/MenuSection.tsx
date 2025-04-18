
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MenuItem {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuSectionProps {
  title: string;
  items: MenuItem[];
}

export const MenuSection = ({ title, items }: MenuSectionProps) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="space-y-1">
      <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {title}
      </h3>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isActive(item.path)
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="mr-3 h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </div>
  );
};
