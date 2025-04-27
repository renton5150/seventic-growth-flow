
import React from 'react';
import { EmailCampaignRequest } from '@/types/types';
import { TemplateSection } from './sections/TemplateDetails';
import { DatabaseSection } from './sections/DatabaseSection';
import { BlacklistSection } from './sections/BlacklistSection';

interface EmailCampaignDetailsProps {
  request: EmailCampaignRequest;
}

export const EmailCampaignDetails = ({ request }: EmailCampaignDetailsProps) => {
  const template = request.template || { content: "", webLink: "", fileUrl: "" };
  const database = request.database || { notes: "", webLink: "", fileUrl: "" };
  const blacklist = request.blacklist || {
    accounts: { notes: "", fileUrl: "" },
    emails: { notes: "", fileUrl: "" }
  };

  return (
    <div className="space-y-6">
      <TemplateSection template={template} />
      <DatabaseSection database={database} />
      <BlacklistSection blacklist={blacklist} />
    </div>
  );
};
