
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailCampaignDetails } from "./email-campaign/EmailCampaignDetails";
import { RequestDetailsCard } from "./RequestDetailsCard";
import { RequestTargeting } from "./RequestTargeting";
import { RequestTimeline } from "./RequestTimeline";
import { RequestResults } from "./RequestResults";
import { Request, Mission, WorkflowStatus } from "@/types/types";

interface RequestTabsProps {
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
  onEmailPlatformChange?: (platform: string) => void;
}

export const RequestTabs: React.FC<RequestTabsProps> = ({ 
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
  onEmailPlatformChange
}) => {
  return (
    <Tabs defaultValue="details" className="mt-6">
      <TabsList className="grid grid-cols-4 mb-8">
        <TabsTrigger value="details">Détails</TabsTrigger>
        <TabsTrigger value="targeting">Ciblage</TabsTrigger>
        <TabsTrigger value="timeline">Chronologie</TabsTrigger>
        <TabsTrigger value="results">Résultats</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4">
        {request.type === "email" ? (
          <EmailCampaignDetails request={request} />
        ) : (
          <RequestDetailsCard request={request} />
        )}
      </TabsContent>

      <TabsContent value="targeting">
        <RequestTargeting request={request} />
      </TabsContent>

      <TabsContent value="timeline">
        <RequestTimeline request={request} />
      </TabsContent>

      <TabsContent value="results">
        <RequestResults request={request} />
      </TabsContent>
    </Tabs>
  );
};
