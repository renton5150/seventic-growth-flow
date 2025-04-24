
import React from 'react';
import { EmailCampaignRequest } from '@/types/types';
import { TemplateDetails } from './email-campaign/TemplateDetails';
import { DatabaseDetails } from './email-campaign/DatabaseDetails';
import { BlacklistDetails } from './email-campaign/BlacklistDetails';

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
    <>
      <TemplateDetails template={template} />
      <DatabaseDetails database={database} />
      <BlacklistDetails blacklist={blacklist} />
    </>
  );
};
