
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Form } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { FormHeader } from "./database-creation/FormHeader";
import { TargetingSection } from "./database-creation/TargetingSection";
import { BlacklistSection } from "./database-creation/BlacklistSection";
import { FormFooter } from "./database-creation/FormFooter";
import { formSchema, FormData, defaultValues } from "./database-creation/schema";

export const DatabaseCreationForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [blacklistAccountsTab, setBlacklistAccountsTab] = useState("file");
  const [blacklistContactsTab, setBlacklistContactsTab] = useState("file");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    
    try {
      console.log("Données soumises:", data);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Demande de création de base créée avec succès");
      navigate("/dashboard");
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      toast.error("Erreur lors de la création de la demande");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = (field: string, files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      const fakeUrl = `uploads/${file.name}`;
      form.setValue(field as any, fakeUrl);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormHeader control={form.control} user={user} />
        <TargetingSection control={form.control} />
        <BlacklistSection 
          control={form.control} 
          blacklistAccountsTab={blacklistAccountsTab}
          setBlacklistAccountsTab={setBlacklistAccountsTab}
          blacklistContactsTab={blacklistContactsTab}
          setBlacklistContactsTab={setBlacklistContactsTab}
          handleFileUpload={handleFileUpload}
        />
        <FormFooter submitting={submitting} />
      </form>
    </Form>
  );
};
