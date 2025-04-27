
import { useState, useEffect } from "react";
import { AcelleAccount } from "@/types/acelle.types";

export const useAcelleAccountsFilter = (accounts: AcelleAccount[]) => {
  const [filter, setFilter] = useState<string>("");
  const [filteredAccounts, setFilteredAccounts] = useState<AcelleAccount[]>([]);

  useEffect(() => {
    if (!filter) {
      setFilteredAccounts(accounts);
    } else {
      const filtered = accounts.filter(account => 
        account.name.toLowerCase().includes(filter.toLowerCase())
      );
      setFilteredAccounts(filtered);
    }
  }, [accounts, filter]);

  return {
    filter,
    setFilter,
    filteredAccounts
  };
};
