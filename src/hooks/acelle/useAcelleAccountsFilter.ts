
import { useState, useEffect } from "react";
import { AcelleAccount } from "@/types/acelle.types";

export const useAcelleAccountsFilter = (accounts: AcelleAccount[]) => {
  const [activeAccounts, setActiveAccounts] = useState<AcelleAccount[]>([]);

  useEffect(() => {
    const filteredAccounts = accounts.filter(acc => acc.status === "active");
    setActiveAccounts(filteredAccounts);
  }, [accounts]);

  return activeAccounts;
};
