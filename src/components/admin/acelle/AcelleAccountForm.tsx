
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { testAcelleConnection } from "@/services/acelle/api/connection";
import { supabase } from "@/integrations/supabase/client";
import { AcelleAccount, AcelleConnectionDebug } from "@/types/acelle.types";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

interface AcelleAccountFormProps {
  account?: AcelleAccount;
  onSubmit: (formData: any) => Promise<void>;
  onCancel: () => void;
}

const AcelleAccountForm: React.FC<AcelleAccountFormProps> = ({ account, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    api_endpoint: "",
    api_token: "",
    status: "inactive",
    mission_id: "",
    cache_priority: 0
  });
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [missions, setMissions] = useState<{id: string, name: string}[]>([]);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<AcelleConnectionDebug | null>(null);

  // Charger les données initiales si on édite un compte existant
  useEffect(() => {
    const loadInitialData = async () => {
      if (account) {
        setFormData({
          name: account.name || "",
          api_endpoint: account.api_endpoint || "",
          api_token: account.api_token || "",
          status: account.status || "inactive",
          mission_id: account.mission_id || "",
          cache_priority: account.cache_priority || 0
        });
      }

      // Charger la liste des missions
      try {
        const { data, error } = await supabase
          .from("missions")
          .select("id, name")
          .order("name");

        if (error) throw error;
        setMissions(data || []);
      } catch (err) {
        console.error("Erreur lors du chargement des missions:", err);
        toast.error("Impossible de charger la liste des missions");
      }
    };

    loadInitialData();
  }, [account]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      console.error("Erreur lors de la soumission du formulaire:", err);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionTestResult(null);
    
    try {
      const testAccount: AcelleAccount = {
        ...account,
        id: account?.id || 'system-test',
        name: formData.name,
        api_endpoint: formData.api_endpoint,
        api_token: formData.api_token,
        status: 'inactive',
        created_at: new Date().toISOString(),
      } as AcelleAccount;
      
      const result = await testAcelleConnection(testAccount);
      setConnectionTestResult(result);
      
      if (result.success) {
        toast.success("Connexion à l'API réussie !");
        // Si le test est réussi, on met le statut à 'active'
        setFormData(prev => ({ ...prev, status: 'active' }));
      } else {
        toast.error(`Erreur de connexion: ${result.errorMessage || 'Problème de connexion inconnu'}`);
      }
    } catch (err) {
      console.error("Erreur lors du test de connexion:", err);
      toast.error("Erreur lors du test de connexion");
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-4">
          {account ? `Éditer ${account.name}` : "Créer un nouveau compte Acelle"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom du compte</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nom du compte"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="error">Erreur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="api_endpoint">URL de l'API Acelle</Label>
              <Input
                id="api_endpoint"
                name="api_endpoint"
                value={formData.api_endpoint}
                onChange={handleInputChange}
                placeholder="https://emailing.exemple.com/api/v1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="api_token">Token d'API</Label>
              <Input
                id="api_token"
                name="api_token"
                type="password"
                value={formData.api_token}
                onChange={handleInputChange}
                placeholder="Votre token d'API Acelle"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mission_id">Mission associée (optionnel)</Label>
                <Select
                  value={formData.mission_id}
                  onValueChange={(value) => handleSelectChange("mission_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une mission" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucune mission</SelectItem>
                    {missions.map((mission) => (
                      <SelectItem key={mission.id} value={mission.id}>
                        {mission.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="cache_priority">Priorité de cache</Label>
                <Input
                  id="cache_priority"
                  name="cache_priority"
                  type="number"
                  value={formData.cache_priority.toString()}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-2">
            <Label>Test de connexion</Label>
            <div className="flex items-center gap-4 mt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleTestConnection}
                disabled={!formData.api_endpoint || !formData.api_token || testingConnection}
              >
                {testingConnection ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Tester la connexion
              </Button>
              
              {connectionTestResult && (
                <div className="flex items-center">
                  {connectionTestResult.success ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-green-500">Connexion réussie</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-red-500">
                        Erreur: {connectionTestResult.errorMessage || "Connexion échouée"}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isFormSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isFormSubmitting}>
              {isFormSubmitting && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              {account ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AcelleAccountForm;
