
import { useState } from "react";
import { toast } from "sonner";

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = (
    setValue: (field: string, value: any) => void,
    field: string,
    files: FileList | null | string,
    options: {
      acceptedFormats?: string[];
      maxSize?: number; // in MB
    } = {}
  ) => {
    const { acceptedFormats = [], maxSize = 10 } = options;
    
    setUploading(true);
    
    try {
      // If files is a string (direct URL)
      if (typeof files === 'string') {
        setValue(field, files);
        setUploading(false);
        return;
      }
      
      // If files is a FileList
      if (files && files.length > 0) {
        const file = files[0];
        
        // Check file extension if acceptedFormats provided
        if (acceptedFormats.length > 0) {
          const fileExtension = file.name.split('.').pop()?.toLowerCase();
          if (!fileExtension || !acceptedFormats.includes(fileExtension)) {
            toast.error(`Format de fichier non supporté. Formats acceptés: ${acceptedFormats.join(', ')}`);
            setUploading(false);
            return;
          }
        }

        // Check file size
        if (maxSize && file.size > maxSize * 1024 * 1024) {
          toast.error(`Le fichier est trop volumineux (max ${maxSize}Mo)`);
          setUploading(false);
          return;
        }

        // Simulate upload (in a real implementation, we would upload to storage)
        const fileName = file.name;
        const fakeUrl = `uploads/${fileName}`;
        
        setTimeout(() => {
          toast.success(`Fichier ${fileName} téléchargé avec succès (mode démo)`);
          setValue(field, fakeUrl);
          
          // Trigger an event to refresh lists if needed
          window.dispatchEvent(new CustomEvent('file-uploaded', { detail: { field } }));
          setUploading(false);
        }, 800);
        
        return;
      }
      
      // If files is null (clearing)
      setValue(field, "");
      setUploading(false);
      
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      toast.error("Erreur lors du téléchargement du fichier");
      setUploading(false);
    }
  };

  return {
    uploading,
    handleFileUpload
  };
};
