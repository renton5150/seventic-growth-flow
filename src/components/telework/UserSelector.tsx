
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "lucide-react";

interface UserSelectorProps {
  users: Array<{ id: string; name: string; email: string; role: string }>;
  selectedUserId: string;
  onUserChange: (userId: string) => void;
  currentUserId: string;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  users,
  selectedUserId,
  onUserChange,
  currentUserId
}) => {
  return (
    <div className="flex items-center gap-3">
      <User className="h-5 w-5 text-gray-600" />
      <Select value={selectedUserId} onValueChange={onUserChange}>
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Sélectionner un utilisateur" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={currentUserId}>
            <div className="flex flex-col">
              <span className="font-medium">Mon planning</span>
              <span className="text-sm text-gray-500">Voir mon propre planning</span>
            </div>
          </SelectItem>
          {users
            .filter(user => user.id !== currentUserId)
            .map((user) => (
              <SelectItem key={user.id} value={user.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-sm text-gray-500">
                    {user.role === 'sdr' ? 'SDR' : user.role === 'growth' ? 'Growth' : user.role} - {user.email}
                  </span>
                </div>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
};
