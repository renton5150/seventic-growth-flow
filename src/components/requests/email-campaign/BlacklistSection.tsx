import { useState } from "react";
import { Control } from "react-hook-form";
import { Upload } from "lucide-react";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/requests/FileUploader";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { uploadDatabaseFile } from "@/services/database";

interface BlacklistSectionProps {
  control: Control<any>;
  blacklistAccountsTab: string;
  setBlacklistAccountsTab: (tab: string) => void;
  blacklistEmailsTab: string;
  setBlacklistEmailsTab: (tab: string) => void;
  handleFileUpload: (field: string, files: FileList | null | string | string[]) => void;
}

export const BlacklistSection = ({ 
  control, 
  blacklistAccountsTab,
  setBlacklistAccountsTab,
  blacklistEmailsTab,
  setBlacklistEmailsTab,
  handleFileUpload 
}: BlacklistSectionProps) => {
  const [uploadingAccounts, setUploadingAccounts] = useState(false);
  const [uploadingEmails, setUploadingEmails] = useState(false);
  const { user } = useAuth();

  const handleMultipleAccountsFileUpload = async (
    files: FileList | null | string, 
    currentFiles: string[], 
    onChange: (files: string[]) => void
  ) => {
    if (!files || typeof files === 'string' || files.length === 0) {
      return;
    }

    const file = files[0];
    
    // Vérifier l'extension du fichier
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['csv', 'xls', 'xlsx'];
    
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      toast.error("Format de fichier non supporté. Utilisez CSV, XLS ou XLSX.");
      return;
    }

    // Vérifier la taille du fichier (max 10Mo)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 10Mo)");
      return;
    }

    if (!user || !user.id) {
      toast.error("Vous devez être connecté pour télécharger un fichier");
      return;
    }

    try {
      setUploadingAccounts(true);
      
      toast.loading("Téléchargement en cours...", { id: "accounts-file-upload" });
      
      const result = await uploadDatabaseFile(file);
      
      toast.dismiss("accounts-file-upload");
      
      if (result.success && result.fileUrl) {
        const newFiles = [...currentFiles, result.fileUrl];
        onChange(newFiles);
        toast.success(`Fichier ${file.name} téléchargé avec succès`);
      } else {
        toast.error(`Erreur lors du téléchargement du fichier: ${result.error || "Erreur inconnue"}`);
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast.error("Erreur lors du téléchargement du fichier");
      toast.dismiss("accounts-file-upload");
    } finally {
      setUploadingAccounts(false);
    }
  };

  const handleMultipleEmailsFileUpload = async (
    files: FileList | null | string, 
    currentFiles: string[], 
    onChange: (files: string[]) => void
  ) => {
    if (!files || typeof files === 'string' || files.length === 0) {
      return;
    }

    const file = files[0];
    
    // Vérifier l'extension du fichier
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['csv', 'xls', 'xlsx'];
    
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      toast.error("Format de fichier non supporté. Utilisez CSV, XLS ou XLSX.");
      return;
    }

    // Vérifier la taille du fichier (max 10Mo)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 10Mo)");
      return;
    }

    if (!user || !user.id) {
      toast.error("Vous devez être connecté pour télécharger un fichier");
      return;
    }

    try {
      setUploadingEmails(true);
      
      toast.loading("Téléchargement en cours...", { id: "emails-file-upload" });
      
      const result = await uploadDatabaseFile(file);
      
      toast.dismiss("emails-file-upload");
      
      if (result.success && result.fileUrl) {
        const newFiles = [...currentFiles, result.fileUrl];
        onChange(newFiles);
        toast.success(`Fichier ${file.name} téléchargé avec succès`);
      } else {
        toast.error(`Erreur lors du téléchargement du fichier: ${result.error || "Erreur inconnue"}`);
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast.error("Erreur lors du téléchargement du fichier");
      toast.dismiss("emails-file-upload");
    } finally {
      setUploadingEmails(false);
    }
  };

  const handleRemoveAccountsFile = (index: number, currentFiles: string[], onChange: (files: string[]) => void) => {
    const newFiles = currentFiles.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const handleRemoveEmailsFile = (index: number, currentFiles: string[], onChange: (files: string[]) => void) => {
    const newFiles = currentFiles.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const getFileName = (url: string): string => {
    if (!url) return "";
    
    try {
      const segments = url.split('/');
      const fileName = segments[segments.length - 1];
      const decodedFileName = decodeURIComponent(fileName);
      
      if (/^\d+_/.test(decodedFileName)) {
        const namePart = decodedFileName.split('_').slice(1).join('_');
        if (namePart) {
          return namePart;
        }
      }
      
      return decodedFileName;
    } catch (e) {
      return "fichier";
    }
  };

  return (
    <Card className="border-t-4 border-t-seventic-500">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Black liste</h3>

        <div className="space-y-6">
          <div>
            <h4 className="text-md font-medium mb-2">Comptes</h4>
            <Tabs value={blacklistAccountsTab} onValueChange={setBlacklistAccountsTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">Fichiers</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="file" className="pt-4">
                <FormField
                  control={control}
                  name="blacklistAccountsFileUrls"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-4">
                          {/* Fichiers existants */}
                          {field.value && field.value.length > 0 && (
                            <div className="space-y-2">
                              {field.value.map((fileUrl: string, index: number) => (
                                <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                                  <div className="flex-1">
                                    <span className="text-sm font-medium">{getFileName(fileUrl)}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAccountsFile(index, field.value || [], field.onChange)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                    disabled={uploadingAccounts}
                                  >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Uploader pour nouveau fichier */}
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <FileUploader
                              icon={<Upload className="h-6 w-6 text-muted-foreground" />}
                              title={uploadingAccounts ? "Téléchargement en cours..." : "Ajouter des comptes à exclure"}
                              description="Formats acceptés : XLS, XLSX, CSV (Max 10 Mo)"
                              value={undefined}
                              onChange={(files) => handleMultipleAccountsFileUpload(files, field.value || [], field.onChange)}
                              accept=".xls,.xlsx,.csv"
                              maxSize={10}
                              disabled={uploadingAccounts}
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="notes" className="pt-4">
                <FormField
                  control={control}
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

          <div>
            <h4 className="text-md font-medium mb-2">Emails</h4>
            <Tabs value={blacklistEmailsTab} onValueChange={setBlacklistEmailsTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">Fichiers</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="file" className="pt-4">
                <FormField
                  control={control}
                  name="blacklistEmailsFileUrls"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-4">
                          {/* Fichiers existants */}
                          {field.value && field.value.length > 0 && (
                            <div className="space-y-2">
                              {field.value.map((fileUrl: string, index: number) => (
                                <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                                  <div className="flex-1">
                                    <span className="text-sm font-medium">{getFileName(fileUrl)}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEmailsFile(index, field.value || [], field.onChange)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                    disabled={uploadingEmails}
                                  >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Uploader pour nouveau fichier */}
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <FileUploader
                              icon={<Upload className="h-6 w-6 text-muted-foreground" />}
                              title={uploadingEmails ? "Téléchargement en cours..." : "Ajouter des emails à exclure"}
                              description="Formats acceptés : XLS, XLSX, CSV (Max 10 Mo)"
                              value={undefined}
                              onChange={(files) => handleMultipleEmailsFileUpload(files, field.value || [], field.onChange)}
                              accept=".xls,.xlsx,.csv"
                              maxSize={10}
                              disabled={uploadingEmails}
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="notes" className="pt-4">
                <FormField
                  control={control}
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
  );
};
