
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LinkedInScrapingForm } from "@/components/requests/LinkedInScrapingForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

const LinkedInScrapingRequest = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Nouvelle demande de scrapping LinkedIn</h1>
        </div>
        
        <LinkedInScrapingForm />
      </div>
    </AppLayout>
  );
};

export default LinkedInScrapingRequest;
