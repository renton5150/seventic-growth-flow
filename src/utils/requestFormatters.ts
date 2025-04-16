
import { Request } from "@/types/types";

export function formatRequestFromDb(dbRequest: any): Request {
  const createdAt = new Date(dbRequest.created_at);
  const dueDate = new Date(dbRequest.due_date);
  const lastUpdated = new Date(dbRequest.last_updated || dbRequest.created_at);
  
  const isLate = dueDate < new Date() && 
                 (dbRequest.workflow_status !== 'completed' && dbRequest.workflow_status !== 'canceled');
  
  return {
    id: dbRequest.id,
    title: dbRequest.title,
    type: dbRequest.type,
    missionId: dbRequest.mission_id,
    createdBy: dbRequest.created_by,
    sdrName: dbRequest.profiles?.name || "Non assigné",
    createdAt: new Date(dbRequest.created_at),
    dueDate: new Date(dbRequest.due_date),
    status: dbRequest.status,
    workflow_status: dbRequest.workflow_status || 'pending_assignment',
    target_role: dbRequest.target_role || 'growth',
    assigned_to: dbRequest.assigned_to || null,
    assignedToName: dbRequest.assigned_profile?.name || null,
    lastUpdated: new Date(dbRequest.last_updated),
    isLate,
    ...dbRequest.details
  };
}
