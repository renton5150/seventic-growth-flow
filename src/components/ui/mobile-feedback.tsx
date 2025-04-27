
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';

export default function MobileFeedback() {
  const isMobile = useMobile();
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    // Afficher l'alerte mobile seulement après un court délai
    // et si c'est une nouvelle session
    if (isMobile) {
      const timer = setTimeout(() => {
        const hasSeenMobileMessage = localStorage.getItem('seen-mobile-message');
        if (!hasSeenMobileMessage) {
          setShow(true);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isMobile]);
  
  const handleDismiss = () => {
    localStorage.setItem('seen-mobile-message', 'true');
    setShow(false);
  };
  
  if (!show) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-yellow-100 p-4 z-50 animate-in fade-in slide-in-from-bottom">
      <div className="flex items-center justify-between">
        <p className="text-sm text-yellow-800">
          Cette application est optimisée pour les écrans d'ordinateur. Certaines fonctionnalités peuvent être limitées sur mobile.
        </p>
        <button 
          onClick={handleDismiss}
          className="ml-4 text-yellow-800 hover:text-yellow-900"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
