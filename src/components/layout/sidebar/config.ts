
import { 
  Building2, 
  Calendar, 
  FileText, 
  LayoutDashboard, 
  Users,
  BrainCircuit,
  LogOut,
  CalendarDays,
  Mail,
  Archive
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
  },
  {
    title: "Archives",
    path: "/archives",
    icon: Archive
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
    title: "Archives",
    path: "/archives",
    icon: Archive
  }
];

// Menu Administration réordonné et renommage de Growth
export const adminMenuItems: MenuItem[] = [
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
  // Growth renommé dans le menu admin
  {
    title: "Growth",
    path: "/growth",
    icon: FileText
  },
  {
    title: "Campagnes emailing",
    path: "/admin/email-campaigns",
    icon: Mail
  },
  {
    title: "AI Insights",
    path: "/admin/ai-dashboard",
    icon: BrainCircuit
  },
  {
    title: "Dashboard",
    path: "/admin/dashboard",
    icon: LayoutDashboard
  },
  {
    title: "Archives",
    path: "/archives",
    icon: Archive
  }
];

export const planningMenuItem: MenuItem = {
  title: "Planning",
  path: "/planning",
  icon: CalendarDays
};
