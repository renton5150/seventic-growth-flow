
import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface RequestCommentsProps {
  comments: Array<{
    id: string;
    text: string;
    user: string;
    timestamp: string;
  }>;
  comment: string;
  commentLoading: boolean;
  onCommentChange: (value: string) => void;
  onAddComment: () => void;
}

export const RequestComments = ({
  comments,
  comment,
  commentLoading,
  onCommentChange,
  onAddComment
}: RequestCommentsProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun commentaire pour le moment
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="p-4 border rounded-md">
              <div className="flex justify-between mb-2">
                <div className="font-semibold">{comment.user}</div>
                <div className="text-sm text-gray-500">
                  {new Date(comment.timestamp).toLocaleString()}
                </div>
              </div>
              <p>{comment.text}</p>
            </div>
          ))
        )}
      </div>
      
      <div className="space-y-2">
        <Textarea
          placeholder="Ajouter un commentaire..."
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
        />
        <Button 
          onClick={onAddComment} 
          disabled={!comment.trim() || commentLoading}
          className="w-full"
        >
          {commentLoading ? "Envoi en cours..." : "Ajouter un commentaire"}
        </Button>
      </div>
    </div>
  );
};
