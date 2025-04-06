
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail, Lock, Eye, EyeOff, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const LoginForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });

      if (error) {
        console.error("Erreur lors de l'inscription:", error);
        toast.error("Erreur d'inscription", {
          description: error.message
        });
        return;
      }

      if (data.user) {
        toast.success("Inscription réussie", {
          description: "Votre compte a été créé. Vous pouvez maintenant vous connecter."
        });
        setIsLogin(true);
        setPassword("");
      }
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      toast.error("Erreur", {
        description: "Une erreur est survenue lors de l'inscription"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setEmail("");
    setPassword("");
    setName("");
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {isLogin ? "Connexion" : "Inscription"}
        </CardTitle>
        <CardDescription className="text-center">
          {isLogin 
            ? "Entrez vos identifiants pour accéder à votre compte" 
            : "Créez un compte pour commencer à utiliser l'application"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={isLogin ? handleLoginSubmit : handleSignupSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Votre nom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  className="pl-10"
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
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
              {isLogin && (
                <a href="#" className="text-sm text-seventic-500 hover:text-seventic-600">
                  Mot de passe oublié?
                </a>
              )}
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
          <Button type="submit" className="w-full bg-seventic-500 hover:bg-seventic-600" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                {isLogin ? "Connexion en cours..." : "Inscription en cours..."}
              </>
            ) : (
              isLogin ? "Se connecter" : "S'inscrire"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-center text-muted-foreground">
          {isLogin ? (
            <p>
              Vous n'avez pas de compte?{" "}
              <button 
                type="button"
                onClick={toggleForm}
                className="text-seventic-500 hover:text-seventic-600 font-medium"
              >
                Inscrivez-vous
              </button>
            </p>
          ) : (
            <p>
              Vous avez déjà un compte?{" "}
              <button 
                type="button"
                onClick={toggleForm}
                className="text-seventic-500 hover:text-seventic-600 font-medium"
              >
                Connectez-vous
              </button>
            </p>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
