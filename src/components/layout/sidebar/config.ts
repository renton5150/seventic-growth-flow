
import { BarChart3, Users, Settings, FileText, Calendar, Briefcase, Archive, Database, Mail, Zap, Brain, ClipboardList, UserCog, Bug, TestTube } from "lucide-react";
import { UserRole } from "@/types/types";

export interface MenuItem {
  title: string;
  url: string;
  icon?: any;
  roles?: UserRole[];
  section?: string;
}

export const menuItems: MenuItem[] = [
  // Section principale
  { title: "Tableau de bord", url: "/dashboard", icon: BarChart3, section: "PRINCIPAL" },
  { title: "CRA", url: "/cra", icon: ClipboardList, section: "PRINCIPAL" },
  { title: "Planning", url: "/planning", icon: Calendar, section: "PRINCIPAL" },
  { title: "Télétravail", url: "/work-schedule", icon: Settings, section: "PRINCIPAL" },

  // Section gestion
  { title: "Missions", url: "/missions", icon: Briefcase, section: "GESTION" },
  { title: "Base de données", url: "/databases", icon: Database, section: "GESTION" },
  { title: "Archives", url: "/archives", icon: Archive, section: "GESTION" },
  { title: "Plateformes Email", url: "/email-platforms", icon: Mail, section: "GESTION" },

  // Section administration
  { title: "Utilisateurs", url: "/admin/users", icon: Users, roles: ["admin"], section: "ADMINISTRATION" },
  { title: "Statistiques", url: "/admin/dashboard", icon: BarChart3, roles: ["admin"], section: "ADMINISTRATION" },
  { title: "Dashboard Simple", url: "/admin-dashboard-simple", icon: UserCog, roles: ["admin"], section: "ADMINISTRATION" },
  { title: "Dashboard Nouveau", url: "/admin-dashboard-new", icon: BarChart3, roles: ["admin"], section: "ADMINISTRATION" },
  { title: "TEST DONNÉES ADMIN", url: "/admin-data-test", icon: Bug, roles: ["admin"], section: "ADMINISTRATION" },
  { title: "TEST SUPABASE DIRECT", url: "/supabase-direct-test", icon: TestTube, roles: ["admin"], section: "ADMINISTRATION" },
  { title: "Missions Admin", url: "/admin/missions", icon: Settings, roles: ["admin"], section: "ADMINISTRATION" },
  { title: "Campagnes Acelle", url: "/acelle-campaigns", icon: Zap, roles: ["admin"], section: "ADMINISTRATION" },

  // Section outils
  { title: "IA Dashboard", url: "/ai-dashboard", icon: Brain, section: "OUTILS" },
];
