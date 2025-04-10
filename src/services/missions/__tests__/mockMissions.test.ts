
import { v4 as uuidv4 } from "uuid";
import { missions as mockMissions } from "@/data/missions";
import { 
  getAllMockMissions,
  getMockMissionsByUserId,
  getMockMissionsBySdrId,
  getMockMissionById,
  findMockMissionById,
  createMockMission,
  deleteMockMission,
  assignSDRToMockMission
} from "../mockMissions";

// Mock dependencies
jest.mock("@/data/missions", () => ({
  missions: [
    {
      id: "mission1",
      name: "Test Mission 1",
      client: "Test Client 1",
      sdrId: "user1",
      createdAt: new Date("2025-01-01"),
      startDate: new Date("2025-01-15")
    },
    {
      id: "mission2",
      name: "Test Mission 2",
      client: "Test Client 2",
      sdrId: "user2",
      createdAt: new Date("2025-02-01"),
      startDate: new Date("2025-02-15")
    }
  ]
}));

jest.mock("@/data/users", () => ({
  getUserById: (id: string) => {
    if (id === "user1") return { id: "user1", name: "User 1" };
    if (id === "user2") return { id: "user2", name: "User 2" };
    return undefined;
  }
}));

jest.mock("@/data/requests", () => ({
  getRequestsByMissionId: (id: string) => {
    if (id === "mission1") return [{ id: "request1", title: "Request 1" }];
    return [];
  }
}));

jest.mock("uuid", () => ({
  v4: jest.fn().mockReturnValue("mock-uuid")
}));

describe("Mock Missions Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllMockMissions", () => {
    test("should return all missions with additional properties", async () => {
      const missions = await getAllMockMissions();
      
      expect(missions).toHaveLength(2);
      expect(missions[0].sdrName).toBe("User 1");
      expect(missions[0].requests).toEqual([{ id: "request1", title: "Request 1" }]);
      expect(missions[1].sdrName).toBe("User 2");
      expect(missions[1].requests).toEqual([]);
    });
  });

  describe("getMockMissionsByUserId and getMockMissionsBySdrId", () => {
    test("should filter missions by user ID", async () => {
      const missions = await getMockMissionsByUserId("user1");
      
      expect(missions).toHaveLength(1);
      expect(missions[0].id).toBe("mission1");
      expect(missions[0].sdrName).toBe("User 1");
    });
    
    test("should return empty array for non-existent user", async () => {
      const missions = await getMockMissionsByUserId("nonexistent");
      expect(missions).toHaveLength(0);
    });
  });

  describe("getMockMissionById and findMockMissionById", () => {
    test("should return a mission by ID", async () => {
      const mission = await getMockMissionById("mission1");
      
      expect(mission).toBeDefined();
      expect(mission?.name).toBe("Test Mission 1");
      expect(mission?.sdrName).toBe("User 1");
    });
    
    test("should return undefined for non-existent mission", async () => {
      const mission = await getMockMissionById("nonexistent");
      expect(mission).toBeUndefined();
    });
  });

  describe("createMockMission", () => {
    test("should create a new mission", async () => {
      const missionInput = {
        name: "New Mission",
        description: "Mission description",
        sdrId: "user1",
        startDate: new Date("2025-03-01")
      };
      
      const newMission = await createMockMission(missionInput);
      
      expect(newMission).toBeDefined();
      expect(newMission.id).toBe("mock-uuid");
      expect(newMission.name).toBe("New Mission");
      expect(newMission.description).toBe("Mission description");
      expect(newMission.sdrId).toBe("user1");
      expect(newMission.sdrName).toBe("User 1");
      
      // Check if UUID was generated
      expect(uuidv4).toHaveBeenCalled();
    });
  });

  describe("deleteMockMission", () => {
    test("should delete an existing mission", async () => {
      const result = await deleteMockMission("mission1");
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      
      // Verify mission was removed
      const missions = await getAllMockMissions();
      expect(missions.find(m => m.id === "mission1")).toBeUndefined();
    });
    
    test("should handle deleting a non-existent mission", async () => {
      const result = await deleteMockMission("nonexistent");
      
      expect(result.success).toBe(false);
      expect(result.error).toBe("Mission not found");
    });
  });

  describe("assignSDRToMockMission", () => {
    test("should assign an SDR to a mission", async () => {
      const result = await assignSDRToMockMission("mission1", "user2");
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      
      // Verify SDR was assigned
      const mission = await getMockMissionById("mission1");
      expect(mission?.sdrId).toBe("user2");
    });
    
    test("should handle assigning to a non-existent mission", async () => {
      const result = await assignSDRToMockMission("nonexistent", "user1");
      
      expect(result.success).toBe(false);
      expect(result.error).toBe("Mission not found");
    });
  });
});
