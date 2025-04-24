
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailCampaignDetails } from "./email-campaign/EmailCampaignDetails";
import { DatabaseDetails } from "./DatabaseDetails";
import { LinkedInDetails } from "./LinkedInDetails";
import { RequestComments } from "./RequestComments";
import { Request, EmailCampaignRequest, DatabaseRequest, LinkedInScrapingRequest } from "@/types/types";

interface RequestTabsProps {
  request: Request;
  comment: string;
  commentLoading: boolean;
  onCommentChange: (value: string) => void;
  onAddComment: () => void;
}

export const RequestTabs = ({
  request,
  comment,
  commentLoading,
  onCommentChange,
  onAddComment,
}: RequestTabsProps) => {
  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="details">Détails</TabsTrigger>
        <TabsTrigger value="comments">Commentaires</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details">
        {request.type === "email" && <EmailCampaignDetails request={request as EmailCampaignRequest} />}
        {request.type === "database" && <DatabaseDetails request={request as DatabaseRequest} />}
        {request.type === "linkedin" && <LinkedInDetails request={request as LinkedInScrapingRequest} />}
      </TabsContent>
      
      <TabsContent value="comments">
        <RequestComments
          comments={request.details?.comments || []}
          comment={comment}
          commentLoading={commentLoading}
          onCommentChange={onCommentChange}
          onAddComment={onAddComment}
        />
      </TabsContent>
    </Tabs>
  );
};
