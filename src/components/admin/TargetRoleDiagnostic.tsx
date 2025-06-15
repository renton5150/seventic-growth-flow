
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, RefreshCw, Zap } from "lucide-react";
import { toast } from "sonner";
import { fixTargetRoleService } from "@/services/requests/fixTargetRoleService";

export const TargetRoleDiagnostic = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [fixing, setFixing] = useState(false);
  const [forceFix, setForceFix] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const currentStats = await fixTargetRoleService.checkTargetRoleStatus();
      setStats(currentStats);
      toast.success("Statut vérifié avec succès");
    } catch (error) {
      console.error("Erreur lors de la vérification:", error);
      toast.error("Erreur lors de la vérification des target_role");
    } finally {
      setLoading(false);
    }
  };

  const fixTargetRoles = async () => {
    setFixing(true);
    try {
      const result = await fixTargetRoleService.fixDatabaseAndLinkedInRequests();
      if (result.success) {
        toast.success(`${result.updatedCount} demandes mises à jour avec succès`);
        // Rafraîchir les stats
        await checkStatus();
      } else {
        toast.error(`Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error("Erreur lors de la correction:", error);
      toast.error("Erreur lors de la correction des target_role");
    } finally {
      setFixing(false);
    }
  };

  const forceFixAll = async () => {
    setForceFix(true);
    try {
      const result = await fixTargetRoleService.forceFixAllRequests();
      if (result.success) {
        toast.success(`🚨 CORRECTION FORCÉE: ${result.updatedCount} demandes mises à jour`);
        // Rafraîchir les stats
        await checkStatus();
      } else {
        toast.error(`Erreur lors de la correction forcée: ${result.error}`);
      }
    } catch (error) {
      console.error("Erreur lors de la correction forcée:", error);
      toast.error("Erreur lors de la correction forcée");
    } finally {
      setForceFix(false);
    }
  };

  const getStatusColor = (withoutTargetRole: number) => {
    return withoutTargetRole > 0 ? "destructive" : "default";
  };

  const getStatusIcon = (withoutTargetRole: number) => {
    return withoutTargetRole > 0 ? (
      <AlertTriangle className="h-4 w-4 text-red-500" />
    ) : (
      <CheckCircle className="h-4 w-4 text-green-500" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Diagnostic Target Role - Jefferson Lukombo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={checkStatus} disabled={loading}>
            {loading ? "Vérification..." : "Vérifier Status"}
          </Button>
          
          {stats && (stats.database.withoutTargetRole > 0 || stats.linkedin.withoutTargetRole > 0) && (
            <>
              <Button 
                onClick={fixTargetRoles} 
                disabled={fixing}
                variant="destructive"
              >
                {fixing ? "Correction..." : "Corriger Target Roles"}
              </Button>
              
              <Button 
                onClick={forceFixAll} 
                disabled={forceFix}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <Zap className="mr-1 h-4 w-4" />
                {forceFix ? "Correction forcée..." : "CORRECTION FORCÉE"}
              </Button>
            </>
          )}
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Database Requests */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Database</h3>
                {getStatusIcon(stats.database.withoutTargetRole)}
              </div>
              <div className="space-y-1 text-sm">
                <div>Total: <Badge variant="outline">{stats.database.total}</Badge></div>
                <div>Avec target_role: <Badge variant="default">{stats.database.withTargetRole}</Badge></div>
                <div>Sans target_role: <Badge variant={getStatusColor(stats.database.withoutTargetRole)}>{stats.database.withoutTargetRole}</Badge></div>
              </div>
            </div>

            {/* LinkedIn Requests */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">LinkedIn</h3>
                {getStatusIcon(stats.linkedin.withoutTargetRole)}
              </div>
              <div className="space-y-1 text-sm">
                <div>Total: <Badge variant="outline">{stats.linkedin.total}</Badge></div>
                <div>Avec target_role: <Badge variant="default">{stats.linkedin.withTargetRole}</Badge></div>
                <div>Sans target_role: <Badge variant={getStatusColor(stats.linkedin.withoutTargetRole)}>{stats.linkedin.withoutTargetRole}</Badge></div>
              </div>
            </div>

            {/* Email Requests */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Email</h3>
                {getStatusIcon(stats.email.withoutTargetRole)}
              </div>
              <div className="space-y-1 text-sm">
                <div>Total: <Badge variant="outline">{stats.email.total}</Badge></div>
                <div>Avec target_role: <Badge variant="default">{stats.email.withTargetRole}</Badge></div>
                <div>Sans target_role: <Badge variant={getStatusColor(stats.email.withoutTargetRole)}>{stats.email.withoutTargetRole}</Badge></div>
              </div>
            </div>
          </div>
        )}

        {stats && (stats.database.withoutTargetRole > 0 || stats.linkedin.withoutTargetRole > 0) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">🚨 Problème critique détecté</span>
            </div>
            <p className="text-red-700 text-sm mt-1">
              Des demandes de type Database ou LinkedIn (comme celles de Jefferson Lukombo) 
              n'ont pas de target_role défini. Elles ne remontent donc PAS vers l'équipe Growth !
            </p>
            <p className="text-red-700 text-sm mt-1 font-medium">
              ⚡ Utilisez la "CORRECTION FORCÉE" pour résoudre immédiatement le problème.
            </p>
          </div>
        )}

        {stats && stats.database.withoutTargetRole === 0 && stats.linkedin.withoutTargetRole === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">✅ Tout fonctionne correctement</span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              Toutes les demandes Database et LinkedIn remontent bien vers l'équipe Growth.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
