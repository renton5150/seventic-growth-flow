
import { User, UserRole } from "@/types/types";

// Type for user creation response
export interface CreateUserResponse {
  success: boolean;
  error?: string;
  user?: User;
}

// Type for action responses
export interface ActionResponse {
  success: boolean; 
  error?: string;
}

// Helper type guard for user roles
export const isValidUserRole = (role: any): role is UserRole => {
  return role === "admin" || role === "growth" || role === "sdr";
};
