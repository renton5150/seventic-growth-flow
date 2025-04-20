
// More distinctive color palette with higher contrast
export const missionColors = [
  { bg: '#8B5CF6', border: '#6D28D9', textColor: '#FFFFFF' }, // Violet vif
  { bg: '#EC4899', border: '#BE185D', textColor: '#FFFFFF' }, // Rose vif
  { bg: '#F97316', border: '#C2410C', textColor: '#FFFFFF' }, // Orange vif
  { bg: '#10B981', border: '#047857', textColor: '#FFFFFF' }, // Vert émeraude
  { bg: '#3B82F6', border: '#1D4ED8', textColor: '#FFFFFF' }, // Bleu vif
  { bg: '#EF4444', border: '#B91C1C', textColor: '#FFFFFF' }, // Rouge
  { bg: '#F59E0B', border: '#B45309', textColor: '#FFFFFF' }, // Jaune ambre
  { bg: '#6366F1', border: '#4338CA', textColor: '#FFFFFF' }  // Indigo
];

export type MissionColor = {
  bg: string;
  border: string;
  textColor: string;
};

export const createMissionColorMap = (missions: { id: string }[]) => {
  const map = new Map<string, MissionColor>();
  missions.forEach((mission, index) => {
    const colorIndex = index % missionColors.length;
    map.set(mission.id, missionColors[colorIndex]);
  });
  return map;
};
