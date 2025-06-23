
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("🔄 Traitement du callback d'authentification - NOUVELLE VERSION");
        console.log("📍 URL complète:", window.location.href);
        console.log("🔗 Hash détecté:", window.location.hash);
        console.log("🔍 Search params:", window.location.search);
        
        // Extraire les paramètres de l'URL
        const type = searchParams.get("type");
        const emailParam = searchParams.get("email");
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");
        
        console.log("📧 Paramètres extraits:", { type, emailParam, error, errorDescription });
        
        if (emailParam) {
          setEmail(emailParam);
          console.log("📧 Email extrait:", emailParam);
        }
        
        // Vérifier s'il y a une erreur dans l'URL
        if (error) {
          console.error("❌ Erreur dans l'URL:", error, errorDescription);
          setStatus("error");
          setMessage(errorDescription || error);
          return;
        }
        
        // Récupérer le hash qui peut contenir les tokens
        const hash = window.location.hash;
        console.log("🔗 Hash analysé:", hash);
        
        // Gérer les tokens dans le hash - CORRECTION DE LA LOGIQUE
        if (hash && hash.length > 1) {
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token') || '';
          const tokenType = hashParams.get('type');
          
          console.log("🔑 Tokens trouvés dans le hash:", { 
            hasAccessToken: !!accessToken, 
            hasRefreshToken: !!refreshToken,
            tokenType,
            allHashParams: Object.fromEntries(hashParams.entries())
          });
          
          if (accessToken) {
            try {
              console.log("⚡ Configuration de la session avec les tokens du hash...");
              
              const { data, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              
              if (sessionError) {
                console.error("❌ Erreur lors de la configuration de la session:", sessionError);
                setStatus("error");
                setMessage("Le lien d'authentification est invalide ou a expiré.");
                return;
              }
              
              console.log("✅ Session configurée avec succès depuis le hash");
              setStatus("success");
              
              // Déterminer la redirection selon le type
              if (type === "invite" || tokenType === "invite") {
                console.log("🎉 Invitation acceptée - redirection vers reset password");
                setMessage("Compte activé avec succès ! Vous allez être redirigé vers la page de définition du mot de passe.");
                setTimeout(() => {
                  navigate(`/reset-password?type=invite&email=${encodeURIComponent(emailParam || data?.user?.email || '')}`);
                }, 2000);
              } else {
                console.log("🔄 Récupération de mot de passe - redirection vers reset password");
                setMessage("Authentification réussie ! Vous allez être redirigé vers la page de réinitialisation du mot de passe.");
                setTimeout(() => {
                  navigate(`/reset-password?type=recovery&email=${encodeURIComponent(emailParam || data?.user?.email || '')}`);
                }, 2000);
              }
              
              return;
            } catch (err) {
              console.error("💥 Exception lors de la configuration de la session:", err);
              setStatus("error");
              setMessage("Une erreur s'est produite lors de l'authentification.");
              return;
            }
          } else {
            console.warn("⚠️ Hash présent mais pas de token d'accès");
          }
        }
        
        // Fallback : vérifier s'il y a une session existante
        console.log("🔍 Aucun token dans le hash, vérification de session existante...");
        const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
        
        if (getSessionError) {
          console.error("❌ Erreur lors de la récupération de session:", getSessionError);
          setStatus("error");
          setMessage("Erreur lors de la vérification de votre session.");
          return;
        }
        
        if (session) {
          console.log("✅ Session existante trouvée");
          setStatus("success");
          setMessage("Session active détectée. Redirection en cours...");
          
          setTimeout(() => {
            if (type === "invite") {
              navigate(`/reset-password?type=invite&email=${encodeURIComponent(emailParam || session.user?.email || '')}`);
            } else {
              navigate("/dashboard");
            }
          }, 1500);
        } else {
          console.warn("⚠️ Aucun token ni session trouvé - PROBLÈME POTENTIEL");
          console.log("🔍 Détails de debug:", {
            fullUrl: window.location.href,
            hash: window.location.hash,
            search: window.location.search,
            pathname: window.location.pathname
          });
          
          setStatus("error");
          setMessage("Le lien d'authentification est invalide ou a expiré. Veuillez demander un nouveau lien.");
        }
        
      } catch (error) {
        console.error("💥 Erreur lors du traitement du callback:", error);
        setStatus("error");
        setMessage("Une erreur inattendue s'est produite lors de l'authentification.");
      }
    };
    
    // Délai plus court pour traiter rapidement
    const timeoutId = setTimeout(handleAuthCallback, 50);
    
    return () => clearTimeout(timeoutId);
  }, [searchParams, navigate]);

  const handleRequestNewLink = async () => {
    if (!email) {
      toast.error("Email manquant. Veuillez contacter un administrateur.");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth-callback?email=${encodeURIComponent(email)}`,
      });

      if (error) {
        console.error("Erreur lors de l'envoi du nouveau lien:", error);
        toast.error("Impossible d'envoyer un nouveau lien.");
      } else {
        toast.success("Un nouveau lien a été envoyé à votre adresse email.");
      }
    } catch (err) {
      console.error("Exception lors de l'envoi du nouveau lien:", err);
      toast.error("Une erreur s'est produite lors de l'envoi du lien.");
    }
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <CardContent className="flex flex-col items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <p className="text-lg font-medium">Traitement de votre lien d'authentification...</p>
            <p className="text-sm text-muted-foreground mt-2">Veuillez patienter</p>
          </CardContent>
        );
        
      case "success":
        return (
          <CardContent className="flex flex-col items-center py-8">
            <CheckCircle className="h-8 w-8 text-green-500 mb-4" />
            <p className="text-lg font-medium text-center">{message}</p>
          </CardContent>
        );
        
      case "error":
        return (
          <CardContent className="py-6">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur d'authentification</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
            
            {email && (
              <div className="mt-4 text-center">
                <p className="mb-4 text-sm">Souhaitez-vous recevoir un nouveau lien ?</p>
                <Button onClick={handleRequestNewLink} className="w-full">
                  Demander un nouveau lien
                </Button>
              </div>
            )}
            
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={() => navigate("/login")} className="w-full">
                Retour à la connexion
              </Button>
            </div>
          </CardContent>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md p-4">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Authentification
          </CardTitle>
          <CardDescription className="text-center">
            Traitement de votre lien d'authentification
          </CardDescription>
        </CardHeader>
        {renderContent()}
      </Card>
    </div>
  );
};

export default AuthCallback;
