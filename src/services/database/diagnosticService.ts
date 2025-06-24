
import { supabase } from "@/integrations/supabase/client";

interface FileReference {
  requestId: string;
  requestTitle: string;
  fileUrl: string;
  fileName: string;
  type: 'blacklist_accounts' | 'blacklist_emails' | 'template' | 'database';
}

interface StorageFile {
  bucket: string;
  name: string;
  size: number;
  lastModified: string;
}

interface DiagnosticResult {
  orphanedReferences: FileReference[];
  potentialMatches: Array<{
    reference: FileReference;
    candidates: Array<{
      file: StorageFile;
      similarity: number;
    }>;
  }>;
  storageFiles: StorageFile[];
}

/**
 * Normalise un nom de fichier pour la comparaison
 */
const normalizeFileName = (filename: string): string => {
  return filename
    .toLowerCase()
    .replace(/^temp_\d+_/, '') // Supprimer le préfixe temp_timestamp_
    .replace(/\.(xlsx?|csv|txt)$/i, '') // Supprimer l'extension
    .replace(/[_\-\s\.]+/g, ' ') // Remplacer les séparateurs par des espaces
    .trim();
};

/**
 * Calcule la similarité entre deux chaînes
 */
const calculateStringSimilarity = (str1: string, str2: string): number => {
  const norm1 = normalizeFileName(str1);
  const norm2 = normalizeFileName(str2);
  
  // Similarité basée sur les mots communs
  const words1 = norm1.split(' ').filter(w => w.length >= 2);
  const words2 = norm2.split(' ').filter(w => w.length >= 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(word => 
    words2.some(w => w.includes(word) || word.includes(w))
  );
  
  return commonWords.length / Math.max(words1.length, words2.length);
};

/**
 * Extrait toutes les références de fichiers depuis les requêtes
 */
const extractFileReferences = async (): Promise<FileReference[]> => {
  const { data: requests, error } = await supabase
    .from('requests')
    .select('id, title, details')
    .not('details', 'is', null);
  
  if (error) {
    console.error('Erreur lors de la récupération des requêtes:', error);
    return [];
  }
  
  const references: FileReference[] = [];
  
  for (const request of requests) {
    const details = request.details as any;
    
    // Fichiers de blacklist
    if (details.blacklist) {
      if (details.blacklist.accounts?.fileUrl) {
        references.push({
          requestId: request.id,
          requestTitle: request.title,
          fileUrl: details.blacklist.accounts.fileUrl,
          fileName: extractFileNameFromUrl(details.blacklist.accounts.fileUrl),
          type: 'blacklist_accounts'
        });
      }
      
      if (details.blacklist.accounts?.fileUrls) {
        for (const fileUrl of details.blacklist.accounts.fileUrls) {
          references.push({
            requestId: request.id,
            requestTitle: request.title,
            fileUrl,
            fileName: extractFileNameFromUrl(fileUrl),
            type: 'blacklist_accounts'
          });
        }
      }
      
      if (details.blacklist.emails?.fileUrl) {
        references.push({
          requestId: request.id,
          requestTitle: request.title,
          fileUrl: details.blacklist.emails.fileUrl,
          fileName: extractFileNameFromUrl(details.blacklist.emails.fileUrl),
          type: 'blacklist_emails'
        });
      }
      
      if (details.blacklist.emails?.fileUrls) {
        for (const fileUrl of details.blacklist.emails.fileUrls) {
          references.push({
            requestId: request.id,
            requestTitle: request.title,
            fileUrl,
            fileName: extractFileNameFromUrl(fileUrl),
            type: 'blacklist_emails'
          });
        }
      }
    }
    
    // Fichiers de template
    if (details.template?.fileUrl) {
      references.push({
        requestId: request.id,
        requestTitle: request.title,
        fileUrl: details.template.fileUrl,
        fileName: extractFileNameFromUrl(details.template.fileUrl),
        type: 'template'
      });
    }
    
    // Fichiers de base de données
    if (details.database?.fileUrl) {
      references.push({
        requestId: request.id,
        requestTitle: request.title,
        fileUrl: details.database.fileUrl,
        fileName: extractFileNameFromUrl(details.database.fileUrl),
        type: 'database'
      });
    }
  }
  
  return references;
};

/**
 * Extrait le nom de fichier d'une URL
 */
const extractFileNameFromUrl = (url: string): string => {
  if (!url) return '';
  
  const segments = url.split('/');
  let fileName = segments[segments.length - 1];
  
  if (fileName.includes('?')) {
    fileName = fileName.split('?')[0];
  }
  
  return decodeURIComponent(fileName);
};

/**
 * Liste tous les fichiers dans tous les buckets de stockage
 */
const listAllStorageFiles = async (): Promise<StorageFile[]> => {
  const buckets = ['blacklists', 'requests', 'databases', 'templates'];
  const allFiles: StorageFile[] = [];
  
  for (const bucket of buckets) {
    try {
      const { data: files, error } = await supabase.storage
        .from(bucket)
        .list('', { limit: 1000 });
      
      if (!error && files) {
        for (const file of files) {
          allFiles.push({
            bucket,
            name: file.name,
            size: file.metadata?.size || 0,
            lastModified: file.updated_at || file.created_at || ''
          });
        }
      }
    } catch (err) {
      console.error(`Erreur lors de la liste des fichiers du bucket ${bucket}:`, err);
    }
  }
  
  return allFiles;
};

/**
 * Fonction principale de diagnostic
 */
export const diagnoseDatabaseFiles = async (): Promise<DiagnosticResult> => {
  console.log('🔍 Début du diagnostic des fichiers...');
  
  // Récupérer toutes les références et tous les fichiers
  const [references, storageFiles] = await Promise.all([
    extractFileReferences(),
    listAllStorageFiles()
  ]);
  
  console.log(`📊 Trouvé ${references.length} références de fichiers et ${storageFiles.length} fichiers dans le stockage`);
  
  const orphanedReferences: FileReference[] = [];
  const potentialMatches: DiagnosticResult['potentialMatches'] = [];
  
  // Analyser chaque référence
  for (const ref of references) {
    // Chercher une correspondance exacte
    const exactMatch = storageFiles.find(file => 
      file.name === ref.fileName || 
      file.name === ref.fileUrl ||
      ref.fileUrl.includes(file.name)
    );
    
    if (exactMatch) {
      console.log(`✅ Match exact trouvé pour ${ref.fileName}: ${exactMatch.name} dans ${exactMatch.bucket}`);
      continue;
    }
    
    // Chercher des correspondances potentielles
    const candidates = storageFiles
      .map(file => ({
        file,
        similarity: calculateStringSimilarity(ref.fileName, file.name)
      }))
      .filter(candidate => candidate.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3); // Top 3 candidats
    
    if (candidates.length > 0) {
      potentialMatches.push({
        reference: ref,
        candidates
      });
      console.log(`🤔 Correspondances potentielles trouvées pour ${ref.fileName}:`, 
        candidates.map(c => `${c.file.name} (${c.similarity.toFixed(2)})`));
    } else {
      orphanedReferences.push(ref);
      console.log(`❌ Aucune correspondance trouvée pour ${ref.fileName}`);
    }
  }
  
  console.log(`📋 Résumé: ${orphanedReferences.length} fichiers orphelins, ${potentialMatches.length} correspondances potentielles`);
  
  return {
    orphanedReferences,
    potentialMatches,
    storageFiles
  };
};

/**
 * Fonction pour afficher un rapport de diagnostic lisible
 */
export const generateDiagnosticReport = async (): Promise<string> => {
  const result = await diagnoseDatabaseFiles();
  
  let report = "🔍 RAPPORT DE DIAGNOSTIC DES FICHIERS\n";
  report += "=" .repeat(50) + "\n\n";
  
  report += `📊 STATISTIQUES:\n`;
  report += `- Fichiers orphelins: ${result.orphanedReferences.length}\n`;
  report += `- Correspondances potentielles: ${result.potentialMatches.length}\n`;
  report += `- Fichiers dans le stockage: ${result.storageFiles.length}\n\n`;
  
  if (result.orphanedReferences.length > 0) {
    report += "❌ FICHIERS ORPHELINS (références sans fichier correspondant):\n";
    report += "-".repeat(60) + "\n";
    for (const ref of result.orphanedReferences) {
      report += `📄 ${ref.fileName}\n`;
      report += `   Requête: ${ref.requestTitle} (${ref.requestId})\n`;
      report += `   Type: ${ref.type}\n`;
      report += `   URL: ${ref.fileUrl}\n\n`;
    }
  }
  
  if (result.potentialMatches.length > 0) {
    report += "🤔 CORRESPONDANCES POTENTIELLES:\n";
    report += "-".repeat(60) + "\n";
    for (const match of result.potentialMatches) {
      report += `📄 ${match.reference.fileName}\n`;
      report += `   Requête: ${match.reference.requestTitle}\n`;
      report += `   Candidats possibles:\n`;
      for (const candidate of match.candidates) {
        report += `     - ${candidate.file.name} (${candidate.file.bucket}) - Similarité: ${(candidate.similarity * 100).toFixed(1)}%\n`;
      }
      report += "\n";
    }
  }
  
  return report;
};
