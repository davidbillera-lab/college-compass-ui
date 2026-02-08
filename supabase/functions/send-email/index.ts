import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { MagicLinkEmail } from './_templates/magic-link.tsx'
import { PasswordResetEmail } from './_templates/password-reset.tsx'
import { EmailConfirmationEmail } from './_templates/email-confirmation.tsx'
import { EmailChangeEmail } from './_templates/email-change.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Map email action types to subject lines
const subjectMap: Record<string, string> = {
  signup: 'Confirm your CampusClimb account',
  magiclink: 'Sign in to CampusClimb',
  recovery: 'Reset your CampusClimb password',
  email_change: 'Confirm your new email address',
  invite: "You've been invited to CampusClimb",
}

// Get the appropriate email template based on action type
function getEmailTemplate(
  emailActionType: string,
  props: {
    supabase_url: string
    token: string
    token_hash: string
    redirect_to: string
    email_action_type: string
  }
) {
  switch (emailActionType) {
    case 'recovery':
      return React.createElement(PasswordResetEmail, props)
    case 'signup':
      return React.createElement(EmailConfirmationEmail, props)
    case 'email_change':
      return React.createElement(EmailChangeEmail, props)
    case 'magiclink':
    default:
      return React.createElement(MagicLinkEmail, props)
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  
  console.log('Received email hook request')
  
  const wh = new Webhook(hookSecret)
  
  try {
    const {
      user,
      email_data: { 
        token, 
        token_hash, 
        redirect_to, 
        email_action_type 
      },
    } = wh.verify(payload, headers) as {
      user: {
        email: string
      }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
        site_url: string
        token_new?: string
        token_hash_new?: string
      }
    }

    console.log(`Processing ${email_action_type} email for ${user.email}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    
    const templateProps = {
      supabase_url: supabaseUrl,
      token,
      token_hash,
      redirect_to,
      email_action_type,
    }

    const emailTemplate = getEmailTemplate(email_action_type, templateProps)
    const html = await renderAsync(emailTemplate)

    const subject = subjectMap[email_action_type] || 'CampusClimb Notification'

    console.log(`Sending email with subject: ${subject}`)

    const { data, error } = await resend.emails.send({
      from: 'CampusClimb <noreply@YOUR-VERIFIED-DOMAIN.com>', // TODO: Replace with verified domain
      to: [user.email],
      subject,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    console.log('Email sent successfully:', data)

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })

  } catch (error: any) {
    console.error('Error in send-email function:', error)
    
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code || 500,
          message: error.message || 'Unknown error',
        },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
})
