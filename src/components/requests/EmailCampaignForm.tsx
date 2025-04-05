
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarIcon, Upload, Link, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { FileUploader } from "@/components/requests/FileUploader";
import { cn } from "@/lib/utils";
import { mockData } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  missionId: z.string().min(1, "Veuillez sélectionner une mission"),
  dueDate: z.date({ required_error: "Veuillez sélectionner une date" }),
  templateContent: z.string().optional(),
  templateFileUrl: z.string().optional(),
  templateWebLink: z.string().optional(),
  databaseFileUrl: z.string().optional(),
  databaseWebLink: z.string().optional(),
  databaseNotes: z.string().optional(),
  blacklistAccountsFileUrl: z.string().optional(),
  blacklistAccountsNotes: z.string().optional(),
  blacklistEmailsFileUrl: z.string().optional(),
  blacklistEmailsNotes: z.string().optional(),
}).refine(data => {
  // Au moins un champ template doit être rempli
  return !!data.templateContent || !!data.templateFileUrl || !!data.templateWebLink;
}, {
  message: "Veuillez fournir un template via le contenu, un fichier ou un lien web",
  path: ["templateContent"],
}).refine(data => {
  // Au moins un champ database doit être rempli
  return !!data.databaseFileUrl || !!data.databaseWebLink || !!data.databaseNotes;
}, {
  message: "Veuillez fournir une base de données via un fichier, un lien ou des notes explicatives",
  path: ["databaseFileUrl"],
});

type FormData = z.infer<typeof formSchema>;

