import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'
import { styles, colors } from './base-styles.ts'

interface MagicLinkEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
}

export const MagicLinkEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
}: MagicLinkEmailProps) => {
  const magicLink = `${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`

  return (
    <Html>
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        `}</style>
      </Head>
      <Preview>Sign in to CampusClimb with this magic link</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.logoText}>
              Campus<span style={styles.logoAccent}>Climb</span>
            </Text>
            <Text style={styles.tagline}>Your College Journey Starts Here</Text>
          </Section>

          {/* Content */}
          <Section style={styles.content}>
            <Heading style={styles.heading}>Sign in to your account</Heading>
            <Text style={styles.text}>
              Click the button below to securely sign in to your CampusClimb account. 
              This link will expire in 1 hour.
            </Text>

            <Section style={styles.buttonContainer}>
              <Link href={magicLink} target="_blank" style={styles.button}>
                Sign In to CampusClimb →
              </Link>
            </Section>

            <Text style={styles.text}>
              Or use this one-time code to verify your email:
            </Text>

            <Text style={styles.code}>{token}</Text>

            <Hr style={styles.divider} />

            <Section style={styles.infoBox}>
              <Text style={styles.infoBoxText}>
                <strong>🔒 Security tip:</strong> This link is unique to your account. 
                Never share it with anyone. CampusClimb will never ask for your password 
                via email.
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              If you didn't request this email, you can safely ignore it.
            </Text>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} CampusClimb. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default MagicLinkEmail
