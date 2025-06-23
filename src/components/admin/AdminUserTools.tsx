
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Mail, Link as LinkIcon, TestTube, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function AdminUserTools() {
  const [email, setEmail] = useState('');
  const [action, setAction] = useState('invite');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  // Générer un lien d'invitation ou de réinitialisation
  async function generateLink() {
    try {
      setLoading(true);
      setError(null);
      setLink('');
      
      const type = action === 'invite' ? 'invite' : 'recovery';
      
      console.log(`Génération d'un lien ${type} pour:`, email);
      
      const { data, error } = await supabase.auth.admin.generateLink({
        type,
        email,
        options: {
          redirectTo: `${window.location.origin}/auth-callback?type=${type}&email=${encodeURIComponent(email)}`
        }
      });
      
      if (error) throw error;
      
      setLink(data.properties?.action_link || '');
      toast.success(`Lien ${type} généré avec succès`);
    } catch (err: any) {
      console.error('Erreur génération lien:', err);
      setError(err.message);
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Tester l'envoi direct d'email via SMTP
  async function testDirectEmail() {
    try {
      setLoading(true);
      setTestResult(null);
      setError(null);
      
      const timestamp = new Date().toLocaleString('fr-FR');
      
      const { data, error } = await supabase.functions.invoke('test-smtp-direct', {
        body: { 
          email,
          subject: `Test email direct SMTP - ${timestamp}`,
          message: `Ceci est un test direct d'envoi d'email via SMTP OVH.
                   Heure: ${timestamp}
                   Email testé: ${email}`
        }
      });
      
      if (error) throw error;
      
      setTestResult(data);
      toast.success('Test SMTP effectué');
    } catch (err: any) {
      console.error('Erreur test SMTP direct:', err);
      setError(err.message);
      toast.error(`Erreur test SMTP: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Lien copié dans le presse-papiers');
    } catch (err) {
      toast.error('Erreur lors de la copie');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <TestTube className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Outils d'administration utilisateurs</h2>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Génération directe de liens
          </CardTitle>
          <CardDescription>
            Génère des liens d'authentification sans passer par l'envoi d'email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Email utilisateur</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemple.com"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Type d'action</label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invite">Invitation utilisateur</SelectItem>
                  <SelectItem value="recovery">Réinitialisation mot de passe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={generateLink}
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? 'Génération...' : 'Générer le lien'}
          </Button>
          
          {link && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Lien généré avec succès
              </h4>
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={link}
                  className="text-xs"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(link)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Alert>
                <AlertDescription>
                  Partagez ce lien avec l'utilisateur via un canal alternatif (Teams, WhatsApp, etc.)
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Test direct SMTP OVH
          </CardTitle>
          <CardDescription>
            Teste l'envoi direct d'email via le serveur SMTP OVH sans passer par Supabase Auth
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ce test vérifie la connectivité avec le serveur SMTP ssl0.ovh.net
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={testDirectEmail}
            disabled={loading || !email}
            className="w-full"
            variant="outline"
          >
            {loading ? 'Test en cours...' : 'Tester l\'envoi direct SMTP'}
          </Button>
          
          {testResult && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Résultat du test SMTP:</h4>
              <pre className="text-xs bg-white p-3 rounded border overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
