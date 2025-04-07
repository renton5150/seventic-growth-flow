
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

interface LoginFieldsProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  showPassword: boolean;
  toggleShowPassword: () => void;
  isSubmitting: boolean;
  isOffline: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const LoginFields = ({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  toggleShowPassword,
  isSubmitting,
  isOffline,
  onSubmit
}: LoginFieldsProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Mot de passe</Label>
          <a href="/forgot-password" className="text-sm text-seventic-500 hover:text-seventic-600">
            Mot de passe oublié?
          </a>
        </div>
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
      <Button 
        type="submit" 
        className="w-full bg-seventic-500 hover:bg-seventic-600" 
        disabled={isSubmitting || isOffline}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
            Connexion en cours...
          </>
        ) : isOffline ? (
          "Serveur non disponible"
        ) : (
          "Se connecter"
        )}
      </Button>
      
      {isSubmitting && (
        <div className="text-sm text-center text-muted-foreground mt-2">
          <p>La connexion prend du temps?{" "} 
            <button 
              type="button" 
              onClick={() => window.location.reload()} 
              className="text-seventic-500 hover:underline ml-1">
              Actualiser la page
            </button>
          </p>
        </div>
      )}
    </form>
  );
};
