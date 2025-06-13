
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const AdminDataTest = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        console.log('🔍 [AdminDataTest] Début de la récupération des données');
        
        // Requête Supabase la plus simple possible
        const { data, error } = await supabase
          .from('requests')
          .select('*')
          .limit(10);
        
        if (error) {
          console.error('🚨 [AdminDataTest] Erreur Supabase:', error);
          throw error;
        }
        
        console.log('✅ [AdminDataTest] Données brutes récupérées:', data);
        console.log('📊 [AdminDataTest] Nombre de demandes:', data?.length || 0);
        setRequests(data || []);
      } catch (err) {
        console.error('❌ [AdminDataTest] Erreur lors de la récupération des données:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#2563eb', marginBottom: '20px' }}>Test de récupération de données Admin</h1>
      
      {loading ? (
        <p style={{ fontSize: '18px', color: '#6b7280' }}>Chargement des données...</p>
      ) : error ? (
        <div style={{ 
          color: '#dc2626', 
          backgroundColor: '#fee2e2', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #fecaca'
        }}>
          <h2>Erreur détectée:</h2>
          <pre style={{ 
            background: '#ffffff', 
            padding: '15px', 
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      ) : (
        <>
          <div style={{
            backgroundColor: requests.length > 0 ? '#d1fae5' : '#fed7d7',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: `1px solid ${requests.length > 0 ? '#a7f3d0' : '#fbb6ce'}`
          }}>
            <h2 style={{ 
              color: requests.length > 0 ? '#065f46' : '#991b1b',
              margin: '0 0 10px 0'
            }}>
              Résultat: {requests.length} demandes récupérées
            </h2>
            {requests.length === 0 && (
              <p style={{ margin: 0, color: '#991b1b' }}>
                ⚠️ Aucune donnée trouvée dans la table 'requests'
              </p>
            )}
          </div>
          
          {requests.length > 0 && (
            <div style={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <h3 style={{ 
                margin: 0, 
                padding: '15px', 
                backgroundColor: '#e2e8f0', 
                borderBottom: '1px solid #cbd5e1'
              }}>
                Données brutes (première demande):
              </h3>
              <pre style={{ 
                background: '#ffffff', 
                padding: '20px', 
                margin: 0,
                overflow: 'auto', 
                maxHeight: '400px',
                fontSize: '12px',
                lineHeight: '1.4'
              }}>
                {JSON.stringify(requests[0], null, 2)}
              </pre>
            </div>
          )}
          
          {requests.length > 1 && (
            <div style={{ 
              marginTop: '20px',
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <h3 style={{ 
                margin: 0, 
                padding: '15px', 
                backgroundColor: '#e2e8f0', 
                borderBottom: '1px solid #cbd5e1'
              }}>
                Toutes les demandes récupérées:
              </h3>
              <pre style={{ 
                background: '#ffffff', 
                padding: '20px', 
                margin: 0,
                overflow: 'auto', 
                maxHeight: '500px',
                fontSize: '11px',
                lineHeight: '1.3'
              }}>
                {JSON.stringify(requests, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
};
