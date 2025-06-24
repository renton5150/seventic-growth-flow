
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { FileSearch, Download, RefreshCw } from 'lucide-react';
import { generateDiagnosticReport } from '@/services/database/diagnosticService';
import { toast } from 'sonner';

export const FileDiagnostic = () => {
  const [report, setReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const runDiagnostic = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Lancement du diagnostic des fichiers...');
      const diagnosticReport = await generateDiagnosticReport();
      setReport(diagnosticReport);
      toast.success('Diagnostic terminé avec succès');
    } catch (error) {
      console.error('Erreur lors du diagnostic:', error);
      toast.error('Erreur lors du diagnostic des fichiers');
      setReport('Erreur lors de la génération du rapport de diagnostic.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagnostic-fichiers-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Rapport téléchargé avec succès');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSearch className="h-5 w-5" />
          Diagnostic des Fichiers
        </CardTitle>
        <p className="text-sm text-gray-600">
          Analysez les fichiers référencés dans les demandes et identifiez les problèmes potentiels.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button 
            onClick={runDiagnostic} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <FileSearch className="h-4 w-4" />
            )}
            {isLoading ? 'Analyse en cours...' : 'Lancer le diagnostic'}
          </Button>
          
          {report && (
            <Button 
              variant="outline" 
              onClick={downloadReport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Télécharger le rapport
            </Button>
          )}
        </div>
        
        {report && (
          <div>
            <label className="text-sm font-medium">Rapport de diagnostic:</label>
            <Textarea 
              value={report}
              readOnly
              className="mt-2 h-96 font-mono text-sm"
              placeholder="Le rapport apparaîtra ici après l'analyse..."
            />
          </div>
        )}
        
        {!report && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            <FileSearch className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Cliquez sur "Lancer le diagnostic" pour analyser les fichiers</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
