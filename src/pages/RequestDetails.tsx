
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useRequestDetails } from "@/hooks/useRequestDetails";
import { RequestDetailsLoading } from "@/components/request-details/RequestDetailsLoading";
import { RequestDetailsNotFound } from "@/components/request-details/RequestDetailsNotFound";
import { RequestDetailsContent } from "@/components/request-details/RequestDetailsContent";

const RequestDetails = () => {
  const navigate = useNavigate();
  const {
    request,
    mission,
    loading,
    comment,
    commentLoading,
    isEditDialogOpen,
    workflowStatus,
    emailPlatform,
    setComment,
    setIsEditDialogOpen,
    updateWorkflowStatus,
    updateEmailPlatform,
    addComment,
    fetchRequestDetails,
  } = useRequestDetails();

  if (loading) {
    return <RequestDetailsLoading />;
  }

  if (!request) {
    return <RequestDetailsNotFound />;
  }

  return (
    <AppLayout>
      <RequestDetailsContent
        request={request}
        mission={mission}
        comment={comment}
        commentLoading={commentLoading}
        isEditDialogOpen={isEditDialogOpen}
        workflowStatus={workflowStatus}
        emailPlatform={emailPlatform}
        onCommentChange={setComment}
        onEditDialogChange={setIsEditDialogOpen}
        onWorkflowStatusChange={updateWorkflowStatus}
        onEmailPlatformChange={updateEmailPlatform}
        onAddComment={addComment}
        onRequestUpdated={fetchRequestDetails}
        onBack={() => navigate(-1)}
      />
    </AppLayout>
  );
};

export default RequestDetails;
