
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
  const accounts = safeBlacklist.accounts || { notes: "", fileUrl: "", fileUrls: [] };
  const emails = safeBlacklist.emails || { notes: "", fileUrl: "", fileUrls: [] };
  
  // Si aucune donnée significative n'existe, ne pas afficher la section
  const hasAccounts = accounts.notes || accounts.fileUrl || (accounts.fileUrls && accounts.fileUrls.length > 0);
  const hasEmails = emails.notes || emails.fileUrl || (emails.fileUrls && emails.fileUrls.length > 0);
  
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
            
            {/* Gérer les fichiers multiples */}
            {accounts.fileUrls && accounts.fileUrls.length > 0 ? (
              <div className="mt-2 space-y-2">
                {accounts.fileUrls.map((fileUrl, index) => (
                  <DownloadFileButton 
                    key={index}
                    fileUrl={fileUrl} 
                    fileName={`blacklist-accounts-${index + 1}.xlsx`}
                    label={`Télécharger la liste de comptes ${index + 1}`}
                    className="block"
                  />
                ))}
              </div>
            ) : accounts.fileUrl && (
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
            
            {/* Gérer les fichiers multiples */}
            {emails.fileUrls && emails.fileUrls.length > 0 ? (
              <div className="mt-2 space-y-2">
                {emails.fileUrls.map((fileUrl, index) => (
                  <DownloadFileButton 
                    key={index}
                    fileUrl={fileUrl} 
                    fileName={`blacklist-emails-${index + 1}.xlsx`}
                    label={`Télécharger la liste d'emails ${index + 1}`}
                    className="block"
                  />
                ))}
              </div>
            ) : emails.fileUrl && (
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
