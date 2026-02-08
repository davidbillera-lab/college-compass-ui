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

interface EmailConfirmationProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
}

export const EmailConfirmationEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
}: EmailConfirmationProps) => {
  const confirmLink = `${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`

  return (
    <Html>
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        `}</style>
      </Head>
      <Preview>Confirm your CampusClimb email address</Preview>
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
            <Heading style={styles.heading}>Welcome to CampusClimb! 🎓</Heading>
            <Text style={styles.text}>
              Thanks for signing up! Please confirm your email address to get 
              started on your college journey. Just click the button below:
            </Text>

            <Section style={styles.buttonContainer}>
              <Link href={confirmLink} target="_blank" style={styles.button}>
                Confirm Email Address →
              </Link>
            </Section>

            <Text style={styles.text}>
              Or enter this verification code:
            </Text>

            <Text style={styles.code}>{token}</Text>

            <Hr style={styles.divider} />

            <Section style={styles.callout}>
              <Text style={styles.calloutText}>
                🚀 <strong>What's next?</strong> Once confirmed, you'll get access to 
                personalized college matches, scholarship recommendations, and AI-powered 
                application guidance.
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              If you didn't create a CampusClimb account, you can ignore this email.
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

export default EmailConfirmationEmail
