
import {
  Home,
  Calendar,
  Users,
  Database,
  Mail,
  BarChart3,
  FolderOpen,
  Shield,
  Settings,
  Brain,
  FileText,
  ClipboardCheck
} from "lucide-react";

export interface MenuItem {
  label: string;
  href: string;
  icon: any;
  roles?: string[];
  description?: string;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const menuConfig: MenuSection[] = [
  {
    title: "Principal",
    items: [
      {
        label: "Tableau de bord",
        href: "/",
        icon: Home,
        description: "Vue d'ensemble de vos demandes et missions"
      },
      {
        label: "CRA",
        href: "/cra",
        icon: ClipboardCheck,
        roles: ["sdr", "admin"],
        description: "Compte rendu d'activité quotidien"
      },
      {
        label: "Planning",
        href: "/planning",
        icon: Calendar,
        description: "Calendrier des missions et événements"
      }
    ]
  },
  {
    title: "Gestion",
    items: [
      {
        label: "Missions",
        href: "/missions",
        icon: FolderOpen,
        description: "Gérer les missions et projets"
      },
      {
        label: "Base de données",
        href: "/databases",
        icon: Database,
        description: "Fichiers et bases de données"
      },
      {
        label: "Archives",
        href: "/archives",
        icon: FileText,
        description: "Demandes terminées et archivées"
      }
    ]
  },
  {
    title: "Administration",
    items: [
      {
        label: "Utilisateurs",
        href: "/admin/users",
        icon: Users,
        roles: ["admin"],
        description: "Gestion des utilisateurs et permissions"
      },
      {
        label: "Statistiques",
        href: "/admin/dashboard",
        icon: BarChart3,
        roles: ["admin"],
        description: "Tableaux de bord et analyses"
      },
      {
        label: "Missions Admin",
        href: "/admin/missions",
        icon: Settings,
        roles: ["admin"],
        description: "Administration des missions"
      },
      {
        label: "Plateformes Email",
        href: "/email-platforms",
        icon: Mail,
        roles: ["admin"],
        description: "Configuration des plateformes email"
      },
      {
        label: "Campagnes Acelle",
        href: "/acelle-campaigns",
        icon: Mail,
        roles: ["admin"],
        description: "Gestion des campagnes Acelle"
      }
    ]
  },
  {
    title: "Outils",
    items: [
      {
        label: "IA Dashboard",
        href: "/ai-dashboard",
        icon: Brain,
        description: "Assistant IA et analyses avancées"
      }
    ]
  }
];
