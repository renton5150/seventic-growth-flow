
import { useCallback, useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserManagementTabs } from "@/components/admin/UserManagementTabs";
import { useAuth } from "@/contexts/auth";
import { Navigate } from "react-router-dom";
import { invalidateUserCache } from "@/services/user/userQueries";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const AdminUsers = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);
  const isRefreshingRef = useRef(false);
  const toastIdRef = useRef<string | number | null>(null);
  
  // Cleanup function for component unmount
  useEffect(() => {
    return () => {
      // Dismiss any lingering toasts when component unmounts
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, []);
  
  // Optimized function to refresh user data with debounce
  const refreshUserData = useCallback(() => {
    // Check if refresh is already in progress
    if (isRefreshingRef.current) {
      console.log("Refresh already in progress, ignoring");
      return;
    }
    
    console.log("Refreshing user data from AdminUsers");
    isRefreshingRef.current = true;
    
    try {
      // Invalidate local cache
      invalidateUserCache();
      
      // Show discreet refresh toast
      toastIdRef.current = toast.loading("Rafraîchissement...", {
        duration: 1000,
        position: "bottom-right"
      });
      
      // Update refresh key
      setRefreshKey(prev => prev + 1);
      
      // Invalidate queries with a delay to avoid concurrency issues
      setTimeout(() => {
        // Invalidate user queries
        queryClient.invalidateQueries({ 
          queryKey: ['users']
        });
        
        // Specifically invalidate admin-users data
        queryClient.invalidateQueries({ 
          queryKey: ['admin-users']
        });
        
        toast.success("Données rafraîchies", { 
          id: toastIdRef.current || undefined,
          duration: 1000
        });
        
        // Reset refresh state after sufficient time
        setTimeout(() => {
          isRefreshingRef.current = false;
          toastIdRef.current = null;
        }, 1500); // Wait 1.5 seconds before allowing another refresh
      }, 200);
    } catch (error) {
      console.error("Error refreshing data:", error);
      isRefreshingRef.current = false;
      toastIdRef.current = null;
      toast.error("Erreur lors du rafraîchissement");
    }
  }, [queryClient]);
  
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
        </div>
        
        <UserManagementTabs 
          key={`user-management-${refreshKey}`} 
          onUserDataChange={refreshUserData} 
        />
      </div>
    </AppLayout>
  );
};

export default AdminUsers;
