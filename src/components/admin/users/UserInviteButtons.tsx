
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { UserRole } from "@/types/types";

interface UserInviteButtonsProps {
  onInviteClick: (role: UserRole) => void;
}

export const UserInviteButtons = ({ onInviteClick }: UserInviteButtonsProps) => {
  return (
    <div className="flex space-x-2">
      <Button 
        variant="outline" 
        onClick={() => onInviteClick("sdr")}
        className="border-seventic-300 hover:bg-seventic-50 text-seventic-700"
      >
        <PlusCircle className="mr-2 h-4 w-4" /> Inviter un SDR
      </Button>
      <Button 
        variant="outline" 
        onClick={() => onInviteClick("growth")}
        className="border-green-300 hover:bg-green-50 text-green-700"
      >
        <PlusCircle className="mr-2 h-4 w-4" /> Inviter un Growth
      </Button>
      <Button 
        variant="outline" 
        onClick={() => onInviteClick("admin")}
        className="border-blue-300 hover:bg-blue-50 text-blue-700"
      >
        <PlusCircle className="mr-2 h-4 w-4" /> Inviter un Admin
      </Button>
    </div>
  );
};
