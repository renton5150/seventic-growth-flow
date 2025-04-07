
import { createContext } from "react";
import { AuthContextType } from "./types";

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default AuthContext;
