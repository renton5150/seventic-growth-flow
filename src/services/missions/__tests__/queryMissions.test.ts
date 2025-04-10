
import { supabase } from "@/integrations/supabase/client";
import { getAllSupaMissions, getSupaMissionsByUserId, getSupaMissionById } from "../queryMissions";
import { getRequestsByMissionId } from "@/services/requestService";

// Mock dependencies
jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(),
    order: jest.fn().mockReturnThis()
  }
}));

jest.mock("@/services/requestService", () => ({
  getRequestsByMissionId: jest.fn().mockResolvedValue([])
}));

describe("Query Missions Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe("getAllSupaMissions", () => {
    test("should fetch and format all missions", async () => {
      // Setup mock return value for Supabase query
      const mockMissions = [
        {
          id: "mission1",
          name: "Test Mission 1",
          client: "Test Client 1",
          description: "Description 1",
          sdr_id: "user1",
          created_at: "2025-01-01T00:00:00Z",
          start_date: "2025-01-15T00:00:00Z",
          profiles: { name: "User 1" }
        },
        {
          id: "mission2",
          name: "Test Mission 2",
          client: null,
          description: null,
          sdr_id: "user2",
          created_at: "2025-02-01T00:00:00Z",
          start_date: null,
          profiles: { name: "User 2" }
        }
      ];
      
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            data: mockMissions,
            error: null
          })
        })
      }));
      
      const missions = await getAllSupaMissions();
      
      expect(missions).toHaveLength(2);
      expect(missions[0].id).toBe("mission1");
      expect(missions[0].name).toBe("Test Mission 1");
      expect(missions[0].client).toBe("Test Client 1");
      expect(missions[0].sdrName).toBe("User 1");
      
      expect(missions[1].id).toBe("mission2");
      expect(missions[1].client).toBe("Default Client"); // Default value used
      expect(missions[1].description).toBeUndefined();
      
      expect(getRequestsByMissionId).toHaveBeenCalledTimes(2);
      expect(supabase.from).toHaveBeenCalledWith("missions");
    });
    
    test("should return empty array when error occurs", async () => {
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            data: null,
            error: new Error("Database error")
          })
        })
      }));
      
      const missions = await getAllSupaMissions();
      
      expect(missions).toEqual([]);
    });
  });
  
  describe("getSupaMissionsByUserId", () => {
    test("should filter missions by user ID", async () => {
      const mockUserMissions = [
        {
          id: "mission1",
          name: "User Mission",
          client: "Client",
          description: "Description",
          sdr_id: "user1",
          created_at: "2025-01-01T00:00:00Z",
          start_date: "2025-01-15T00:00:00Z",
          profiles: { name: "User 1" }
        }
      ];
      
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              data: mockUserMissions,
              error: null
            })
          })
        })
      }));
      
      const missions = await getSupaMissionsByUserId("user1");
      
      expect(missions).toHaveLength(1);
      expect(missions[0].id).toBe("mission1");
      expect(missions[0].sdrId).toBe("user1");
      
      expect(supabase.from).toHaveBeenCalledWith("missions");
    });
    
    test("should return empty array for invalid UUID", async () => {
      const missions = await getSupaMissionsByUserId("not-a-uuid");
      
      expect(missions).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });
  
  describe("getSupaMissionById", () => {
    test("should fetch a mission by ID", async () => {
      const mockMission = {
        id: "mission1",
        name: "Test Mission",
        client: "Client",
        description: "Description",
        sdr_id: "user1",
        created_at: "2025-01-01T00:00:00Z",
        start_date: "2025-01-15T00:00:00Z",
        profiles: { name: "User 1" }
      };
      
      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: mockMission,
              error: null
            })
          })
        })
      }));
      
      (getRequestsByMissionId as jest.Mock).mockResolvedValue([{ id: "request1" }]);
      
      const mission = await getSupaMissionById("mission1");
      
      expect(mission).toBeDefined();
      expect(mission?.id).toBe("mission1");
      expect(mission?.sdrName).toBe("User 1");
      expect(mission?.requests).toEqual([{ id: "request1" }]);
    });
    
    test("should return undefined for invalid UUID", async () => {
      const mission = await getSupaMissionById("not-a-uuid");
      
      expect(mission).toBeUndefined();
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });
});
