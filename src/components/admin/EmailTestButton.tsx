
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const EmailTestButton = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!email) {
      setError("Veuillez saisir une adresse email");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log("Test envoi email simple pour:", email);
      
      const { data, error: functionError } = await supabase.functions.invoke('simple-email-invite', {
        body: { 
          email: email,
          userName: email.split('@')[0],
          userRole: 'sdr'
        }
      });

      if (functionError) {
        throw functionError;
      }

      console.log("Résultat test:", data);
      setResult(data);
    } catch (err: any) {
      console.error("Erreur test email:", err);
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Test Envoi Email Simple
        </CardTitle>
        <CardDescription>
          Test direct avec la nouvelle fonction simple qui utilise les méthodes natives Supabase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-email">Adresse email de test</Label>
          <Input
            id="test-email"
            type="email"
            placeholder="test@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <Button 
          onClick={handleTest} 
          disabled={isLoading || !email}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Test en cours...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Tester l'envoi
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Statut:</strong> {result.success ? "✅ Succès" : "❌ Échec"}</p>
                {result.message && <p><strong>Message:</strong> {result.message}</p>}
                {result.method && <p><strong>Méthode:</strong> {result.method}</p>}
                {result.userExists !== undefined && (
                  <p><strong>Utilisateur existant:</strong> {result.userExists ? "Oui" : "Non"}</p>
                )}
                {result.error && <p><strong>Erreur:</strong> {result.error}</p>}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> Cette fonction utilise le service email par défaut de Supabase.
            Vérifiez vos spams si vous ne recevez pas l'email.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default EmailTestButton;
