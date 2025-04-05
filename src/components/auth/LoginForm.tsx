
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

export const LoginForm = () => {
  const [email, setEmail] = useState("sdr@seventic.com");
  const [password, setPassword] = useState("seventic123");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const success = await login(email, password);
      if (success) {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Erreur lors de la tentative de connexion:", error);
      toast.error("Erreur", {
        description: "Une erreur est survenue lors de la connexion",
      });
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Connexion</CardTitle>
        <CardDescription className="text-center">
          Entrez vos identifiants pour accéder à votre compte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                id="email"
                type="email"
                placeholder="email@seventic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mot de passe</Label>
              <a href="#" className="text-sm text-seventic-500 hover:text-seventic-600">
                Mot de passe oublié?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10"
              />
              <Button 
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={toggleShowPassword}
              >
                {showPassword ? 
                  <EyeOff className="h-4 w-4 text-gray-500" /> : 
                  <Eye className="h-4 w-4 text-gray-500" />
                }
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full bg-seventic-500 hover:bg-seventic-600" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connexion en cours...
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-center text-muted-foreground">
          <p>
            Identifiants de démo: <br />
            Email: sdr@seventic.com <br />
            Password: seventic123
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};
