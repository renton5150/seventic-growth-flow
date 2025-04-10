
import { supabase } from "@/integrations/supabase/client";
import { 
  createSupaMission, 
  deleteSupaMission, 
  assignSDRToSupaMission 
} from "../mutationMissions";
import { MissionInput } from "../types";
import { v4 as uuidv4 } from "uuid";

// Mock dependencies
jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    auth: {
      getSession: jest.fn()
    }
  }
}));

// Mock uuid
jest.mock("uuid", () => ({
  v4: jest.fn().mockReturnValue("mock-uuid")
}));

describe("Mutation Missions Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe("createSupaMission", () => {
    const missionInput: MissionInput = {
      name: "New Mission",
      description: "Description",
      sdrId: "user1",
      startDate: new Date("2025-03-01")
    };
    
    test("should create a new mission successfully", async () => {
      // Mock authenticated session
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            user: { id: "user1" }
          }
        }
      });
      
      // Mock successful mission creation
      const mockNewMission = {
        id: "new-mission-id",
        name: "New Mission",
        client: "Default Client",
        description: "Description",
        sdr_id: "user1",
        created_at: "2025-03-01T00:00:00Z",
        start_date: "2025-03-01T00:00:00Z",
        profiles: { name: "User 1" }
      };
      
      (supabase.from as jest.Mock).mockImplementation(() => ({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue({
              data: mockNewMission,
              error: null
            })
          })
        })
      }));
      
      const mission = await createSupaMission(missionInput);
      
      expect(mission).toBeDefined();
      expect(mission?.name).toBe("New Mission");
      expect(mission?.sdrId).toBe("user1");
      
      expect(supabase.from).toHaveBeenCalledWith("missions");
      expect(supabase.auth.getSession).toHaveBeenCalled();
    });
    
    test("should use authenticated user ID when sdrId is not valid", async () => {
      // Mock authenticated session
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            user: { id: "auth-user-id" }
          }
        }
      });
      
      const invalidInput = {
        ...missionInput,
        sdrId: "not-a-uuid"
      };
      
      // Mock successful mission creation
      const mockNewMission = {
        id: "new-mission-id",
        name: "New Mission",
        client: "Default Client",
        description: "Description",
        sdr_id: "auth-user-id",
        created_at: "2025-03-01T00:00:00Z",
        start_date: "2025-03-01T00:00:00Z",
        profiles: { name: "Auth User" }
      };
      
      (supabase.from as jest.Mock).mockImplementation(() => ({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue({
              data: mockNewMission,
              error: null
            })
          })
        })
      }));
      
      const mission = await createSupaMission(invalidInput);
      
      expect(mission).toBeDefined();
      expect(mission?.sdrId).toBe("auth-user-id");
    });
    
    test("should return undefined when not authenticated", async () => {
      // Mock unauthenticated session
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null }
      });
      
      const mission = await createSupaMission(missionInput);
      
      expect(mission).toBeUndefined();
      expect(supabase.from).not.toHaveBeenCalled();
    });
    
    test("should handle database errors", async () => {
      // Mock authenticated session
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            user: { id: "user1" }
          }
        }
      });
      
      // Mock database error
      (supabase.from as jest.Mock).mockImplementation(() => ({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue({
              data: null,
              error: new Error("Database error")
            })
          })
        })
      }));
      
      const mission = await createSupaMission(missionInput);
      
      expect(mission).toBeUndefined();
    });
  });
  
  describe("deleteSupaMission", () => {
    test("should delete a mission successfully", async () => {
      // Mock authenticated session
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            user: { id: "user1" }
          }
        }
      });
      
      // Mock successful deletion of requests
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            error: null
          })
        })
      }));
      
      // Mock successful deletion of mission
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            error: null
          })
        })
      }));
      
      const result = await deleteSupaMission("mission1");
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
    
    test("should fail for invalid UUID", async () => {
      const result = await deleteSupaMission("not-a-uuid");
      
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid mission ID format");
      expect(supabase.from).not.toHaveBeenCalled();
    });
    
    test("should fail when not authenticated", async () => {
      // Mock unauthenticated session
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null }
      });
      
      const result = await deleteSupaMission(uuidv4());
      
      expect(result.success).toBe(false);
      expect(result.error).toBe("User not authenticated");
      expect(supabase.from).not.toHaveBeenCalled();
    });
    
    test("should handle database errors", async () => {
      // Mock authenticated session
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            user: { id: "user1" }
          }
        }
      });
      
      // Mock successful deletion of requests
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            error: null
          })
        })
      }));
      
      // Mock failed deletion of mission
      (supabase.from as jest.Mock).mockImplementationOnce(() => ({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            error: { message: "Database error" }
          })
        })
      }));
      
      const result = await deleteSupaMission(uuidv4());
      
      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });
  });
  
  describe("assignSDRToSupaMission", () => {
    test("should assign an SDR to a mission successfully", async () => {
      // Mock successful update
      (supabase.from as jest.Mock).mockImplementation(() => ({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            error: null
          })
        })
      }));
      
      const result = await assignSDRToSupaMission(uuidv4(), uuidv4());
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(supabase.from).toHaveBeenCalledWith("missions");
    });
    
    test("should fail for invalid UUIDs", async () => {
      // Valid mission ID, invalid SDR ID
      let result = await assignSDRToSupaMission(uuidv4(), "not-a-uuid");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid mission ID or SDR ID format");
      
      // Invalid mission ID, valid SDR ID
      result = await assignSDRToSupaMission("not-a-uuid", uuidv4());
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid mission ID or SDR ID format");
      
      // Both invalid
      result = await assignSDRToSupaMission("not-a-uuid", "also-not-a-uuid");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid mission ID or SDR ID format");
      
      expect(supabase.from).not.toHaveBeenCalled();
    });
    
    test("should handle database errors", async () => {
      // Mock database error
      (supabase.from as jest.Mock).mockImplementation(() => ({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            error: { message: "Database error" }
          })
        })
      }));
      
      const result = await assignSDRToSupaMission(uuidv4(), uuidv4());
      
      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });
  });
});
