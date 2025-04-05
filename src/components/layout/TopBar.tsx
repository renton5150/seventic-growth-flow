
import { Bell, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export const TopBar = () => {
  const { user } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", newTheme);
  };

  // Couleurs spécifiques au rôle
  const getRoleColor = () => {
    switch (user?.role) {
      case "admin":
        return "bg-blue-500";
      case "growth":
        return "bg-green-500";
      case "sdr":
        return "bg-seventic-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRoleText = () => {
    switch (user?.role) {
      case "admin":
        return "Administrateur";
      case "growth":
        return "Équipe Growth";
      case "sdr":
        return "Sales Representative";
      default:
        return "";
    }
  };

  return (
    <header className={`border-b p-4 bg-background ${user?.role === "admin" ? "border-blue-300" : user?.role === "growth" ? "border-green-300" : "border-seventic-300"}`}>
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
          <div className="flex items-center space-x-2">
            <Avatar className={`h-8 w-8 ${getRoleColor()} text-white`}>
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className={getRoleColor()}>
                {user?.name.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className={`text-xs font-semibold ${user?.role === "admin" ? "text-blue-600" : user?.role === "growth" ? "text-green-600" : "text-seventic-600"}`}>
                {getRoleText()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
