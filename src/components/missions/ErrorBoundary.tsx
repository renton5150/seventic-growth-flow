
import React, { Component, ErrorInfo, ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MissionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Mission ErrorBoundary caught an error:", error, errorInfo);
    toast.error("Une erreur est survenue", {
      description: "Veuillez rafraîchir la page ou réessayer."
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Une erreur est survenue
          </h2>
          <p className="text-gray-600 mb-4 text-center">
            Une erreur inattendue s'est produite lors du chargement des missions.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="mb-2"
          >
            Rafraîchir la page
          </Button>
          <Button 
            variant="outline"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Réessayer
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
