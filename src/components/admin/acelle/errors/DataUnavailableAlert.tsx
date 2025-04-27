
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DataUnavailableAlertProps {
  message: string;
}

export function DataUnavailableAlert({ message }: DataUnavailableAlertProps) {
  return (
    <Alert variant="destructive" className="my-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Données indisponibles</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
