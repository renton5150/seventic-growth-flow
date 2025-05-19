
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DownloadFileButton } from '@/components/common/DownloadFileButton';
import { Blacklist } from '@/types/types';

interface BlacklistSectionProps {
  blacklist: Blacklist;
}

export const BlacklistSection = ({ blacklist }: BlacklistSectionProps) => {
  console.log("Rendu du composant BlacklistSection avec:", JSON.stringify(blacklist, null, 2));
  
  // Ensure blacklist and its properties exist to prevent errors
  const safeBlacklist = blacklist || {};
  const accounts = safeBlacklist.accounts || { notes: "", fileUrl: "" };
  const emails = safeBlacklist.emails || { notes: "", fileUrl: "" };
  
  // Si aucune donnée significative n'existe, ne pas afficher la section
  const hasAccounts = accounts.notes || accounts.fileUrl;
  const hasEmails = emails.notes || emails.fileUrl;
  
  if (!hasAccounts && !hasEmails) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste noire</CardTitle>
      </CardHeader>
      <CardContent>
        {hasAccounts && (
          <div className="mb-4">
            <h4 className="font-semibold text-sm">Comptes exclus</h4>
            {accounts.notes && <p className="mt-1">{accounts.notes}</p>}
            {accounts.fileUrl && (
              <DownloadFileButton 
                fileUrl={accounts.fileUrl} 
                fileName="blacklist-accounts.xlsx"
                label="Télécharger la liste de comptes"
                className="mt-2"
              />
            )}
          </div>
        )}
        
        {hasEmails && (
          <div>
            <h4 className="font-semibold text-sm">Emails exclus</h4>
            {emails.notes && <p className="mt-1">{emails.notes}</p>}
            {emails.fileUrl && (
              <DownloadFileButton 
                fileUrl={emails.fileUrl} 
                fileName="blacklist-emails.xlsx"
                label="Télécharger la liste d'emails"
                className="mt-2"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
