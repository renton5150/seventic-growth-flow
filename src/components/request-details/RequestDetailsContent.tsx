
import { Fragment } from "react";
import { Request } from "@/types/types";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { RequestTabs } from "./RequestTabs";

interface RequestDetailsContentProps {
  request: Request;
  comment: string;
  commentLoading: boolean;
  onCommentChange: (value: string) => void;
  onAddComment: () => void;
}

export const RequestDetailsContent = ({
  request,
  comment,
  commentLoading,
  onCommentChange,
  onAddComment
}: RequestDetailsContentProps) => {
  const hasComments = request.comments && request.comments.length > 0;

  return (
    <Fragment>
      <RequestTabs request={request} />

      <Separator className="my-6" />
      
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Commentaires</h3>
        
        {hasComments && (
          <div className="space-y-4 mb-6">
            {request.comments?.map((item, index) => (
              <div key={index} className="p-4 rounded-md border bg-muted/30">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium">{item.userName || "Utilisateur"}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-line">{item.text}</p>
              </div>
            ))}
          </div>
        )}
        
        <div className="space-y-4">
          <Textarea
            placeholder="Ajouter un commentaire..."
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            className="min-h-32"
          />
          <Button 
            onClick={onAddComment}
            disabled={!comment.trim() || commentLoading}
          >
            {commentLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              "Ajouter un commentaire"
            )}
          </Button>
        </div>
      </div>
    </Fragment>
  );
};
