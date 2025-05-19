
import React from 'react';
import { EmailCampaignRequest } from '@/types/types';
import { TemplateSection } from './sections/TemplateSection';
import { DatabaseSection } from './sections/DatabaseSection';
import { BlacklistSection } from './sections/BlacklistSection';

interface EmailCampaignDetailsProps {
  request: EmailCampaignRequest;
}

export const EmailCampaignDetails = ({ request }: EmailCampaignDetailsProps) => {
  console.log("EmailCampaignDetails - Rendering with request:", JSON.stringify(request, null, 2));
  
  // Ensure all required objects exist, even if empty
  const template = request.template || { content: "", webLink: "", fileUrl: "" };
  const database = request.database || { notes: "", webLink: "", fileUrl: "", webLinks: [] };
  const blacklist = request.blacklist || {
    accounts: { notes: "", fileUrl: "" },
    emails: { notes: "", fileUrl: "" }
  };
  
  // Make sure blacklist.accounts and blacklist.emails exist
  if (!blacklist.accounts) blacklist.accounts = { notes: "", fileUrl: "" };
  if (!blacklist.emails) blacklist.emails = { notes: "", fileUrl: "" };
  
  // Récupérer le type d'emailing, soit directement de la propriété emailType,
  // soit depuis details.emailType (selon l'endroit où il est stocké)
  const emailType = request.emailType || 
                    (request.details && typeof request.details === 'object' && 'emailType' in request.details ? 
                      request.details.emailType : 
                      "Mass email");

  return (
    <div className="space-y-6">
      {/* Ajout de la section Type d'emailing */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-2">Type d'emailing</h3>
        <p className="text-gray-700">{emailType}</p>
      </div>
      
      <TemplateSection template={template} />
      <DatabaseSection database={database} />
      <BlacklistSection blacklist={blacklist} />
    </div>
  );
};
