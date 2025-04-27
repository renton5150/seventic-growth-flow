
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Request, Comment } from "@/types/types";

interface RequestTimelineProps {
  request: Request;
}

export const RequestTimeline: React.FC<RequestTimelineProps> = ({ request }) => {
  const comments = request.comments || [];
  
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chronologie</CardTitle>
      </CardHeader>
      <CardContent>
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Aucun commentaire pour le moment</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment, index) => (
              <div key={index} className="border-b pb-4 last:border-0">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium">{comment.userName || 'Utilisateur'}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comment.date)}
                  </span>
                </div>
                <p className="text-sm">{comment.text}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
