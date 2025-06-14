
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CRAUserSelectorProps {
  allUsers: User[];
  selectedUserId: string;
  setSelectedUserId: (userId: string) => void;
  isAdmin: boolean;
  isLoading?: boolean;
}

export const CRAUserSelector = ({ 
  allUsers, 
  selectedUserId, 
  setSelectedUserId, 
  isAdmin, 
  isLoading 
}: CRAUserSelectorProps) => {
  // Ne rien afficher si pas admin
  if (!isAdmin) {
    return null;
  }

  const selectedUser = allUsers.find(u => u.id === selectedUserId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Sélectionner un SDR
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {selectedUser 
              ? `Consultation du CRA de ${selectedUser.name}`
              : "Sélectionnez un SDR pour consulter son CRA"
            }
          </p>
          
          {isLoading ? (
            <div className="text-sm text-gray-500">Chargement des utilisateurs...</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allUsers.map(user => (
                <Button
                  key={user.id}
                  variant={selectedUserId === user.id ? "default" : "outline"}
                  onClick={() => setSelectedUserId(user.id)}
                  className="text-sm"
                >
                  {user.name || user.email}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
