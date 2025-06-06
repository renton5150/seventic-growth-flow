
import { Eye, EyeOff, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmailPlatformAccount } from "@/types/emailPlatforms.types";
import { getDecryptedPassword } from "@/services/emailPlatforms/emailPlatformService";

interface EmailPlatformAccountsTableProps {
  accounts: EmailPlatformAccount[];
  onEdit: (account: EmailPlatformAccount) => void;
  onDelete: (accountId: string) => void;
}

export const EmailPlatformAccountsTable = ({
  accounts,
  onEdit,
  onDelete
}: EmailPlatformAccountsTableProps) => {
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const togglePasswordVisibility = (accountId: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'Actif' ? 'default' : 'destructive';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const getSpfDkimBadge = (status: string) => {
    let variant: "default" | "secondary" | "destructive" = 'secondary';
    if (status === 'Oui') variant = 'default';
    if (status === 'Non') variant = 'destructive';
    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mission</TableHead>
            <TableHead>Plateforme</TableHead>
            <TableHead>Login</TableHead>
            <TableHead>Mot de passe</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>SPF/DKIM</TableHead>
            <TableHead>IP dédiée</TableHead>
            <TableHead>Interfaces</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => {
            const isPasswordVisible = visiblePasswords.has(account.id);
            const decryptedPassword = account.password_encrypted 
              ? getDecryptedPassword(account.password_encrypted)
              : '';
            
            return (
              <TableRow key={account.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{account.mission?.name}</div>
                    <div className="text-sm text-muted-foreground">{account.mission?.client}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{account.platform?.name}</Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{account.login}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {isPasswordVisible ? decryptedPassword : '••••••••'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePasswordVisibility(account.id)}
                    >
                      {isPasswordVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(account.status)}</TableCell>
                <TableCell>{getSpfDkimBadge(account.spf_dkim_status)}</TableCell>
                <TableCell>
                  <div>
                    {account.dedicated_ip ? (
                      <div>
                        <Badge variant="default">Oui</Badge>
                        {account.dedicated_ip_address && (
                          <div className="text-xs text-muted-foreground mt-1 font-mono">
                            {account.dedicated_ip_address}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Badge variant="secondary">Non</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {account.routing_interfaces?.map((interface_name, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {interface_name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(account)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
