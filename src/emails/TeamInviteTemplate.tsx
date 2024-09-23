import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface TeamInviteEmailTemplateProps {
  recipientName: string;
  senderName: string;
  teamName: string;
  inviteLink: string;
}

export const TeamInviteEmailTemplate = ({
  recipientName,
  senderName,
  teamName,
  inviteLink,
}: TeamInviteEmailTemplateProps) => (
  <Html>
    <Head />
    <Preview>You&apos;ve been invited to join {teamName} on Lukittu!</Preview>
    {/* eslint-disable-next-line @next/next/no-head-element */}
    <head>
      <style>
        {`
            .box {
              padding: 0 48px;
            }
  
            @media (max-width: 640px) {
              .box {
                padding: 0 10px;
              }
            }
          `}
      </style>
    </head>
    <Body style={main}>
      <Container style={container}>
        <Section className="box">
          <Img
            alt="Lukittu logo"
            height="50"
            src="https://app.lukittu.com/logo_text_dark.svg"
            style={logo}
            width="170"
          />
          <Text style={paragraph}>Hi {recipientName},</Text>
          <Text style={paragraph}>
            You&apos;ve been invited by {senderName} to join the team &quot;
            {teamName}&quot; on Lukittu! To accept this invitation and gain
            access to the team, please click the button below:
          </Text>
          <Section style={btnContainer}>
            <Button href={inviteLink} style={button}>
              Accept Invitation
            </Button>
          </Section>
          <Text style={paragraph}>
            If the button doesn&apos;t work, you can copy and paste this URL
            into your browser:
          </Text>
          <Link href={inviteLink} style={manualLink}>
            {inviteLink}
          </Link>
          <Hr style={hr} />
          <Text style={footer}>
            If you have any questions or didn&apos;t expect this invitation,
            please contact us at{' '}
            <Link href="mailto:support@lukittu.com">support@lukittu.com</Link>.
          </Text>
          <Text style={footer}>
            For your security, please do not share this invitation link with
            anyone else.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

TeamInviteEmailTemplate.PreviewProps = {
  recipientName: 'Jane Doe',
  senderName: 'John Smith',
  teamName: 'Awesome Project',
  inviteLink: 'https://lukittu.com/invite/awesome-project',
} as TeamInviteEmailTemplateProps;

export default TeamInviteEmailTemplate;

const main = {
  backgroundColor: '#f1f5f9',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '24px',
  marginTop: '24px',
};

const logo = {
  marginBottom: '24px',
};

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '26px',
};

const manualLink = {
  color: '#4153af',
  fontSize: '12px',
};

const btnContainer = {
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#4153af',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px',
  fontWeight: 500,
};

const hr = {
  borderColor: '#cccccc',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
};
