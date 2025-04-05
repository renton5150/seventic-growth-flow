
import { User } from "../types/types";

// Mock users
export const users: User[] = [
  {
    id: "user1",
    email: "admin@seventic.com",
    name: "Admin User",
    role: "admin",
    avatar: "https://ui-avatars.com/api/?name=Admin+User&background=7E69AB&color=fff",
  },
  {
    id: "user2",
    email: "sdr@seventic.com",
    name: "Sales Representative",
    role: "sdr",
    avatar: "https://ui-avatars.com/api/?name=Sales+Representative&background=7E69AB&color=fff",
  },
  {
    id: "user3",
    email: "growth@seventic.com",
    name: "Growth Manager",
    role: "growth",
    avatar: "https://ui-avatars.com/api/?name=Growth+Manager&background=7E69AB&color=fff",
  },
];

// Helper function to get user by ID
export const getUserById = (id: string): User | undefined => {
  return users.find((user) => user.id === id);
};

// Helper function for current user
export const getCurrentUser = (): User => {
  // For now, return an SDR user by default
  return users[1]; // SDR user
};
