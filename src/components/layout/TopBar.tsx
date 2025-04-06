
import { Bell, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const TopBar = () => {
  const { user, isAdmin, isGrowth, isSDR } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  useEffect(() => {
    console.log("TopBar - État utilisateur:", 
      user ? `${user.name} (${user.role})` : "non connecté",
      "isAdmin:", isAdmin,
      "isGrowth:", isGrowth,
      "isSDR:", isSDR
    );
  }, [user, isAdmin, isGrowth, isSDR]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", newTheme);
  };

  // Couleurs spécifiques au rôle
  const getRoleColor = () => {
    if (isAdmin) return "bg-blue-500";
    if (isGrowth) return "bg-green-500";
    return "bg-seventic-500";
  };

  const getRoleText = () => {
    if (isAdmin) return "Administrateur";
    if (isGrowth) return "Équipe Growth";
    return "Sales Representative";
  };

  const handleUserClick = () => {
    if (isAdmin) {
      navigate("/admin/dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <header className={`border-b p-4 bg-background ${isAdmin ? "border-blue-300" : isGrowth ? "border-green-300" : "border-seventic-300"}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Seventic Growth Flow
            <span className={`ml-2 px-2 py-1 text-xs rounded text-white ${getRoleColor()}`}>
              {getRoleText()}
            </span>
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
          <div 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={handleUserClick}
          >
            <Avatar className={`h-8 w-8 ${getRoleColor()} text-white`}>
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className={getRoleColor()}>
                {user?.name.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className={`text-xs font-semibold ${isAdmin ? "text-blue-600" : isGrowth ? "text-green-600" : "text-seventic-600"}`}>
                {getRoleText()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
