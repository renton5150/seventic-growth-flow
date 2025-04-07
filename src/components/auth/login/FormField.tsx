
import { ReactNode } from "react";
import { FormControl, FormField as UIFormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { Control } from "react-hook-form";

interface FormFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  icon?: ReactNode;
  isPassword?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  autoComplete?: string;
}

export const FormField = ({ 
  control, 
  name, 
  label, 
  placeholder, 
  type = "text", 
  disabled = false,
  icon,
  isPassword = false,
  showPassword = false,
  onTogglePassword,
  autoComplete
}: FormFieldProps) => {
  return (
    <UIFormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <div className="flex items-center justify-between">
            <FormLabel htmlFor={name}>{label}</FormLabel>
            {name === "password" && (
              <a href="#" className="text-sm text-seventic-500 hover:text-seventic-600">
                Mot de passe oublié?
              </a>
            )}
          </div>
          <div className="relative">
            {icon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {icon}
              </div>
            )}
            <FormControl>
              <Input
                {...field}
                id={name}
                type={isPassword ? (showPassword ? "text" : "password") : type}
                placeholder={placeholder}
                disabled={disabled}
                className={icon ? "pl-10" : ""}
                autoComplete={autoComplete}
              />
            </FormControl>
            {isPassword && onTogglePassword && (
              <Button 
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={onTogglePassword}
                disabled={disabled}
              >
                {showPassword ? 
                  <EyeOff className="h-4 w-4 text-gray-500" /> : 
                  <Eye className="h-4 w-4 text-gray-500" />
                }
              </Button>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
