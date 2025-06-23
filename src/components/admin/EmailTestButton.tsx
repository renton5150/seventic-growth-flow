
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, TestTube } from "lucide-react";

const EmailTestButton = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const testSimpleEmail = async () => {
    if (!email) {
      toast.error("Veuillez saisir un email");
      return;
    }

    setIsLoading(true);
    try {
      console.log("🧪 Test email simple pour:", email);
      
      const { data, error } = await supabase.functions.invoke('test-email-simple', {
        body: { email }
      });

      if (error) {
        console.error("Erreur lors du test:", error);
        toast.error(`Erreur: ${error.message}`);
        setLastResult({ success: false, error });
        return;
      }

      console.log("✅ Résultat du test:", data);
      setLastResult(data);
      
      if (data.success) {
        toast.success("Email de test envoyé avec succès !");
      } else {
        toast.error(`Échec: ${data.message}`);
      }
    } catch (err) {
      console.error("Exception lors du test:", err);
      toast.error("Erreur lors du test");
      setLastResult({ success: false, error: err });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Test Email Simple
        </CardTitle>
        <CardDescription>
          Tester l'envoi d'email directement via generateLink
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Email de test"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={testSimpleEmail}
            disabled={isLoading}
            size="sm"
          >
            <Mail className="h-4 w-4 mr-1" />
            {isLoading ? "Test..." : "Test"}
          </Button>
        </div>
        
        {lastResult && (
          <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
            <strong>Dernier résultat:</strong>
            <pre className="mt-1 whitespace-pre-wrap text-xs">
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailTestButton;
