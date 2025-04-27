
import React from "react";
import { RequestTabs } from "./RequestTabs";
import { Request } from "@/types/types";

interface RequestDetailsContentProps {
  request: Request;
  comment?: string;
  commentLoading?: boolean;
  onCommentChange?: (value: string) => void;
  onAddComment?: () => void;
}

export const RequestDetailsContent: React.FC<RequestDetailsContentProps> = ({ 
  request 
}) => {
  return <RequestTabs request={request} />;
};
