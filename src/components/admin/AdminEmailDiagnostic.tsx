
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import EmailTestButton from "./EmailTestButton";
import { AlertCircle, Settings, TestTube } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AdminEmailDiagnostic = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Diagnostic Email - Tests de base
          </CardTitle>
          <CardDescription>
            Outils pour tester l'envoi d'emails via generateLink
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Instructions de diagnostic</AlertTitle>
            <AlertDescription className="space-y-2">
              <p><strong>Pour inviter/renvoyer une invitation :</strong> Utilisez les boutons "Inviter un collaborateur" ou "Renvoyer l'invitation" dans l'onglet "Tous les utilisateurs".</p>
              <p><strong>Test simple d'envoi :</strong> Utilisez le bouton ci-dessous pour tester directement l'envoi via generateLink.</p>
              <p><strong>Vérifiez les logs :</strong> Consultez les logs des fonctions Edge dans Supabase pour voir les détails.</p>
            </AlertDescription>
          </Alert>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Email Simple
            </h3>
            <EmailTestButton />
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Étapes de dépannage :</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Utilisez "Inviter un collaborateur" pour les nouveaux utilisateurs</li>
              <li>Utilisez "Renvoyer l'invitation" pour les utilisateurs existants</li>
              <li>Vérifiez les logs de la fonction resend-invitation dans Supabase</li>
              <li>Testez avec un autre email pour éliminer les problèmes spécifiques à un domaine</li>
              <li>Utilisez le test simple ci-dessus pour vérifier la connectivité</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEmailDiagnostic;
