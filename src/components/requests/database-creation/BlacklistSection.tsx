
import { useState } from "react";
import { Control } from "react-hook-form";
import { Upload } from "lucide-react";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/requests/FileUploader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BlacklistSectionProps {
  control: Control<any>;
  blacklistAccountsTab: string;
  setBlacklistAccountsTab: (tab: string) => void;
  blacklistContactsTab: string;
  setBlacklistContactsTab: (tab: string) => void;
  handleFileUpload: (field: string, files: FileList | null | string) => void;
}

export const BlacklistSection = ({
  control,
  blacklistAccountsTab,
  setBlacklistAccountsTab,
  blacklistContactsTab,
  setBlacklistContactsTab,
  handleFileUpload
}: BlacklistSectionProps) => {
  const [uploading, setUploading] = useState(false);

  const handleBlacklistFileUpload = async (field: string, files: FileList | null | string) => {
    console.log(`BlacklistSection - handleBlacklistFileUpload appelé pour ${field}:`, { files, type: typeof files });
    setUploading(true);
    try {
      await handleFileUpload(field, files);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-t-4 border-t-red-500">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Blacklist</h3>
        
        <div className="space-y-6">
          {/* Blacklist d'entreprises */}
          <div>
            <h4 className="font-medium mb-2">Entreprises à exclure</h4>
            
            <Tabs value={blacklistAccountsTab} onValueChange={setBlacklistAccountsTab}>
              <TabsList className="mb-4 grid w-[400px] grid-cols-2">
                <TabsTrigger value="file">Fichier</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="file">
                <FormField
                  control={control}
                  name="blacklistAccountsFileUrls"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUploader
                          icon={<Upload className="h-6 w-6 text-muted-foreground" />}
                          title={uploading ? "Téléchargement en cours..." : "Importer votre fichier d'exclusions"}
                          description="Formats acceptés : XLS, XLSX, CSV (Max 10 Mo)"
                          value={field.value}
                          onChange={(files) => handleBlacklistFileUpload("blacklistAccountsFileUrls", files)}
                          accept=".xls,.xlsx,.csv"
                          maxSize={10}
                          disabled={uploading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="notes">
                <FormField
                  control={control}
                  name="blacklistAccountsNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Entrez les noms des entreprises à exclure, un par ligne"
                          className="min-h-[200px]"
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
          
          {/* Blacklist de contacts */}
          <div>
            <h4 className="font-medium mb-2">Contacts à exclure</h4>
            
            <Tabs value={blacklistContactsTab} onValueChange={setBlacklistContactsTab}>
              <TabsList className="mb-4 grid w-[400px] grid-cols-2">
                <TabsTrigger value="file">Fichier</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="file">
                <FormField
                  control={control}
                  name="blacklistEmailsFileUrls"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUploader
                          icon={<Upload className="h-6 w-6 text-muted-foreground" />}
                          title={uploading ? "Téléchargement en cours..." : "Importer votre fichier d'exclusions"}
                          description="Formats acceptés : XLS, XLSX, CSV (Max 10 Mo)"
                          value={field.value}
                          onChange={(files) => handleBlacklistFileUpload("blacklistEmailsFileUrls", files)}
                          accept=".xls,.xlsx,.csv"
                          maxSize={10}
                          disabled={uploading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="notes">
                <FormField
                  control={control}
                  name="blacklistEmailsNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Entrez les emails des contacts à exclure, un par ligne"
                          className="min-h-[200px]"
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
  );
};
