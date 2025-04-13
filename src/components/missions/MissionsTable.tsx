
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Mission } from "@/types/types";
import { useAuth } from "@/contexts/auth";
import { SortOptions } from "@/hooks/useMissionsList";
import { Edit, Eye, ArrowUpDown } from "lucide-react";

interface MissionsTableProps {
  missions: Mission[];
  isLoading: boolean;
  sort: SortOptions;
  onSort: (field: SortOptions["field"]) => void;
}

export const MissionsTable = ({ missions, isLoading, sort, onSort }: MissionsTableProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isAdmin = user?.role === "admin";
  
  const handleRowClick = (missionId: string) => {
    // Chemin adapté selon le rôle
    const basePath = isAdmin ? "/admin" : "";
    navigate(`${basePath}/missions/${missionId}`);
  };

  const renderSortableHeader = (label: string, field: SortOptions["field"]) => {
    const isActive = sort.field === field;
    
    return (
      <th className="px-4 py-2">
        <button
          onClick={() => onSort(field)}
          className={cn(
            "flex items-center space-x-1 hover:text-blue-600 transition-colors",
            isActive && "font-medium"
          )}
        >
          <span>{label}</span>
          <ArrowUpDown size={14} className={isActive ? "opacity-100" : "opacity-30"} />
        </button>
      </th>
    );
  };

  // Fonction pour formater les dates
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "—";
    return format(new Date(date), "dd/MM/yyyy", { locale: fr });
  };

  // Pendant le chargement, afficher un squelette
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                {renderSortableHeader("Nom", "name")}
                {renderSortableHeader("SDR", "sdrName")}
                {renderSortableHeader("Début", "startDate")}
                {renderSortableHeader("Fin", "endDate")}
                {renderSortableHeader("Type", "type")}
                {renderSortableHeader("Statut", "status")}
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="border-b">
                  {Array.from({ length: 7 }).map((_, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3">
                      <div className="h-5 bg-gray-200 animate-pulse rounded"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Si aucune mission n'est trouvée
  if (missions.length === 0) {
    return (
      <div className="bg-white text-center p-8 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium">Aucune mission trouvée</h3>
        <p className="text-gray-500 mt-2">
          Aucune mission ne correspond à vos critères de recherche.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              {renderSortableHeader("Nom", "name")}
              {renderSortableHeader("SDR", "sdrName")}
              {renderSortableHeader("Début", "startDate")}
              {renderSortableHeader("Fin", "endDate")}
              {renderSortableHeader("Type", "type")}
              {renderSortableHeader("Statut", "status")}
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {missions.map((mission) => (
              <tr
                key={mission.id}
                className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleRowClick(mission.id)}
              >
                <td className="px-4 py-3 font-medium">{mission.name}</td>
                <td className="px-4 py-3">{mission.sdrName || "—"}</td>
                <td className="px-4 py-3">{formatDate(mission.startDate)}</td>
                <td className="px-4 py-3">{formatDate(mission.endDate)}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{mission.type}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    className={cn(
                      "font-normal",
                      mission.status === "En cours" && "bg-blue-100 text-blue-800 hover:bg-blue-200",
                      mission.status === "Terminé" && "bg-green-100 text-green-800 hover:bg-green-200"
                    )}
                  >
                    {mission.status}
                  </Badge>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(mission.id);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Voir</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      asChild
                    >
                      <Link to={`/admin/missions/${mission.id}/edit`}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Modifier</span>
                      </Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
