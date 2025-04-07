
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "@/services/user";
import { User, UserRole } from "@/types/types";

export const useUserManagement = () => {
  const [activeTab, setActiveTab] = useState<string>("all");
  
  const { 
    data: users = [], 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAllUsers,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 5000,
    retry: 2,
  });

  useEffect(() => {
    console.log("UserManagement hook mounted - refreshing data");
    const fetchData = async () => {
      await refetch();
      setTimeout(() => refetch(), 300);
      setTimeout(() => refetch(), 1000);
    };
    
    fetchData();
    
    const interval = setInterval(() => {
      refetch();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [refetch]);

  const filteredUsers = users.filter(user => {
    if (activeTab === "all") return true;
    return user.role === activeTab;
  });

  const handleUserInvited = async () => {
    console.log("Refreshing user list after invitation");
    
    await refetch();
    
    for (let i = 1; i <= 5; i++) {
      setTimeout(async () => {
        console.log(`Refresh #${i} after invitation`);
        await refetch();
      }, i * 500);
    }
    
    console.log("User count after invitation:", users.length);
  };

  return {
    activeTab,
    setActiveTab,
    users,
    filteredUsers,
    isLoading,
    refetch,
    handleUserInvited
  };
};
