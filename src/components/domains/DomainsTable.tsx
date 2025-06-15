
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
import { Domain } from "@/types/domains.types";
import { getDecryptedDomainPassword } from "@/services/domains/domainService";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DomainsTableProps {
  domains: Domain[];
  onEdit: (domain: Domain) => void;
  onDelete: (domainId: string) => void;
}

interface ColumnFilters {
  mission: string;
  hosting_provider: string;
  status: string;
  domain_name: string;
}

export const DomainsTable = ({
  domains,
  onEdit,
  onDelete
}: DomainsTableProps) => {
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ColumnFilters>({
    mission: "",
    hosting_provider: "",
    status: "",
    domain_name: ""
  });

  const togglePasswordVisibility = (domainId: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(domainId)) {
        newSet.delete(domainId);
      } else {
        newSet.add(domainId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'Actif' ? 'default' : 'destructive';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d MMM yyyy", { locale: fr });
  };

  const isExpiringSoon = (expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const now = new Date();
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const now = new Date();
    return expDate < now;
  };

  // Get unique values for filter options
  const uniqueMissions = [...new Set(domains.map(d => d.mission?.name).filter(Boolean))];
  const uniqueProviders = [...new Set(domains.map(d => d.hosting_provider))];
  const uniqueStatuses = [...new Set(domains.map(d => d.status))];

  // Apply filters
  const filteredDomains = domains.filter(domain => {
    return (
      (!filters.mission || domain.mission?.name?.toLowerCase().includes(filters.mission.toLowerCase())) &&
      (!filters.hosting_provider || filters.hosting_provider === "all" || domain.hosting_provider === filters.hosting_provider) &&
      (!filters.status || filters.status === "all" || domain.status === filters.status) &&
      (!filters.domain_name || domain.domain_name.toLowerCase().includes(filters.domain_name.toLowerCase()))
    );
  });

  const updateFilter = (key: keyof ColumnFilters, value: string) => {
    const filterValue = value === "all" ? "" : value;
    setFilters(prev => ({ ...prev, [key]: filterValue }));
  };

  const clearAllFilters = () => {
    setFilters({
      mission: "",
      hosting_provider: "",
      status: "",
      domain_name: ""
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
            <Select value={filters[filterKey] || "all"} onValueChange={(value) => updateFilter(filterKey, value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
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
          {filteredDomains.length} domaine(s) affiché(s) sur {domains.length}
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
                  Nom de domaine
                  <FilterPopover 
                    title="Filtrer par domaine" 
                    filterKey="domain_name"
                  />
                </div>
              </TableHead>
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
                  Hébergeur
                  <FilterPopover 
                    title="Filtrer par hébergeur" 
                    filterKey="hosting_provider" 
                    options={uniqueProviders}
                  />
                </div>
              </TableHead>
              <TableHead>Login</TableHead>
              <TableHead>Mot de passe</TableHead>
              <TableHead>Date de création</TableHead>
              <TableHead>Date d'expiration</TableHead>
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
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDomains.map((domain) => {
              const isPasswordVisible = visiblePasswords.has(domain.id);
              const decryptedPassword = getDecryptedDomainPassword(domain.password_encrypted);
              
              return (
                <TableRow key={domain.id}>
                  <TableCell className="font-medium">{domain.domain_name}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{domain.mission?.name}</div>
                      <div className="text-sm text-muted-foreground">{domain.mission?.client}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{domain.hosting_provider}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{domain.login}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {isPasswordVisible ? decryptedPassword : '••••••••'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePasswordVisibility(domain.id)}
                      >
                        {isPasswordVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(domain.creation_date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {formatDate(domain.expiration_date)}
                      {isExpired(domain.expiration_date) && (
                        <Badge variant="destructive" className="text-xs">
                          Expiré
                        </Badge>
                      )}
                      {isExpiringSoon(domain.expiration_date) && !isExpired(domain.expiration_date) && (
                        <Badge variant="secondary" className="text-xs">
                          Expire bientôt
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(domain.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(domain)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(domain.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredDomains.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Aucun domaine ne correspond aux filtres appliqués
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
