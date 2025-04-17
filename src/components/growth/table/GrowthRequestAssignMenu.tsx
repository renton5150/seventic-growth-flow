
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { getAllUsers } from "@/services/user/userQueries";
import { toast } from "sonner";
import { Request } from "@/types/types";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GrowthRequestAssignMenuProps {
  request: Request;
  onRequestUpdated: () => void;
}

export function GrowthRequestAssignMenu({ request, onRequestUpdated }: GrowthRequestAssignMenuProps) {
  const [isAssigning, setIsAssigning] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['users-growth'],
    queryFn: getAllUsers,
  });

  // Filter only growth team members
  const growthUsers = users.filter(user => user.role === 'growth');

  const assignToUser = async (userId: string) => {
    try {
      setIsAssigning(true);
      
      const { data, error } = await supabase
        .from('requests')
        .update({
          assigned_to: userId,
          workflow_status: 'in_progress',
          last_updated: new Date().toISOString()
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success("Requête assignée avec succès");
      onRequestUpdated();
    } catch (error) {
      console.error("Erreur lors de l'assignation:", error);
      toast.error("Erreur lors de l'assignation de la requête");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={isAssigning}
        >
          <Users className="mr-2 h-4 w-4" /> Assigner
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {growthUsers.map((user) => (
          <DropdownMenuItem
            key={user.id}
            onClick={() => assignToUser(user.id)}
            disabled={isAssigning}
          >
            {user.name || user.email}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
