
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, userName, userRole, action } = await req.json()
    
    console.log('=== SIMPLE EMAIL INVITE - DÉBUT ===')
    console.log('Action:', action || 'invite')
    console.log('Email:', email)
    console.log('Nom:', userName)
    console.log('Rôle:', userRole)
    console.log('Timestamp:', new Date().toISOString())
    
    // Validation des paramètres
    if (!email || !email.includes('@')) {
      console.error('❌ Email invalide:', email)
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Email invalide',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    
    // Créer client Supabase avec clé admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { 
        auth: { 
          persistSession: false,
          autoRefreshToken: false 
        } 
      }
    )
    
    let result
    let method
    
    if (action === 'reset_password') {
      console.log('🔄 Génération lien de réinitialisation de mot de passe...')
      method = 'password_reset'
      
      // Vérifier si l'utilisateur existe dans auth.users
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (authError) {
        console.error('❌ Erreur récupération utilisateurs auth:', authError)
        throw authError
      }
      
      const userExists = authUsers.users.some(user => user.email === email)
      
      if (!userExists) {
        console.error('❌ Utilisateur non trouvé pour reset password:', email)
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Utilisateur non trouvé',
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }
      
      result = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: 'https://d5498fdf-9d30-4367-ace8-dffe1517b061.lovableproject.com/auth-callback?type=recovery'
        }
      })
      
    } else if (action === 'create_direct') {
      console.log('👤 Création directe utilisateur...')
      method = 'direct_creation'
      
      // Générer un mot de passe temporaire sécurisé
      const tempPassword = Math.random().toString(36).slice(-8) + 
                          Math.random().toString(36).slice(-8).toUpperCase() + 
                          Math.floor(Math.random() * 100) + '!'
      
      console.log('🔐 Mot de passe temporaire généré')
      
      result = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: userName || email.split('@')[0],
          role: userRole || 'sdr'
        }
      })
      
      if (result.data.user && !result.error) {
        console.log('✅ Utilisateur créé dans auth, création du profil...')
        
        // Créer ou mettre à jour le profil
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: result.data.user.id,
            email: email,
            name: userName || email.split('@')[0],
            role: userRole || 'sdr',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || email.split('@')[0])}&background=7E69AB&color=fff`
          }, { onConflict: 'id' })
        
        if (profileError) {
          console.error('⚠️ Erreur création profil (mais utilisateur créé):', profileError)
        } else {
          console.log('✅ Profil créé avec succès')
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Utilisateur créé avec succès',
          method: method,
          user: {
            id: result.data.user.id,
            email: email,
            tempPassword: tempPassword
          },
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
      
    } else {
      // Action 'invite' par défaut
      console.log('📧 Vérification existence utilisateur pour invitation...')
      
      // Vérifier si l'utilisateur existe dans auth.users
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (authError) {
        console.error('❌ Erreur récupération utilisateurs auth:', authError)
        throw authError
      }
      
      const userExists = authUsers.users.some(user => user.email === email)
      console.log(`👤 Utilisateur existe: ${userExists ? 'OUI' : 'NON'}`)
      
      if (userExists) {
        console.log('🔄 Envoi lien de réinitialisation (utilisateur existant)...')
        method = 'reset_link'
        
        result = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: email,
          options: {
            redirectTo: 'https://d5498fdf-9d30-4367-ace8-dffe1517b061.lovableproject.com/auth-callback?type=recovery'
          }
        })
      } else {
        console.log('📨 Envoi invitation (nouvel utilisateur)...')
        method = 'invitation'
        
        result = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: 'https://d5498fdf-9d30-4367-ace8-dffe1517b061.lovableproject.com/auth-callback?type=invite',
          data: {
            role: userRole || 'sdr',
            name: userName || email.split('@')[0]
          }
        })
        
        // Si l'invitation réussit, créer le profil pour le futur utilisateur
        if (result.data.user && !result.error) {
          console.log('✅ Invitation envoyée, pré-création du profil...')
          
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
              id: result.data.user.id,
              email: email,
              name: userName || email.split('@')[0],
              role: userRole || 'sdr',
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || email.split('@')[0])}&background=7E69AB&color=fff`
            }, { onConflict: 'id' })
          
          if (profileError) {
            console.error('⚠️ Erreur pré-création profil:', profileError)
          }
        }
      }
    }
    
    console.log('📊 Résultat opération:', JSON.stringify({
      success: !result.error,
      method: method,
      hasData: !!result.data,
      error: result.error?.message
    }))
    
    if (result.error) {
      console.error('❌ ERREUR:', result.error)
      throw result.error
    }
    
    console.log('✅ Opération réussie')
    console.log('=== SIMPLE EMAIL INVITE - FIN ===')
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Opération réussie (${method})`,
      userExists: method === 'reset_link',
      method: method,
      data: result.data,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
    
  } catch (error) {
    console.error('❌ ERREUR CRITIQUE dans simple-email-invite:', error)
    console.error('Stack trace:', error.stack)
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Erreur inconnue',
      details: error.stack || 'Pas de détails disponibles',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
