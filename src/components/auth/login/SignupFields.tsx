
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Eye, EyeOff, UserPlus, Loader2 } from "lucide-react";

interface SignupFieldsProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  name: string;
  setName: (name: string) => void;
  showPassword: boolean;
  toggleShowPassword: () => void;
  isSubmitting: boolean;
  isOffline: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const SignupFields = ({
  email,
  setEmail,
  password,
  setPassword,
  name,
  setName,
  showPassword,
  toggleShowPassword,
  isSubmitting,
  isOffline,
  onSubmit
}: SignupFieldsProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
            required
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
          "Serveur non disponible"
        ) : (
          "S'inscrire"
        )}
      </Button>
    </form>
  );
};
