
import { updateSupaMission, deleteSupaMission } from '../missions/updateDeleteMission';
import { createSupaMission } from '../missions/createMission';
import { 
  getAllSupaMissions, 
  getSupaMissionsByUserId, 
  getSupaMissionById 
} from '../missions/getMissions';

import { Mission, MissionStatus } from '@/types/types';

export const getAllMissions = getAllSupaMissions;
export const getMissionsByUserId = getSupaMissionsByUserId;
export const getMissionById = getSupaMissionById;

export const createMission = createSupaMission;

export const updateMission = async (mission: {
  id: string;
  name: string;
  sdrId: string;
  description?: string;
  startDate: Date | null;
  endDate: Date | null;
  type: string;
  status?: MissionStatus;
}, userRole?: string): Promise<Mission> => {
  console.log("Mise à jour de mission avec rôle utilisateur:", userRole);
  console.log("Données de mission incluant status:", mission);
  return updateSupaMission(mission, userRole);
};

export const deleteMission = deleteSupaMission;
