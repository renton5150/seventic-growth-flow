
import { Button } from "@/components/ui/button";
import { Request } from "@/types/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Check, CheckCircle, XCircle, ArrowRightLeft, FileCheck, Eye } from "lucide-react";

interface GrowthRequestActionsProps {
  request: Request;
  onEditRequest: (request: Request) => void;
  onCompleteRequest: (request: Request) => void;
  onViewDetails?: (request: Request) => void;
  assignRequestToMe?: (requestId: string) => Promise<boolean>;
  updateRequestWorkflowStatus?: (requestId: string, newStatus: string) => Promise<boolean>;
  activeTab?: string;
}

export function GrowthRequestActions({
  request,
  onEditRequest,
  onCompleteRequest,
  onViewDetails,
  assignRequestToMe,
  updateRequestWorkflowStatus,
  activeTab
}: GrowthRequestActionsProps) {
  return (
    <div className="flex justify-end space-x-2">
      {/* Bouton pour voir les détails */}
      {onViewDetails && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails(request)}
        >
          <Eye size={14} className="mr-1" /> Voir
        </Button>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onEditRequest(request)}
      >
        <Pencil size={14} className="mr-1" /> Éditer
      </Button>
      
      {activeTab === "to_assign" && request.workflow_status === "pending_assignment" && assignRequestToMe && (
        <Button 
          variant="default"
          size="sm"
          onClick={() => assignRequestToMe(request.id)}
          className="bg-blue-500 hover:bg-blue-600"
        >
          <Check className="mr-2 h-4 w-4" /> Prendre en charge
        </Button>
      )}
      
      {activeTab === "my_assignments" && updateRequestWorkflowStatus && (
        request.workflow_status === "in_progress" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                size="sm"
                className="bg-blue-50 border-blue-200"
              >
                <ArrowRightLeft className="mr-2 h-4 w-4 text-blue-500" /> Statut
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => updateRequestWorkflowStatus(request.id, "completed")}>
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Terminée
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateRequestWorkflowStatus(request.id, "canceled")}>
                <XCircle className="mr-2 h-4 w-4 text-gray-500" /> Annulée
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button 
            variant="ghost"
            size="sm"
            disabled
          >
            {request.workflow_status === "completed" && (
              <>
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Terminée
              </>
            )}
            {request.workflow_status === "canceled" && (
              <>
                <XCircle className="mr-2 h-4 w-4 text-gray-500" /> Annulée
              </>
            )}
          </Button>
        )
      )}
      
      {activeTab !== "to_assign" && activeTab !== "my_assignments" && (
        <>
          {request.status === "pending" && (
            <Button 
              variant="outline"
              size="sm"
              onClick={() => onCompleteRequest(request)}
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" /> Commencer
            </Button>
          )}
          {request.status === "inprogress" && (
            <Button 
              variant="outline"
              size="sm"
              onClick={() => onCompleteRequest(request)}
            >
              <FileCheck className="mr-2 h-4 w-4" /> Terminer
            </Button>
          )}
          {request.status === "completed" && (
            <Button 
              variant="ghost"
              size="sm"
              disabled
            >
              <CheckCircle className="mr-2 h-4 w-4 text-status-completed" /> Terminée
            </Button>
          )}
        </>
      )}
    </div>
  );
}
