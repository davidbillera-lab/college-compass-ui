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

interface EmailChangeProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
  new_email?: string
}

export const EmailChangeEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
  new_email,
}: EmailChangeProps) => {
  const confirmLink = `${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`

  return (
    <Html>
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        `}</style>
      </Head>
      <Preview>Confirm your new email address for CampusClimb</Preview>
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
            <Heading style={styles.heading}>Confirm your new email</Heading>
            <Text style={styles.text}>
              You requested to change your email address. Click the button below 
              to confirm this change:
            </Text>

            <Section style={styles.buttonContainer}>
              <Link href={confirmLink} target="_blank" style={styles.button}>
                Confirm New Email →
              </Link>
            </Section>

            <Text style={styles.text}>
              Or use this verification code:
            </Text>

            <Text style={styles.code}>{token}</Text>

            <Hr style={styles.divider} />

            <Section style={styles.callout}>
              <Text style={styles.calloutText}>
                ⚠️ <strong>Didn't request this?</strong> If you didn't ask to change 
                your email, please contact support immediately as someone may have 
                access to your account.
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              This confirmation link will expire in 24 hours.
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

export default EmailChangeEmail
