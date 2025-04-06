
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail, Lock, Eye, EyeOff, UserPlus, RefreshCw, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const LoginForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline" | "checking">("checking");
  const { login } = useAuth();
  const navigate = useNavigate();

  // Vérifier la connexion réseau et Supabase au chargement
  useEffect(() => {
    const checkConnection = async () => {
      setNetworkStatus("checking");
      
      // Vérifier la connexion internet
      if (!navigator.onLine) {
        setNetworkStatus("offline");
        setError("Vous semblez être hors ligne. Vérifiez votre connexion internet.");
        return;
      }
      
      // Vérifier la connexion à Supabase
      try {
        const start = Date.now();
        const { error } = await supabase.from("missions").select("id").limit(1);
        const elapsed = Date.now() - start;
        
        if (error) {
          console.error("Échec du test de connexion à Supabase:", error);
          setNetworkStatus("offline");
          setError(`Problème de connexion au serveur: ${error.message}`);
        } else {
          console.log(`Connexion à Supabase OK (${elapsed}ms)`);
          setNetworkStatus("online");
          setError(null);
        }
      } catch (err) {
        console.error("Erreur lors du test de connexion:", err);
        setNetworkStatus("offline");
        setError("Impossible de se connecter au serveur. Veuillez réessayer plus tard.");
      }
    };
    
    checkConnection();
    
    // Surveiller les changements de connectivité
    const handleOnline = () => {
      console.log("Connexion réseau rétablie");
      checkConnection();
    };
    
    const handleOffline = () => {
      console.log("Connexion réseau perdue");
      setNetworkStatus("offline");
      setError("Vous êtes hors ligne. Vérifiez votre connexion internet.");
    };
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (networkStatus === "offline") {
        setError("Impossible de se connecter: vous êtes hors ligne");
        setIsSubmitting(false);
        return;
      }
      
      console.log("Tentative de connexion avec:", email);
      const success = await login(email, password);
      if (success) {
        navigate("/dashboard");
      } else {
        setError("Échec de la connexion. Vérifiez vos identifiants.");
      }
    } catch (error) {
      console.error("Erreur lors de la tentative de connexion:", error);
      setError("Une erreur est survenue lors de la connexion. Veuillez réessayer.");
      toast.error("Erreur", {
        description: "Une erreur est survenue lors de la connexion",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (networkStatus === "offline") {
        setError("Impossible de créer un compte: vous êtes hors ligne");
        setIsSubmitting(false);
        return;
      }
      
      if (!email || !password) {
        setError("Veuillez remplir tous les champs obligatoires.");
        setIsSubmitting(false);
        return;
      }
      
      if (password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
        setIsSubmitting(false);
        return;
      }

      console.log("Tentative d'inscription avec:", email);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
            role: "sdr"  // Attribut par défaut le rôle SDR aux nouveaux utilisateurs
          }
        }
      });

      if (signUpError) {
        console.error("Erreur lors de l'inscription:", signUpError);
        
        if (signUpError.message.includes("already registered")) {
          setError("Cette adresse email est déjà utilisée. Veuillez vous connecter.");
        } else {
          setError(signUpError.message);
        }
        
        toast.error("Erreur d'inscription", {
          description: signUpError.message
        });
        return;
      }

      if (data.user) {
        toast.success("Inscription réussie", {
          description: "Votre compte a été créé. Vous pouvez maintenant vous connecter."
        });
        setIsLogin(true);
        setPassword("");
      } else {
        toast.info("Vérification requise", {
          description: "Veuillez vérifier votre email pour confirmer votre compte."
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      setError("Une erreur est survenue lors de l'inscription");
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
    setError(null);
  };

  const retryConnection = () => {
    setNetworkStatus("checking");
    setError(null);
    
    // Déclencher une nouvelle vérification de connexion
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from("missions").select("id").limit(1);
        
        if (error) {
          console.error("Échec du test de connexion à Supabase:", error);
          setNetworkStatus("offline");
          setError(`Problème de connexion au serveur: ${error.message}`);
        } else {
          console.log("Connexion à Supabase OK");
          setNetworkStatus("online");
          setError(null);
        }
      } catch (err) {
        console.error("Erreur lors du test de connexion:", err);
        setNetworkStatus("offline");
        setError("Impossible de se connecter au serveur. Veuillez réessayer plus tard.");
      }
    };
    
    checkConnection();
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
        {/* Notification de mode test avec comptes affichés */}
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-700">Mode démonstration</AlertTitle>
          <AlertDescription className="text-blue-600">
            Pour tester l'application, créez un compte avec votre propre email et mot de passe.
          </AlertDescription>
        </Alert>
        
        {networkStatus === "offline" && (
          <Alert variant="destructive" className="mb-4 flex justify-between items-center">
            <AlertDescription>Problème de connexion au serveur</AlertDescription>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={retryConnection} 
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Réessayer
            </Button>
          </Alert>
        )}
        
        {error && networkStatus !== "offline" && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
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
                  disabled={isSubmitting || networkStatus === "offline"}
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
                disabled={isSubmitting || networkStatus === "offline"}
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
                minLength={6}
                disabled={isSubmitting || networkStatus === "offline"}
              />
              <Button 
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={toggleShowPassword}
                disabled={isSubmitting || networkStatus === "offline"}
              >
                {showPassword ? 
                  <EyeOff className="h-4 w-4 text-gray-500" /> : 
                  <Eye className="h-4 w-4 text-gray-500" />
                }
              </Button>
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full bg-seventic-500 hover:bg-seventic-600" 
            disabled={isSubmitting || networkStatus === "offline"}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                {isLogin ? "Connexion en cours..." : "Inscription en cours..."}
              </>
            ) : networkStatus === "checking" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Vérification de la connexion...
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
