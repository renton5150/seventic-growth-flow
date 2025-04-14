
// Re-export all mission service functionality
export * from './mockMissions';
export * from './supabaseMissions';
export * from './missionService';
export { checkMissionExists } from '@/services/missions'; // Make sure we explicitly export this
