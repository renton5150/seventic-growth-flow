
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
    
    // Validation stricte des paramètres
    if (!email || !email.includes('@')) {
      console.error('❌ Email invalide:', email)
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Email invalide'
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
    
    // Vérifier si l'utilisateur existe dans auth.users
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Erreur récupération utilisateurs:', listError)
      throw listError
    }
    
    const existingUser = existingUsers.users.find(user => user.email === email)
    const userExists = !!existingUser
    
    console.log(`👤 Utilisateur existe: ${userExists ? 'OUI' : 'NON'}`)
    
    let result
    let method
    let actionLink = null
    let tempPassword = null
    
    if (action === 'reset_password') {
      console.log('🔄 Génération lien de réinitialisation...')
      method = 'password_reset'
      
      if (!userExists) {
        console.error('❌ Utilisateur non trouvé pour reset password:', email)
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Utilisateur non trouvé'
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
      
      if (result.data?.properties?.action_link) {
        actionLink = result.data.properties.action_link
        console.log('✅ Lien de récupération généré')
      }
      
    } else if (action === 'create_direct') {
      console.log('👤 Création directe utilisateur...')
      method = 'direct_creation'
      
      if (userExists) {
        console.log('⚠️ Utilisateur existe déjà, génération lien reset...')
        result = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: email,
          options: {
            redirectTo: 'https://d5498fdf-9d30-4367-ace8-dffe1517b061.lovableproject.com/auth-callback?type=recovery'
          }
        })
        
        if (result.data?.properties?.action_link) {
          actionLink = result.data.properties.action_link
        }
        
        method = 'existing_user_reset'
      } else {
        // Générer un mot de passe temporaire sécurisé
        tempPassword = Math.random().toString(36).slice(-8) + 
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
          console.log('✅ Utilisateur créé dans auth')
          
          // Créer le profil
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
            console.error('⚠️ Erreur création profil:', profileError)
          } else {
            console.log('✅ Profil créé avec succès')
          }
        }
      }
      
    } else {
      // Action 'invite' par défaut
      console.log('📧 Traitement invitation...')
      
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
        
        if (result.data?.properties?.action_link) {
          actionLink = result.data.properties.action_link
          console.log('✅ Lien de réinitialisation généré')
        }
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
        
        // Si l'invitation réussit, créer le profil
        if (result.data.user && !result.error) {
          console.log('✅ Invitation envoyée, création du profil...')
          
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
            console.error('⚠️ Erreur création profil:', profileError)
          }
        }
      }
    }
    
    console.log('📊 Résultat opération:', JSON.stringify({
      success: !result.error,
      method: method,
      hasData: !!result.data,
      hasActionLink: !!actionLink,
      hasTempPassword: !!tempPassword,
      error: result.error?.message
    }))
    
    if (result.error) {
      console.error('❌ ERREUR:', result.error)
      throw result.error
    }
    
    const responseData = {
      success: true,
      message: `Opération réussie (${method})`,
      userExists: userExists,
      method: method,
      data: result.data
    }
    
    // Ajouter le lien d'action si disponible
    if (actionLink) {
      responseData.actionLink = actionLink
    }
    
    // Ajouter le mot de passe temporaire si disponible
    if (tempPassword) {
      responseData.tempPassword = tempPassword
      responseData.user = {
        id: result.data?.user?.id,
        email: email,
        tempPassword: tempPassword
      }
    }
    
    console.log('✅ Opération réussie')
    console.log('=== SIMPLE EMAIL INVITE - FIN ===')
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
    
  } catch (error) {
    console.error('❌ ERREUR CRITIQUE dans simple-email-invite:', error)
    console.error('Stack trace:', error.stack)
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Erreur inconnue',
      details: error.stack || 'Pas de détails disponibles'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
