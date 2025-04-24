
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkflowStatus } from "@/types/types";

interface RequestStatusControlsProps {
  isGrowthOrAdmin: boolean;
  workflowStatus: WorkflowStatus;
  onWorkflowStatusChange: (value: WorkflowStatus) => void;
  isEmailRequest: boolean;
  emailPlatform: string;
  onEmailPlatformChange: (value: string) => void;
}

export const RequestStatusControls = ({
  isGrowthOrAdmin,
  workflowStatus,
  onWorkflowStatusChange,
  isEmailRequest,
  emailPlatform,
  onEmailPlatformChange,
}: RequestStatusControlsProps) => {
  if (!isGrowthOrAdmin) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
      <div>
        <p className="text-sm font-medium mb-1">Statut de la demande</p>
        <Select
          value={workflowStatus}
          onValueChange={(value) => onWorkflowStatusChange(value as WorkflowStatus)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner un statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending_assignment">En attente</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="completed">Terminée</SelectItem>
            <SelectItem value="canceled">Annulée</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {isEmailRequest && (
        <div>
          <p className="text-sm font-medium mb-1">Plateforme d'emailing</p>
          <Select
            value={emailPlatform}
            onValueChange={onEmailPlatformChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionner une plateforme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Acelmail">Acelmail</SelectItem>
              <SelectItem value="Brevo">Brevo</SelectItem>
              <SelectItem value="Mindbaz">Mindbaz</SelectItem>
              <SelectItem value="Mailjet">Mailjet</SelectItem>
              <SelectItem value="Postyman">Postyman</SelectItem>
              <SelectItem value="Mailwizz">Mailwizz</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
