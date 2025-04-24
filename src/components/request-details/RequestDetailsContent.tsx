
import { useAuth } from "@/contexts/AuthContext";
import { Request, Mission } from "@/types/types";
import { RequestCompleteEditDialog } from "./RequestCompleteEditDialog";
import { RequestHeader } from "./RequestHeader";
import { RequestStatusControls } from "./RequestStatusControls";
import { RequestTabs } from "./RequestTabs";
import { RequestInfo } from "./RequestInfo";

interface RequestDetailsContentProps {
  request: Request;
  mission: Mission | null;
  comment: string;
  commentLoading: boolean;
  isEditDialogOpen: boolean;
  workflowStatus: string;
  emailPlatform: string;
  onCommentChange: (value: string) => void;
  onEditDialogChange: (open: boolean) => void;
  onWorkflowStatusChange: (status: any) => void;
  onEmailPlatformChange: (platform: string) => void;
  onAddComment: () => void;
  onRequestUpdated: () => void;
  onBack: () => void;
}

export const RequestDetailsContent = ({
  request,
  mission,
  comment,
  commentLoading,
  isEditDialogOpen,
  workflowStatus,
  emailPlatform,
  onCommentChange,
  onEditDialogChange,
  onWorkflowStatusChange,
  onEmailPlatformChange,
  onAddComment,
  onRequestUpdated,
  onBack,
}: RequestDetailsContentProps) => {
  const { user } = useAuth();
  const isGrowthOrAdmin = user?.role === "admin" || user?.role === "growth";
  const canEdit = user?.role === "admin" || user?.id === request.createdBy || user?.role === "growth";

  return (
    <div className="space-y-6">
      <RequestHeader
        request={request}
        onBack={onBack}
        onEdit={() => onEditDialogChange(true)}
        canEdit={canEdit}
      />

      <RequestStatusControls
        isGrowthOrAdmin={isGrowthOrAdmin}
        workflowStatus={workflowStatus}
        onWorkflowStatusChange={onWorkflowStatusChange}
        isEmailRequest={request.type === "email"}
        emailPlatform={emailPlatform}
        onEmailPlatformChange={onEmailPlatformChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <RequestTabs
            request={request}
            comment={comment}
            commentLoading={commentLoading}
            onCommentChange={onCommentChange}
            onAddComment={onAddComment}
          />
        </div>

        <div>
          <RequestInfo request={request} mission={mission} />
        </div>
      </div>

      {request && (
        <RequestCompleteEditDialog
          open={isEditDialogOpen}
          onOpenChange={onEditDialogChange}
          request={request}
          onRequestUpdated={onRequestUpdated}
        />
      )}
    </div>
  );
};
