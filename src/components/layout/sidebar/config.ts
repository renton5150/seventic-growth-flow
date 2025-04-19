
import { 
  Building2, 
  Calendar, 
  FileText, 
  LayoutDashboard, 
  Users,
  BrainCircuit,
  LogOut,
  CalendarDays
} from "lucide-react";
import React from "react";

interface MenuItem {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const sdrMenuItems: MenuItem[] = [
  {
    title: "Planning",
    path: "/planning",
    icon: CalendarDays
  },
  {
    title: "Missions",
    path: "/missions",
    icon: Building2
  }
];

export const growthMenuItems: MenuItem[] = [
  {
    title: "Toutes les demandes",
    path: "/growth",
    icon: FileText
  },
  {
    title: "À assigner",
    path: "/growth/to-assign",
    icon: FileText
  },
  {
    title: "Mes demandes",
    path: "/growth/my-requests",
    icon: FileText
  }
];

export const adminMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    path: "/admin/dashboard",
    icon: LayoutDashboard
  },
  {
    title: "Utilisateurs",
    path: "/admin/users",
    icon: Users
  },
  {
    title: "Missions",
    path: "/admin/missions",
    icon: Building2
  },
  {
    title: "Planning",
    path: "/planning",
    icon: CalendarDays
  },
  {
    title: "AI Insights",
    path: "/admin/ai-dashboard",
    icon: BrainCircuit
  }
];

export const planningMenuItem: MenuItem = {
  title: "Planning",
  path: "/planning",
  icon: CalendarDays
};
