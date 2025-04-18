
import { 
  Building2, 
  Calendar, 
  FileText, 
  Database, 
  LayoutDashboard, 
  Users,
  BrainCircuit
} from "lucide-react";
import React from "react";

interface MenuItem {
  title: string;
  path: string;
  icon: React.ComponentType;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const sdrMenuItems: MenuItem[] = [
  {
    title: "Missions",
    path: "/missions",
    icon: Building2
  },
  {
    title: "Calendrier",
    path: "/calendar",
    icon: Calendar
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
  },
  {
    title: "Bases de données",
    path: "/databases",
    icon: Database
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
    title: "AI Insights",
    path: "/admin/ai-dashboard",
    icon: BrainCircuit
  }
];
