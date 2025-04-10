
import { Mission } from "@/types/types";

// Common mission input data type
export interface MissionInput {
  name: string;
  description?: string;
  client?: string;
  sdrId: string;
  startDate: Date;
  sdrName?: string; // Optional field for mock implementations
}

// Mission service response types
export interface MissionServiceResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Mission Assignment result
export interface AssignmentResult {
  success: boolean;
  error?: string;
}

// Mission Deletion result
export interface DeletionResult {
  success: boolean;
  error?: string;
}
