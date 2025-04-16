
import { Request } from "@/types/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmailCompletionForm } from "./EmailCompletionForm";
import { DatabaseCompletionForm } from "./DatabaseCompletionForm";
import { LinkedInCompletionForm } from "./LinkedInCompletionForm";

interface RequestCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRequest: Request | null;
  onRequestUpdated: () => void;
}

export function RequestCompletionDialog({
  open,
  onOpenChange,
  selectedRequest,
  onRequestUpdated,
}: RequestCompletionDialogProps) {
  const handleComplete = () => {
    onOpenChange(false);
    onRequestUpdated();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!selectedRequest) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compléter la demande</DialogTitle>
          <DialogDescription>
            Entrez les détails de complétion pour cette demande.
          </DialogDescription>
        </DialogHeader>

        {selectedRequest.type === "email" && (
          <EmailCompletionForm
            selectedRequest={selectedRequest}
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        )}

        {selectedRequest.type === "database" && (
          <DatabaseCompletionForm
            selectedRequest={selectedRequest}
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        )}

        {selectedRequest.type === "linkedin" && (
          <LinkedInCompletionForm
            selectedRequest={selectedRequest}
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
