
// Ajouter l'import pour la fonction updateSupaMission modifiée
import { updateSupaMission, deleteSupaMission } from '../missions/updateDeleteMission';
import { createSupaMission } from '../missions/createMission';
import { 
  getAllSupaMissions, 
  getSupaMissionsByUserId, 
  getSupaMissionById 
} from '../missions/getMissions';

import { Mission } from '@/types/types';

// Les fonctions exportées par ce service
export const getAllMissions = getAllSupaMissions;
export const getMissionsByUserId = getSupaMissionsByUserId;
export const getMissionById = getSupaMissionById;

// Fonction de création de mission
export const createMission = createSupaMission;

// Fonction de mise à jour de mission avec prise en compte du rôle utilisateur
export const updateMission = async (mission: {
  id: string;
  name: string;
  sdrId: string;
  description?: string;
  startDate: Date | null;
  endDate: Date | null;
  type: string;
}, userRole?: string): Promise<Mission> => {
  console.log("Mise à jour de mission avec rôle utilisateur:", userRole);
  return updateSupaMission(mission, userRole);
};

// Fonction de suppression de mission
export const deleteMission = deleteSupaMission;
