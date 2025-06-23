
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import EmailTestButton from "./EmailTestButton";
import { AlertCircle, TestTube } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AdminEmailDiagnostic = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Email Simple
          </CardTitle>
          <CardDescription>
            Test direct d'envoi d'email via la fonction Edge test-email-simple
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Instructions</AlertTitle>
            <AlertDescription className="space-y-2">
              <p><strong>Test d'envoi d'email :</strong> Utilisez le bouton ci-dessous pour tester directement l'envoi via generateLink.</p>
              <p><strong>Pour inviter des utilisateurs :</strong> Utilisez les boutons "Inviter un collaborateur" ou "Renvoyer l'invitation" dans l'onglet "Tous les utilisateurs".</p>
              <p><strong>Vérifiez les logs :</strong> Consultez les logs des fonctions Edge dans Supabase pour voir les détails.</p>
            </AlertDescription>
          </Alert>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Direct d'Envoi d'Email
            </h3>
            <EmailTestButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEmailDiagnostic;
