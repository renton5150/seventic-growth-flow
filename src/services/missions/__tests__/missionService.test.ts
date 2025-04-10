
import { 
  getAllMissions,
  getMissionsByUserId,
  getMissionById,
  createMission,
  deleteMission,
  assignSDRToMission
} from "@/services/missionService";
import { isSupabaseConfigured } from "../config";
import * as mockMissionsModule from "../mockMissions";
import * as supaMissionsModule from "../index";
import { MissionInput } from "../types";

// Mock the modules
jest.mock("../config", () => ({
  isSupabaseConfigured: true
}));

jest.mock("../mockMissions", () => ({
  getAllMockMissions: jest.fn(),
  getMockMissionsByUserId: jest.fn(),
  getMockMissionById: jest.fn(),
  createMockMission: jest.fn(),
  deleteMockMission: jest.fn(),
  assignSDRToMockMission: jest.fn()
}));

jest.mock("../index", () => ({
  getAllSupaMissions: jest.fn(),
  getSupaMissionsByUserId: jest.fn(),
  getSupaMissionById: jest.fn(),
  createSupaMission: jest.fn(),
  deleteSupaMission: jest.fn(),
  assignSDRToSupaMission: jest.fn()
}));

// Mock dynamic import
jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: jest.fn()
    }
  }
}));

