
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Eye, EyeOff, MoreHorizontal, Edit, Trash2, Shield, AlertCircle } from "lucide-react";
import { EmailPlatformAccount } from "@/types/emailPlatforms.types";
import { useAuth } from "@/contexts/AuthContext";
import { getDecryptedPassword } from "@/services/emailPlatforms/emailPlatformService";

interface EmailPlatformAccountCardProps {
  account: EmailPlatformAccount;
  onEdit?: (account: EmailPlatformAccount) => void;
  onDelete?: (accountId: string) => void;
}

export const EmailPlatformAccountCard = ({ 
  account, 
  onEdit, 
  onDelete 
}: EmailPlatformAccountCardProps) => {
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  const isAdmin = user?.role === 'admin';
  const isGrowth = user?.role === 'growth';
  const canViewSensitiveData = isAdmin || isGrowth;
  const canEdit = isAdmin || isGrowth;
  const canDelete = isAdmin;

  const getStatusColor = (status: string) => {
    return status === 'Actif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getSpfDkimColor = (status: string) => {
    switch (status) {
      case 'Oui': return 'bg-green-100 text-green-800';
      case 'En cours': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">
          {account.platform?.name || 'Plateforme inconnue'}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(account.status)}>
            {account.status}
          </Badge>
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(account)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
                {canDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(account.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Mission */}
        <div>
          <h4 className="font-medium text-sm text-gray-500 mb-1">Mission</h4>
          <p className="text-sm">
            {account.mission?.name} - {account.mission?.client}
          </p>
        </div>

        {/* Identifiants de connexion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-gray-500 mb-1">Login</h4>
            <p className="text-sm font-mono bg-gray-50 p-2 rounded">
              {account.login}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-500 mb-1">Mot de passe</h4>
            <div className="flex items-center gap-2">
              <p className="text-sm font-mono bg-gray-50 p-2 rounded flex-1">
                {showPassword 
                  ? getDecryptedPassword(account.password_encrypted)
                  : '••••••••'
                }
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="h-8 w-8 p-0"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Informations sensibles (uniquement pour admin/growth) */}
        {canViewSensitiveData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-1 mb-2 md:col-span-3">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-600">Informations sensibles</span>
            </div>
            
            {account.phone_number && (
              <div>
                <h4 className="font-medium text-xs text-gray-500 mb-1">Téléphone</h4>
                <p className="text-sm">{account.phone_number}</p>
              </div>
            )}
            
            {account.credit_card_name && (
              <div>
                <h4 className="font-medium text-xs text-gray-500 mb-1">Carte bancaire</h4>
                <p className="text-sm">
                  {account.credit_card_name}
                  {account.credit_card_last_four && ` •••• ${account.credit_card_last_four}`}
                </p>
              </div>
            )}
            
            {account.backup_email && (
              <div>
                <h4 className="font-medium text-xs text-gray-500 mb-1">Email de secours</h4>
                <p className="text-sm">{account.backup_email}</p>
              </div>
            )}
          </div>
        )}

        {/* Configuration technique */}
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div>
              <h4 className="font-medium text-sm text-gray-500 mb-1">SPF/DKIM</h4>
              <Badge className={getSpfDkimColor(account.spf_dkim_status)}>
                {account.spf_dkim_status}
              </Badge>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-gray-500 mb-1">IP dédiée</h4>
              <div className="flex items-center gap-2">
                <Badge variant={account.dedicated_ip ? "default" : "secondary"}>
                  {account.dedicated_ip ? 'Oui' : 'Non'}
                </Badge>
                {account.dedicated_ip && account.dedicated_ip_address && (
                  <span className="text-sm font-mono bg-gray-50 px-2 py-1 rounded">
                    {account.dedicated_ip_address}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Interfaces de routage */}
          <div>
            <h4 className="font-medium text-sm text-gray-500 mb-2">Interfaces de routage</h4>
            <div className="flex flex-wrap gap-2">
              {account.routing_interfaces.map((interface_name, index) => (
                <Badge key={index} variant="outline">
                  {interface_name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Front offices */}
          {account.front_offices && account.front_offices.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-500 mb-2">Front offices</h4>
              <div className="flex flex-wrap gap-2">
                {account.front_offices.map((frontOffice) => (
                  <Badge key={frontOffice.id} variant="secondary">
                    {frontOffice.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Accès limité pour SDR */}
        {!canViewSensitiveData && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="text-xs text-amber-700">
              Certaines informations sensibles sont masquées selon votre niveau d'accès
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
