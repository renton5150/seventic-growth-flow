
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  Users, 
  Database,
  FolderOpen,
  Mail,
  BarChart3,
  Settings,
  Target,
  Bot,
  Briefcase
} from "lucide-react";

export const sidebarConfig = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Demandes",
    icon: FileText,
    items: [
      {
        title: "Toutes les demandes",
        url: "/dashboard",
      },
      {
        title: "Campagne Email",
        url: "/requests/email-campaign",
      },
      {
        title: "Scraping LinkedIn",
        url: "/requests/linkedin-scraping",
      },
      {
        title: "Création de BDD",
        url: "/requests/database-creation",
      },
    ],
  },
  {
    title: "Missions",
    url: "/missions",
    icon: Target,
  },
  {
    title: "Planning",
    url: "/planning",
    icon: Calendar,
  },
  {
    title: "Base de données",
    url: "/databases",
    icon: Database,
  },
  {
    title: "Email Platforms", // Nouvelle section
    url: "/email-platforms",
    icon: Mail,
  },
  {
    title: "Archives",
    url: "/archives",
    icon: FolderOpen,
  },
  {
    title: "Growth",
    url: "/growth",
    icon: BarChart3,
    adminOnly: true,
  },
  {
    title: "Campagnes Acelle",
    url: "/acelle-campaigns",
    icon: Mail,
    adminOnly: true,
  },
  {
    title: "AI Dashboard",
    url: "/ai-dashboard",
    icon: Bot,
    adminOnly: true,
  },
  {
    title: "Admin",
    icon: Settings,
    adminOnly: true,
    items: [
      {
        title: "Utilisateurs",
        url: "/admin/users",
      },
      {
        title: "Missions Admin",
        url: "/admin/missions",
      },
    ],
  },
];
