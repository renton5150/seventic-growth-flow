
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const SupabaseDirectTest = () => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Test 1: Requête la plus simple possible à la table requests
        console.log('🔍 TEST 1: Requête simple à la table requests');
        const { data: test1Data, error: test1Error } = await supabase
          .from('requests')
          .select('id, title, type, created_at')
          .limit(5);
        
        if (test1Error) {
          console.error('❌ TEST 1 FAILED:', test1Error);
          throw new Error(`Test 1 failed: ${test1Error.message}`);
        }
        console.log('✅ TEST 1 SUCCESS:', test1Data);

        // Test 2: Vérifier les permissions sur la vue growth_requests_view
        console.log('🔍 TEST 2: Requête simple à la vue growth_requests_view');
        const { data: test2Data, error: test2Error } = await supabase
          .from('growth_requests_view')
          .select('id, title, type')
          .limit(5);
        
        if (test2Error) {
          console.error('❌ TEST 2 FAILED:', test2Error);
          // Ne pas faire échouer complètement si la vue n'est pas accessible
          console.warn('La vue growth_requests_view n\'est pas accessible');
        } else {
          console.log('✅ TEST 2 SUCCESS:', test2Data);
        }

        // Test 3: Essai d'une méthode de comptage correcte
        console.log('🔍 TEST 3: Comptage avec count: "exact"');
        const { count, error: test3Error } = await supabase
          .from('requests')
          .select('*', { count: 'exact', head: true });
        
        if (test3Error) {
          console.error('❌ TEST 3 FAILED:', test3Error);
          throw new Error(`Test 3 failed: ${test3Error.message}`);
        }
        console.log('✅ TEST 3 SUCCESS: Count =', count);

        // Test 4: Vérifier l'utilisateur connecté
        console.log('🔍 TEST 4: Vérification utilisateur connecté');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('❌ TEST 4 FAILED:', userError);
        } else {
          console.log('✅ TEST 4 SUCCESS: User =', user?.id);
        }

        setData({
          test1: test1Data,
          test2: test2Data || 'Vue non accessible',
          test3: count,
          user: user?.id || 'Non connecté'
        });
      } catch (e: any) {
        console.error('❌ ERROR GLOBAL:', e);
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#2563eb', marginBottom: '20px' }}>Test Direct Supabase</h1>
      
      {isLoading ? (
        <p style={{ fontSize: '18px', color: '#6b7280' }}>Chargement des tests...</p>
      ) : error ? (
        <div style={{ 
          color: '#dc2626', 
          backgroundColor: '#fee2e2', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #fecaca'
        }}>
          <h2>Erreur détectée:</h2>
          <p>{error}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{ color: '#1e40af', margin: '0 0 10px 0' }}>Résultats des tests</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ color: '#059669' }}>✅ Test 1: Table 'requests' directe</h3>
              <p>Nombre de demandes récupérées: {Array.isArray(data.test1) ? data.test1.length : 0}</p>
              <pre style={{ 
                background: '#ffffff', 
                padding: '10px', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px'
              }}>
                {JSON.stringify(data.test1, null, 2)}
              </pre>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ color: data.test2 === 'Vue non accessible' ? '#dc2626' : '#059669' }}>
                {data.test2 === 'Vue non accessible' ? '❌' : '✅'} Test 2: Vue 'growth_requests_view'
              </h3>
              <pre style={{ 
                background: '#ffffff', 
                padding: '10px', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px'
              }}>
                {JSON.stringify(data.test2, null, 2)}
              </pre>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ color: '#059669' }}>✅ Test 3: Comptage avec count: "exact"</h3>
              <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e40af' }}>
                Nombre total de demandes: {data.test3}
              </p>
            </div>

            <div>
              <h3 style={{ color: '#059669' }}>✅ Test 4: Utilisateur connecté</h3>
              <p>ID utilisateur: {data.user}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
