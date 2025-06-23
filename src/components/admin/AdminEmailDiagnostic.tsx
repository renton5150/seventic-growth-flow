
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import EmailTestButton from "./EmailTestButton";
import { AdminUserTools } from "./AdminUserTools";
import { AlertCircle, Settings, TestTube, Wrench } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AdminEmailDiagnostic = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Diagnostic Email - Étapes de dépannage
          </CardTitle>
          <CardDescription>
            Outils pour diagnostiquer les problèmes d'envoi d'emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Instructions de diagnostic</AlertTitle>
            <AlertDescription className="space-y-2">
              <p><strong>1. Test simple d'envoi d'email :</strong> Utilisez le bouton ci-dessous pour tester directement l'envoi via generateLink.</p>
              <p><strong>2. Test SMTP direct :</strong> Testez la connexion directe au serveur SMTP OVH.</p>
              <p><strong>3. Génération de liens manuels :</strong> Créez des liens d'authentification à partager manuellement.</p>
              <p><strong>4. Vérifiez les logs :</strong> Consultez les logs des fonctions Edge dans Supabase pour voir les détails.</p>
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
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Outils Avancés
            </h3>
            <AdminUserTools />
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Étapes suivantes si les tests échouent :</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Vérifiez les logs de la fonction test-email-simple dans Supabase</li>
              <li>Testez la fonction test-smtp-direct pour vérifier la connectivité OVH</li>
              <li>Vérifiez la configuration SMTP dans les paramètres Supabase Auth</li>
              <li>Utilisez la génération manuelle de liens comme solution temporaire</li>
              <li>Testez avec un autre email pour éliminer les problèmes spécifiques à un domaine</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEmailDiagnostic;
