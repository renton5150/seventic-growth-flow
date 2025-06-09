
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { WorkScheduleRequest, WorkScheduleRequestType, WorkScheduleStatus } from "@/types/workSchedule";
import { format } from "date-fns";
import { workScheduleService } from "@/services/workScheduleService";
import { toast } from "sonner";

interface WorkScheduleRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: WorkScheduleRequest;
  defaultDate?: Date;
  onSubmit: (request: Omit<WorkScheduleRequest, 'id' | 'created_at' | 'updated_at'>) => void;
  isAdmin: boolean;
  userId: string;
  existingRequests: WorkScheduleRequest[];
}

const requestTypeLabels = {
  telework: 'Télétravail',
  paid_leave: 'Congé payé',
  unpaid_leave: 'Congé sans solde'
};

export const WorkScheduleRequestDialog: React.FC<WorkScheduleRequestDialogProps> = ({
  open,
  onOpenChange,
  request,
  defaultDate,
  onSubmit,
  isAdmin,
  userId,
  existingRequests
}) => {
  const [formData, setFormData] = useState({
    request_type: 'telework' as WorkScheduleRequestType,
    start_date: '',
    end_date: '',
    reason: '',
    is_exceptional: false,
    admin_comment: '',
    status: 'pending' as WorkScheduleStatus
  });

  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (request) {
      setFormData({
        request_type: request.request_type,
        start_date: format(new Date(request.start_date), 'yyyy-MM-dd'),
        end_date: format(new Date(request.end_date), 'yyyy-MM-dd'),
        reason: request.reason || '',
        is_exceptional: request.is_exceptional,
        admin_comment: request.admin_comment || '',
        status: request.status
      });
    } else if (defaultDate) {
      const dateStr = format(defaultDate, 'yyyy-MM-dd');
      setFormData(prev => ({
        ...prev,
        start_date: dateStr,
        end_date: dateStr
      }));
    }
  }, [request, defaultDate]);

  const validateForm = () => {
    const newErrors = workScheduleService.validateRequest(
      {
        ...formData,
        user_id: userId
      },
      existingRequests
    );

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit({
      ...formData,
      user_id: userId
    } as any);
    
    onOpenChange(false);
  };

  const canModify = !request || request.status === 'pending' || isAdmin;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {request ? 'Modifier la demande' : 'Nouvelle demande'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type de demande */}
          <div>
            <Label htmlFor="request_type">Type de demande</Label>
            <Select
              value={formData.request_type}
              onValueChange={(value: WorkScheduleRequestType) => 
                setFormData(prev => ({ ...prev, request_type: value }))
              }
              disabled={!canModify}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(requestTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Date de début</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                disabled={!canModify}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_date">Date de fin</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                disabled={!canModify}
                required
              />
            </div>
          </div>

          {/* Demande exceptionnelle (télétravail uniquement) */}
          {formData.request_type === 'telework' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_exceptional"
                checked={formData.is_exceptional}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_exceptional: checked as boolean }))
                }
                disabled={!canModify}
              />
              <Label htmlFor="is_exceptional">
                Demande exceptionnelle (moins de 5 jours ouvrés)
              </Label>
            </div>
          )}

          {/* Raison */}
          <div>
            <Label htmlFor="reason">Raison (optionnel)</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              disabled={!canModify}
              placeholder="Précisez la raison de votre demande..."
            />
          </div>

          {/* Statut (admin uniquement) */}
          {isAdmin && request && (
            <>
              <div>
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: WorkScheduleStatus) => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="approved">Approuvé</SelectItem>
                    <SelectItem value="rejected">Refusé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="admin_comment">Commentaire admin</Label>
                <Textarea
                  id="admin_comment"
                  value={formData.admin_comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, admin_comment: e.target.value }))}
                  placeholder="Commentaire de l'administrateur..."
                />
              </div>
            </>
          )}

          {/* Erreurs de validation */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <div className="text-red-700 text-sm">
                <div className="font-medium mb-1">Erreurs de validation :</div>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            {canModify && (
              <Button type="submit" className="bg-seventic-500 hover:bg-seventic-600">
                {request ? 'Modifier' : 'Créer'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
