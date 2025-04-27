
import React from "react";
import { RequestTabs } from "./RequestTabs";
import { Request, Mission, WorkflowStatus } from "@/types/types";

interface RequestDetailsContentProps {
  request: Request;
  mission?: Mission;
  comment?: string;
  commentLoading?: boolean;
  onCommentChange?: (value: string) => void;
  onAddComment?: () => void;
  isEditDialogOpen?: boolean;
  workflowStatus?: string;
  emailPlatform?: string;
  onStatusChange?: (status: string) => void;
  onWorkflowStatusChange?: (status: string) => void;
  onOpenEditDialog?: () => void;
  onCloseEditDialog?: () => void;
  onEditDialogChange?: (isOpen: boolean) => void;
  onBack?: () => void;
  onEmailPlatformChange?: (platform: string) => void;
}

export const RequestDetailsContent: React.FC<RequestDetailsContentProps> = ({ 
  request,
  mission,
  comment,
  commentLoading,
  onCommentChange,
  onAddComment,
  isEditDialogOpen,
  workflowStatus,
  emailPlatform,
  onStatusChange,
  onWorkflowStatusChange,
  onOpenEditDialog,
  onCloseEditDialog,
  onEditDialogChange,
  onBack,
  onEmailPlatformChange
}) => {
  return <RequestTabs 
    request={request}
    comment={comment}
    commentLoading={commentLoading}
    onCommentChange={onCommentChange}
    onAddComment={onAddComment}
    mission={mission}
    isEditDialogOpen={isEditDialogOpen}
    workflowStatus={workflowStatus}
    emailPlatform={emailPlatform}
    onStatusChange={onStatusChange}
    onWorkflowStatusChange={onWorkflowStatusChange}
    onOpenEditDialog={onOpenEditDialog}
    onCloseEditDialog={onCloseEditDialog}
    onEditDialogChange={onEditDialogChange}
    onEmailPlatformChange={onEmailPlatformChange}
  />;
};
