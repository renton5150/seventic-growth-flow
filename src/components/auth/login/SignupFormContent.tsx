
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Eye, EyeOff, UserPlus, Loader2, Shield } from "lucide-react";

interface SignupFormContentProps {
  onSubmit: (email: string, password: string, name: string) => Promise<boolean>;
  isOffline: boolean;
  isAdminSignup?: boolean;
  onToggleAdminSignup?: () => void;
}

export const SignupFormContent = ({ 
  onSubmit, 
  isOffline, 
  isAdminSignup = false,
  onToggleAdminSignup
}: SignupFormContentProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(email, password, name);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom</Label>
        <div className="relative">
          <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            id="name"
            type="text"
            placeholder="Votre nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-10"
            disabled={isSubmitting || isOffline}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            id="email"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10"
            disabled={isSubmitting || isOffline}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-10"
            minLength={6}
            disabled={isSubmitting || isOffline}
          />
          <Button 
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3"
            onClick={toggleShowPassword}
            disabled={isSubmitting || isOffline}
          >
            {showPassword ? 
              <EyeOff className="h-4 w-4 text-gray-500" /> : 
              <Eye className="h-4 w-4 text-gray-500" />
            }
          </Button>
        </div>
      </div>
      
      {/* Option administrateur */}
      {onToggleAdminSignup && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="admin"
            checked={isAdminSignup}
            onCheckedChange={onToggleAdminSignup}
            disabled={isSubmitting || isOffline}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="admin"
              className="flex items-center text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              <Shield className="h-3 w-3 mr-1 text-seventic-500" /> 
              Créer un compte administrateur
            </Label>
          </div>
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full bg-seventic-500 hover:bg-seventic-600" 
        disabled={isSubmitting || isOffline}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
            Inscription en cours...
          </>
        ) : isOffline ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
            Vérification de la connexion...
          </>
        ) : (
          isAdminSignup ? "S'inscrire en tant qu'admin" : "S'inscrire"
        )}
      </Button>
    </form>
  );
};
