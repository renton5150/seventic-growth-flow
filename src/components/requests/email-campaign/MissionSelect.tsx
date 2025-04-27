
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MissionSelectProps {
  value: string;
  onChange: (value: string) => void;
  missions: { id: string; name: string }[];
  disabled?: boolean;
}

export const MissionSelect: React.FC<MissionSelectProps> = ({
  value,
  onChange,
  missions,
  disabled = false
}) => {
  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Sélectionnez une mission" />
      </SelectTrigger>
      <SelectContent>
        {missions.length > 0 ? (
          missions.map((mission) => (
            <SelectItem key={mission.id} value={mission.id}>
              {mission.name}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="no-missions" disabled>
            Aucune mission disponible
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

export default MissionSelect;
