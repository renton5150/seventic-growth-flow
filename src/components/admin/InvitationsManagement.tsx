
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllInvitations } from "@/services/invitation/invitationService";
import { Copy, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const InvitationsManagement = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const { data: invitations = [], isLoading, refetch } = useQuery({
    queryKey: ['user-invitations'],
    queryFn: getAllInvitations,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleCopyInvitationUrl = async (token: string) => {
    const invitationUrl = `https://d5498fdf-9d30-4367-ace8-dffe1517b061.lovableproject.com/invite/${token}`;
    await navigator.clipboard.writeText(invitationUrl);
    setCopied(token);
    toast.success("Lien d'invitation copié");
    setTimeout(() => setCopied(null), 2000);
  };

  const getStatusBadge = (invitation: any) => {
    if (invitation.is_used) {
      return <Badge variant="secondary">Utilisée</Badge>;
    }
    
    const isExpired = new Date(invitation.expires_at) < new Date();
    if (isExpired) {
      return <Badge variant="destructive">Expirée</Badge>;
    }
    
    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-blue-100 text-blue-800">Admin</Badge>;
      case "growth":
        return <Badge className="bg-green-100 text-green-800">Growth</Badge>;
      case "sdr":
        return <Badge className="bg-purple-100 text-purple-800">SDR</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Invitations en cours</h3>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {invitations.length === 0 ? (
        <div className="text-center p-8 border rounded-md">
          <p className="text-muted-foreground">Aucune invitation trouvée</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créée le</TableHead>
                <TableHead>Expire le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation: any) => (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">{invitation.email}</TableCell>
                  <TableCell>{invitation.name}</TableCell>
                  <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                  <TableCell>{getStatusBadge(invitation)}</TableCell>
                  <TableCell>
                    {new Date(invitation.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {!invitation.is_used && new Date(invitation.expires_at) > new Date() && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyInvitationUrl(invitation.invitation_token)}
                        >
                          {copied === invitation.invitation_token ? (
                            "Copié !"
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              Copier
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
