
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AcelleAccount } from "@/types/acelle.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw, Plus } from "lucide-react";
import { getAcelleAccounts, updateAcelleAccount } from "@/services/acelle/acelle-service";
import { ApiConnectionTester } from "./diagnostic/ApiConnectionTester";

export default function AcelleAccountsTable() {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  
  const { 
    data = [], 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ['acelleAccounts'],
    queryFn: getAcelleAccounts,
  });

  const handleToggleStatus = async (account: AcelleAccount) => {
    try {
      const newStatus = account.status === 'active' ? 'inactive' : 'active';
      await updateAcelleAccount({
        ...account,
        status: newStatus
      });
      refetch();
    } catch (error) {
      console.error("Error updating account status:", error);
    }
  };
  
  const selectedAccount = data.find(account => account.id === selectedAccountId);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Comptes Acelle Mail</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={() => setIsCreatingNew(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau compte
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>URL API</TableHead>
              <TableHead>Token API</TableHead>
              <TableHead>Dernière synchronisation</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Diagnostic</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((account: AcelleAccount) => (
              <TableRow key={account.id}>
                <TableCell>{account.name}</TableCell>
                <TableCell>
                  <span className="text-xs font-mono truncate max-w-[200px] inline-block">
                    {account.apiEndpoint}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-mono">
                    {account.apiToken ? `${account.apiToken.substring(0, 10)}...` : "Non défini"}
                  </span>
                </TableCell>
                <TableCell>
                  {account.lastSyncDate ? 
                    new Date(account.lastSyncDate).toLocaleString() : 
                    "Jamais"
                  }
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={account.status === 'active'}
                      onCheckedChange={() => handleToggleStatus(account)}
                    />
                    <Badge variant={account.status === 'active' ? "success" : "outline"}>
                      {account.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedAccountId(account.id)}
                  >
                    Tester
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Modifier
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            
            {data.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Aucun compte Acelle Mail configuré. Créez-en un pour commencer.
                </TableCell>
              </TableRow>
            )}
            
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                    Chargement des comptes...
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      
      <Dialog open={!!selectedAccountId} onOpenChange={(open) => !open && setSelectedAccountId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Test de connexion API</DialogTitle>
          </DialogHeader>
          
          {selectedAccount && (
            <ApiConnectionTester 
              account={selectedAccount} 
              onTestComplete={(success) => {
                if (success) {
                  setTimeout(() => setSelectedAccountId(null), 3000);
                }
              }}
            />
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAccountId(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Formulaire de création */}
      <Dialog open={isCreatingNew} onOpenChange={setIsCreatingNew}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau compte Acelle Mail</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <p className="text-muted-foreground">
              Formulaire de création du compte à implémenter
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingNew(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