describe("Mission Service Integration", () => {
  let isAuthenticated: boolean;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default authentication state
    isAuthenticated = true;
    const supabase = require("@/integrations/supabase/client").supabase;
    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: isAuthenticated ? { user: { id: "user1" } } : null
      }
    });
  });
  
  describe("getAllMissions", () => {
    test("should use Supabase when configured and authenticated", async () => {
      // Setup mocks
      const mockMissions = [{ id: "mission1" }, { id: "mission2" }];
      (supaMissionsModule.getAllSupaMissions as jest.Mock).mockResolvedValue(mockMissions);
      
      const result = await getAllMissions();
      
      expect(result).toEqual(mockMissions);
      expect(supaMissionsModule.getAllSupaMissions).toHaveBeenCalled();
      expect(mockMissionsModule.getAllMockMissions).not.toHaveBeenCalled();
    });
    
    test("should fallback to mock data when no Supabase missions", async () => {
      // Setup Supabase to return empty array
      (supaMissionsModule.getAllSupaMissions as jest.Mock).mockResolvedValue([]);
      
      // Setup mock data
      const mockMissions = [{ id: "mission1" }];
      (mockMissionsModule.getAllMockMissions as jest.Mock).mockResolvedValue(mockMissions);
      
      const result = await getAllMissions();
      
      expect(result).toEqual(mockMissions);
      expect(supaMissionsModule.getAllSupaMissions).toHaveBeenCalled();
      expect(mockMissionsModule.getAllMockMissions).toHaveBeenCalled();
    });
    
    test("should use mock data when not authenticated", async () => {
      // Change auth state
      isAuthenticated = false;
      
      // Setup mock data
      const mockMissions = [{ id: "mission1" }];
      (mockMissionsModule.getAllMockMissions as jest.Mock).mockResolvedValue(mockMissions);
      
      const result = await getAllMissions();
      
      expect(result).toEqual(mockMissions);
      expect(supaMissionsModule.getAllSupaMissions).not.toHaveBeenCalled();
      expect(mockMissionsModule.getAllMockMissions).toHaveBeenCalled();
    });
  });
  
  describe("getMissionsByUserId", () => {
    test("should use Supabase when configured and authenticated", async () => {
      // Setup mocks
      const mockMissions = [{ id: "mission1" }];
      (supaMissionsModule.getSupaMissionsByUserId as jest.Mock).mockResolvedValue(mockMissions);
      
      const result = await getMissionsByUserId("user1");
      
      expect(result).toEqual(mockMissions);
      expect(supaMissionsModule.getSupaMissionsByUserId).toHaveBeenCalledWith("user1");
      expect(mockMissionsModule.getMockMissionsByUserId).not.toHaveBeenCalled();
    });
    
    test("should fallback to mock data when no Supabase missions", async () => {
      // Setup Supabase to return empty array
      (supaMissionsModule.getSupaMissionsByUserId as jest.Mock).mockResolvedValue([]);
      
      // Setup mock data
      const mockMissions = [{ id: "mission1" }];
      (mockMissionsModule.getMockMissionsByUserId as jest.Mock).mockResolvedValue(mockMissions);
      
      const result = await getMissionsByUserId("user1");
      
      expect(result).toEqual(mockMissions);
      expect(supaMissionsModule.getSupaMissionsByUserId).toHaveBeenCalled();
      expect(mockMissionsModule.getMockMissionsByUserId).toHaveBeenCalled();
    });
  });
  
  describe("getMissionById", () => {
    test("should use Supabase when configured and authenticated", async () => {
      // Setup mocks
      const mockMission = { id: "mission1" };
      (supaMissionsModule.getSupaMissionById as jest.Mock).mockResolvedValue(mockMission);
      
      const result = await getMissionById("mission1");
      
      expect(result).toEqual(mockMission);
      expect(supaMissionsModule.getSupaMissionById).toHaveBeenCalledWith("mission1");
      expect(mockMissionsModule.getMockMissionById).not.toHaveBeenCalled();
    });
    
    test("should fallback to mock data when no Supabase mission found", async () => {
      // Setup Supabase to return undefined
      (supaMissionsModule.getSupaMissionById as jest.Mock).mockResolvedValue(undefined);
      
      // Setup mock data
      const mockMission = { id: "mission1" };
      (mockMissionsModule.getMockMissionById as jest.Mock).mockResolvedValue(mockMission);
      
      const result = await getMissionById("mission1");
      
      expect(result).toEqual(mockMission);
      expect(supaMissionsModule.getSupaMissionById).toHaveBeenCalled();
      expect(mockMissionsModule.getMockMissionById).toHaveBeenCalled();
    });
  });
  
  describe("createMission", () => {
    const missionInput: MissionInput = {
      name: "New Mission",
      sdrId: "user1",
      startDate: new Date()
    };
    
    test("should use Supabase when configured and authenticated", async () => {
      // Setup mocks
      const mockMission = { id: "new-mission", name: "New Mission" };
      (supaMissionsModule.createSupaMission as jest.Mock).mockResolvedValue(mockMission);
      
      const result = await createMission(missionInput);
      
      expect(result).toEqual(mockMission);
      expect(supaMissionsModule.createSupaMission).toHaveBeenCalledWith(missionInput);
      expect(mockMissionsModule.createMockMission).not.toHaveBeenCalled();
    });
    
    test("should fallback to mock data when Supabase creation fails", async () => {
      // Setup Supabase to return undefined (failure)
      (supaMissionsModule.createSupaMission as jest.Mock).mockResolvedValue(undefined);
      
      // Setup mock data
      const mockMission = { id: "new-mission", name: "New Mission" };
      (mockMissionsModule.createMockMission as jest.Mock).mockResolvedValue(mockMission);
      
      const result = await createMission(missionInput);
      
      expect(result).toEqual(mockMission);
      expect(supaMissionsModule.createSupaMission).toHaveBeenCalled();
      expect(mockMissionsModule.createMockMission).toHaveBeenCalled();
    });
  });
  
  describe("deleteMission", () => {
    test("should use Supabase when configured and authenticated", async () => {
      // Setup mocks
      (supaMissionsModule.deleteSupaMission as jest.Mock).mockResolvedValue({ success: true });
      
      const result = await deleteMission("mission1");
      
      expect(result).toBe(true);
      expect(supaMissionsModule.deleteSupaMission).toHaveBeenCalledWith("mission1");
      expect(mockMissionsModule.deleteMockMission).not.toHaveBeenCalled();
    });
    
    test("should fallback to mock data when Supabase deletion fails", async () => {
      // Setup Supabase to return failure
      (supaMissionsModule.deleteSupaMission as jest.Mock).mockResolvedValue({ 
        success: false, 
        error: "Database error" 
      });
      
      // Setup mock to succeed
      (mockMissionsModule.deleteMockMission as jest.Mock).mockResolvedValue({ success: true });
      
      const result = await deleteMission("mission1");
      
      expect(result).toBe(true);
      expect(supaMissionsModule.deleteSupaMission).toHaveBeenCalled();
      expect(mockMissionsModule.deleteMockMission).toHaveBeenCalled();
    });
  });
  
  describe("assignSDRToMission", () => {
    test("should use Supabase when configured and authenticated", async () => {
      // Setup mocks
      (supaMissionsModule.assignSDRToSupaMission as jest.Mock).mockResolvedValue({ success: true });
      
      const result = await assignSDRToMission("mission1", "user2");
      
      expect(result).toBe(true);
      expect(supaMissionsModule.assignSDRToSupaMission).toHaveBeenCalledWith("mission1", "user2");
      expect(mockMissionsModule.assignSDRToMockMission).not.toHaveBeenCalled();
    });
    
    test("should fallback to mock data when Supabase assignment fails", async () => {
      // Setup Supabase to return failure
      (supaMissionsModule.assignSDRToSupaMission as jest.Mock).mockResolvedValue({ 
        success: false, 
        error: "Database error" 
      });
      
      // Setup mock to succeed
      (mockMissionsModule.assignSDRToMockMission as jest.Mock).mockResolvedValue({ success: true });
      
      const result = await assignSDRToMission("mission1", "user2");
      
      expect(result).toBe(true);
      expect(supaMissionsModule.assignSDRToSupaMission).toHaveBeenCalled();
      expect(mockMissionsModule.assignSDRToMockMission).toHaveBeenCalled();
    });
  });
});
