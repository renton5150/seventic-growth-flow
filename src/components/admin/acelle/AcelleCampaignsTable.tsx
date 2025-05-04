
import React from "react";
import { AcelleAccount } from "@/types/acelle.types";
import { TableContainer } from "./campaigns-table/TableContainer";

interface AcelleCampaignsTableProps {
  account: AcelleAccount;
  onDemoMode?: (isDemoMode: boolean) => void;
}

export default function AcelleCampaignsTable({ account, onDemoMode }: AcelleCampaignsTableProps) {
  return (
    <TableContainer 
      account={account}
      onDemoMode={onDemoMode}
    />
  );
}
