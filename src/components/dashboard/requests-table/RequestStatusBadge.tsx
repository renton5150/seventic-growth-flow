
import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, X, UserCheck, Loader2, RotateCw } from "lucide-react";
import { RequestStatus, WorkflowStatus } from "@/types/types";

interface RequestStatusBadgeProps {
  status: RequestStatus | WorkflowStatus;
  isLate?: boolean; // Add isLate property
}

export const RequestStatusBadge = ({ status, isLate = false }: RequestStatusBadgeProps) => {
  switch (status) {
    case "pending":
      return (
        <Badge 
          variant="outline" 
          className={`flex items-center gap-1 ${isLate ? 'bg-red-50 text-red-600 border-red-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'}`}
        >
          <Clock size={14} /> En attente
          {isLate && <span className="ml-1 text-xs">• En retard</span>}
        </Badge>
      );
      
    case "in_progress":
      return (
        <Badge 
          variant="outline" 
          className={`flex items-center gap-1 ${isLate ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}
        >
          <Loader2 size={14} className="animate-spin" /> En cours
          {isLate && <span className="ml-1 text-xs">• En retard</span>}
        </Badge>
      );
      
    case "completed":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 flex items-center gap-1">
          <CheckCircle size={14} /> Terminé
        </Badge>
      );
      
    case "canceled":
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200 flex items-center gap-1">
          <X size={14} /> Annulé
        </Badge>
      );
      
    case "pending_assignment":
      return (
        <Badge 
          variant="outline" 
          className={`flex items-center gap-1 ${isLate ? 'bg-red-50 text-red-600 border-red-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'}`}
        >
          <Clock size={14} /> Non assigné
          {isLate && <span className="ml-1 text-xs">• En retard</span>}
        </Badge>
      );
      
    case "assigned":
      return (
        <Badge 
          variant="outline" 
          className={`flex items-center gap-1 ${isLate ? 'bg-red-50 text-red-600 border-red-200' : 'bg-purple-50 text-purple-600 border-purple-200'}`}
        >
          <UserCheck size={14} /> Assigné
          {isLate && <span className="ml-1 text-xs">• En retard</span>}
        </Badge>
      );
      
    case "review":
      return (
        <Badge 
          variant="outline" 
          className={`flex items-center gap-1 ${isLate ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}
        >
          <RotateCw size={14} /> En révision
          {isLate && <span className="ml-1 text-xs">• En retard</span>}
        </Badge>
      );
      
    default:
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200 flex items-center gap-1">
          <AlertCircle size={14} /> {status}
        </Badge>
      );
  }
};
