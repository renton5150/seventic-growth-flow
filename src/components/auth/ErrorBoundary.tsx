
import { Component, ErrorInfo, ReactNode } from "react";
import { toast } from "sonner";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Mettre à jour l'état pour afficher l'UI de secours
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Journaliser l'erreur
    console.error("Erreur capturée par ErrorBoundary:", error);
    console.error("Détails de l'erreur:", errorInfo);
    
    // Afficher une notification
    toast.error("Une erreur est survenue", {
      description: "L'application a rencontré une erreur inattendue."
    });
  }

  // Tentative de récupération
  tryRecover = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Afficher l'UI de secours ou le fallback personnalisé
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-50">
          <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Une erreur est survenue</h2>
            <p className="text-gray-700 mb-4">
              L'application a rencontré une erreur inattendue. Veuillez essayer de rafraîchir la page.
            </p>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto mb-4 max-h-40">
              {this.state.error?.message || "Erreur inconnue"}
            </pre>
            <div className="flex space-x-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-seventic-500 text-white rounded hover:bg-seventic-600"
              >
                Rafraîchir la page
              </button>
              <button
                onClick={this.tryRecover}
                className="px-4 py-2 border border-seventic-500 text-seventic-500 rounded hover:bg-seventic-100"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Si pas d'erreur, afficher les enfants normalement
    return this.props.children;
  }
}

export default ErrorBoundary;
