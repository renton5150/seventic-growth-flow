
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/utils/permissionUtils";
import { User } from "@/types/types";

interface UserProfileProps {
  user: User | null;
}

export const UserProfile = ({ user }: UserProfileProps) => {
  if (!user) return null;

  return (
    <div className="flex items-center px-3 py-2">
      <Avatar className="h-8 w-8 mr-3">
        <AvatarImage src={user.avatar} />
        <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium">{user.name}</p>
        <p className="text-xs text-muted-foreground">
          {user.role === "admin"
            ? "Administrateur"
            : user.role === "growth"
              ? "Growth"
              : "SDR"}
        </p>
      </div>
    </div>
  );
};
