
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ExternalLink, Loader2, Mail, Trash2, UserCog } from "lucide-react";

interface UserActionsMenuItemsProps {
  isDeleting: boolean;
  isSendingInvite: boolean;
  onChangeRole: () => void;
  onResendInvite: () => void;
  onDelete: () => void;
}

export const UserActionsMenuItems = ({
  isDeleting,
  isSendingInvite,
  onChangeRole,
  onResendInvite,
  onDelete
}: UserActionsMenuItemsProps) => {
  return (
    <>
      <DropdownMenuItem onClick={onChangeRole} disabled={isDeleting || isSendingInvite}>
        <UserCog className="mr-2 h-4 w-4" />
        <span>Changer de rôle</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onResendInvite} disabled={isDeleting || isSendingInvite}>
        {isSendingInvite ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Mail className="mr-2 h-4 w-4" />
        )}
        <span>{isSendingInvite ? "Envoi en cours..." : "Renvoyer l'invitation"}</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <ExternalLinks />
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onDelete} className="text-red-600" disabled={isDeleting || isSendingInvite}>
        {isDeleting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="mr-2 h-4 w-4" />
        )}
        <span>Supprimer</span>
      </DropdownMenuItem>
    </>
  );
};

export const ExternalLinks = () => {
  return (
    <>
      <DropdownMenuItem 
        onClick={() => window.open("https://supabase.com/dashboard/project/dupguifqyjchlmzbadav/auth/smtp", "_blank")}
        className="text-blue-600"
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        <span>Config SMTP</span>
      </DropdownMenuItem>
      <DropdownMenuItem 
        onClick={() => window.open("https://supabase.com/dashboard/project/dupguifqyjchlmzbadav/functions/resend-invitation/logs", "_blank")}
        className="text-blue-600"
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        <span>Logs d'invitation</span>
      </DropdownMenuItem>
    </>
  );
};
