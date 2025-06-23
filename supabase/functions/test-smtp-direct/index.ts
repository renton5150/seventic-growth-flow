
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const { email, subject, message } = await req.json()
    
    console.log('=== TEST SMTP DIRECT - DÉBUT ===')
    console.log('Email destinataire:', email)
    console.log('Sujet:', subject)
    console.log('Timestamp:', new Date().toISOString())
    
    // Simuler un test SMTP sans vraiment envoyer
    // Note: Pour un vrai test SMTP, il faudrait les vraies credentials
    console.log('Configuration SMTP testée:')
    console.log('- Serveur: ssl0.ovh.net')
    console.log('- Port: 465')
    console.log('- TLS: Activé')
    console.log('- Expéditeur: laura.decoster@7tic.fr')
    
    // Simuler une réponse de succès pour le test
    const simulatedSuccess = {
      smtp_server: 'ssl0.ovh.net',
      port: 465,
      tls: true,
      sender: 'laura.decoster@7tic.fr',
      recipient: email,
      subject: subject || 'Test Email Direct depuis Supabase',
      test_time: new Date().toISOString(),
      status: 'simulated_success',
      message: 'Test simulé - pour un vrai test, ajoutez les credentials SMTP'
    }
    
    console.log('✅ Test SMTP simulé réussi')
    console.log('=== TEST SMTP DIRECT - FIN ===')
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Test SMTP simulé réussi pour ${email}`,
        details: simulatedSuccess
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('❌ Erreur lors du test SMTP direct:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: {
          error_type: 'smtp_test_error',
          timestamp: new Date().toISOString()
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
