
import { Eye, EyeOff, Edit, Trash2, Filter } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

interface ColumnFilters {
  mission: string;
  platform: string;
  login: string;
  status: string;
  spfDkim: string;
  dedicatedIp: string;
  interfaces: string;
}

export const EmailPlatformAccountsTable = ({
  accounts,
  onEdit,
  onDelete
}: EmailPlatformAccountsTableProps) => {
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ColumnFilters>({
    mission: "",
    platform: "",
    login: "",
    status: "",
    spfDkim: "",
    dedicatedIp: "",
    interfaces: ""
  });

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

  // Get unique values for filter options
  const uniqueMissions = [...new Set(accounts.map(a => a.mission?.name).filter(Boolean))];
  const uniquePlatforms = [...new Set(accounts.map(a => a.platform?.name).filter(Boolean))];
  const uniqueStatuses = [...new Set(accounts.map(a => a.status))];
  const uniqueSpfDkim = [...new Set(accounts.map(a => a.spf_dkim_status))];
  const uniqueInterfaces = [...new Set(accounts.flatMap(a => a.routing_interfaces || []))];

  // Apply filters
  const filteredAccounts = accounts.filter(account => {
    return (
      (!filters.mission || account.mission?.name?.toLowerCase().includes(filters.mission.toLowerCase())) &&
      (!filters.platform || account.platform?.name?.toLowerCase().includes(filters.platform.toLowerCase())) &&
      (!filters.login || account.login.toLowerCase().includes(filters.login.toLowerCase())) &&
      (!filters.status || account.status === filters.status) &&
      (!filters.spfDkim || account.spf_dkim_status === filters.spfDkim) &&
      (!filters.dedicatedIp || (filters.dedicatedIp === "Oui" ? account.dedicated_ip : !account.dedicated_ip)) &&
      (!filters.interfaces || account.routing_interfaces?.some(int => int.toLowerCase().includes(filters.interfaces.toLowerCase())))
    );
  });

  const updateFilter = (key: keyof ColumnFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      mission: "",
      platform: "",
      login: "",
      status: "",
      spfDkim: "",
      dedicatedIp: "",
      interfaces: ""
    });
  };

  const FilterPopover = ({ 
    title, 
    filterKey, 
    options 
  }: { 
    title: string;
    filterKey: keyof ColumnFilters;
    options?: string[];
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Filter className={`h-3 w-3 ${filters[filterKey] ? 'text-primary' : 'text-muted-foreground'}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">{title}</h4>
          {options ? (
            <Select value={filters[filterKey]} onValueChange={(value) => updateFilter(filterKey, value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                {options.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder="Filtrer..."
              value={filters[filterKey]}
              onChange={(e) => updateFilter(filterKey, e.target.value)}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {filteredAccounts.length} compte(s) affiché(s) sur {accounts.length}
        </div>
        <Button variant="outline" size="sm" onClick={clearAllFilters}>
          Effacer tous les filtres
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center justify-between">
                  Mission
                  <FilterPopover 
                    title="Filtrer par mission" 
                    filterKey="mission" 
                    options={uniqueMissions}
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center justify-between">
                  Plateforme
                  <FilterPopover 
                    title="Filtrer par plateforme" 
                    filterKey="platform" 
                    options={uniquePlatforms}
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center justify-between">
                  Login
                  <FilterPopover 
                    title="Filtrer par login" 
                    filterKey="login"
                  />
                </div>
              </TableHead>
              <TableHead>Mot de passe</TableHead>
              <TableHead>
                <div className="flex items-center justify-between">
                  Statut
                  <FilterPopover 
                    title="Filtrer par statut" 
                    filterKey="status" 
                    options={uniqueStatuses}
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center justify-between">
                  SPF/DKIM
                  <FilterPopover 
                    title="Filtrer par SPF/DKIM" 
                    filterKey="spfDkim" 
                    options={uniqueSpfDkim}
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center justify-between">
                  IP dédiée
                  <FilterPopover 
                    title="Filtrer par IP dédiée" 
                    filterKey="dedicatedIp" 
                    options={["Oui", "Non"]}
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center justify-between">
                  Interfaces
                  <FilterPopover 
                    title="Filtrer par interface" 
                    filterKey="interfaces" 
                    options={uniqueInterfaces}
                  />
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.map((account) => {
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
            {filteredAccounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Aucun compte ne correspond aux filtres appliqués
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