export const EmailCampaignForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [templateTab, setTemplateTab] = useState("text");
  const [databaseTab, setDatabaseTab] = useState("file");
  const [blacklistAccountsTab, setBlacklistAccountsTab] = useState("file");
  const [blacklistEmailsTab, setBlacklistEmailsTab] = useState("file");

  // Initialisation du formulaire
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      missionId: "",
      templateContent: "",
      templateFileUrl: "",
      templateWebLink: "",
      databaseFileUrl: "",
      databaseWebLink: "",
      databaseNotes: "",
      blacklistAccountsFileUrl: "",
      blacklistAccountsNotes: "",
      blacklistEmailsFileUrl: "",
      blacklistEmailsNotes: "",
    },
  });

  // Filtre les missions de l'utilisateur courant
  const userMissions = mockData.missions.filter(
    mission => mission.sdrId === user?.id
  );

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    
    try {
      // Simuler un envoi de données au backend
      console.log("Données soumises:", data);
      
      // Dans une application réelle, vous appelleriez une API ici pour enregistrer les données
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Succès
      toast.success("Demande de campagne email créée avec succès");
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
      // Dans une application réelle, vous utiliseriez un service de stockage ici
      const file = files[0];
      const fakeUrl = `uploads/${file.name}`; // URL fictive
      form.setValue(field as any, fakeUrl);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titre de la campagne</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Newsletter Mars 2025" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="missionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mission client</FormLabel>
                <FormControl>
                  <select
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    )}
                    {...field}
                  >
                    <option value="" disabled>
                      Sélectionnez une mission
                    </option>
                    {userMissions.map((mission) => (
                      <option key={mission.id} value={mission.id}>
                        {mission.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date d'envoi souhaitée</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "d MMMM yyyy", { locale: fr })
                      ) : (
                        <span>Sélectionnez une date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Section Template */}
        <Card className="border-t-4 border-t-seventic-500">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Template de l'emailing</h3>
            
            <Tabs value={templateTab} onValueChange={setTemplateTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text">Contenu</TabsTrigger>
                <TabsTrigger value="file">Fichier</TabsTrigger>
                <TabsTrigger value="link">Lien web</TabsTrigger>
              </TabsList>
              
              <TabsContent value="text" className="pt-4">
                <FormField
                  control={form.control}
                  name="templateContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="Collez ici le contenu de votre template (HTML ou texte brut)" 
                          className="min-h-[200px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="file" className="pt-4">
                <FormField
                  control={form.control}
                  name="templateFileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUploader
                          icon={<Upload className="h-6 w-6 text-muted-foreground" />}
                          title="Importer votre template"
                          description="Formats acceptés : DOC, DOCX, HTML (Max 10 Mo)"
                          value={field.value}
                          onChange={(files) => handleFileUpload("templateFileUrl", files)}
                          accept=".doc,.docx,.html,.htm"
                          maxSize={10}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="link" className="pt-4">
                <FormField
                  control={form.control}
                  name="templateWebLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Link className="h-5 w-5 text-muted-foreground" />
                          <Input 
                            placeholder="https://example.com/template" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Section Base de données */}
        <Card className="border-t-4 border-t-seventic-500">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Base de données</h3>
            
            <Tabs value={databaseTab} onValueChange={setDatabaseTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="file">Fichier</TabsTrigger>
                <TabsTrigger value="link">Lien web</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="file" className="pt-4">
                <FormField
                  control={form.control}
                  name="databaseFileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUploader
                          icon={<Upload className="h-6 w-6 text-muted-foreground" />}
                          title="Importer votre base de données"
                          description="Formats acceptés : XLS, XLSX, CSV (Max 50 Mo)"
                          value={field.value}
                          onChange={(files) => handleFileUpload("databaseFileUrl", files)}
                          accept=".xls,.xlsx,.csv"
                          maxSize={50}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="link" className="pt-4">
                <FormField
                  control={form.control}
                  name="databaseWebLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Link className="h-5 w-5 text-muted-foreground" />
                          <Input 
                            placeholder="https://example.com/database" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="notes" className="pt-4">
                <FormField
                  control={form.control}
                  name="databaseNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="Donnez des indications sur la base à utiliser" 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Section Black Liste */}
        <Card className="border-t-4 border-t-seventic-500">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Black liste</h3>

            <div className="space-y-6">
              {/* Black Liste - Comptes */}
              <div>
                <h4 className="text-md font-medium mb-2">Comptes</h4>
                <Tabs value={blacklistAccountsTab} onValueChange={setBlacklistAccountsTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file">Fichier</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="file" className="pt-4">
                    <FormField
                      control={form.control}
                      name="blacklistAccountsFileUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <FileUploader
                              icon={<Upload className="h-6 w-6 text-muted-foreground" />}
                              title="Importer votre liste de comptes à exclure"
                              description="Formats acceptés : XLS, XLSX, CSV"
                              value={field.value}
                              onChange={(files) => handleFileUpload("blacklistAccountsFileUrl", files)}
                              accept=".xls,.xlsx,.csv"
                              maxSize={10}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  <TabsContent value="notes" className="pt-4">
                    <FormField
                      control={form.control}
                      name="blacklistAccountsNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              placeholder="Précisez les comptes à exclure" 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
              </div>

              {/* Black Liste - Emails */}
              <div>
                <h4 className="text-md font-medium mb-2">Emails</h4>
                <Tabs value={blacklistEmailsTab} onValueChange={setBlacklistEmailsTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file">Fichier</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="file" className="pt-4">
                    <FormField
                      control={form.control}
                      name="blacklistEmailsFileUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <FileUploader
                              icon={<Upload className="h-6 w-6 text-muted-foreground" />}
                              title="Importer votre liste d'emails à exclure"
                              description="Formats acceptés : XLS, XLSX, CSV"
                              value={field.value}
                              onChange={(files) => handleFileUpload("blacklistEmailsFileUrl", files)}
                              accept=".xls,.xlsx,.csv"
                              maxSize={10}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  <TabsContent value="notes" className="pt-4">
                    <FormField
                      control={form.control}
                      name="blacklistEmailsNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              placeholder="Précisez les emails à exclure" 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" type="button" onClick={() => navigate(-1)}>
            Annuler
          </Button>
          <Button 
            type="submit" 
            className="bg-seventic-500 hover:bg-seventic-600"
            disabled={submitting}
          >
            {submitting ? "Création en cours..." : "Créer la demande"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
