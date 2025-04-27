
import { useState } from 'react';
import { AcelleAccount } from '@/types/acelle.types';

export const useAcelleAccountsFilter = (accounts: AcelleAccount[] = []) => {
  const [filter, setFilter] = useState('all');
  
  const filteredAccounts = accounts.filter((account) => {
    if (filter === 'all') return true;
    if (filter === 'active') return account.status === 'active';
    if (filter === 'inactive') return account.status === 'inactive';
    return true;
  });
  
  return {
    filter,
    setFilter,
    filteredAccounts
  };
};
