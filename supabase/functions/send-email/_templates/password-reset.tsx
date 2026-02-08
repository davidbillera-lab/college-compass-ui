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

interface PasswordResetEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
}

export const PasswordResetEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
}: PasswordResetEmailProps) => {
  const resetLink = `${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`

  return (
    <Html>
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        `}</style>
      </Head>
      <Preview>Reset your CampusClimb password</Preview>
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
            <Heading style={styles.heading}>Reset your password</Heading>
            <Text style={styles.text}>
              We received a request to reset your password. Click the button below 
              to create a new password. This link expires in 1 hour.
            </Text>

            <Section style={styles.buttonContainer}>
              <Link href={resetLink} target="_blank" style={styles.button}>
                Reset Password →
              </Link>
            </Section>

            <Hr style={styles.divider} />

            <Section style={styles.callout}>
              <Text style={styles.calloutText}>
                ⚠️ <strong>Didn't request this?</strong> If you didn't ask to reset 
                your password, please ignore this email or contact support if you're 
                concerned about your account security.
              </Text>
            </Section>

            <Section style={styles.infoBox}>
              <Text style={styles.infoBoxText}>
                <strong>Password tips:</strong>
                <br />• Use at least 8 characters
                <br />• Mix letters, numbers, and symbols
                <br />• Don't reuse passwords from other sites
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              This password reset link will expire in 1 hour.
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

export default PasswordResetEmail
