
import { AppLayout } from "@/components/layout/AppLayout";
import { LinkedInScrapingForm } from "@/components/requests/LinkedInScrapingForm";

const LinkedInScrapingRequest = () => {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Nouvelle demande de scrapping LinkedIn</h1>
        <LinkedInScrapingForm />
      </div>
    </AppLayout>
  );
};

export default LinkedInScrapingRequest;
