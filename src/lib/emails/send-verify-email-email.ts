import VerifyEmailTemplate from '@/emails/VerifyEmailTemplate';
import { User } from '@prisma/client';
import { render } from '@react-email/components';
import 'server-only';
import { logger } from '../utils/logger';
import { sendEmail } from '../utils/nodemailer';

interface SendVerifyEmailEmailProps {
  email: string;
  user: Omit<User, 'passwordHash'>;
  verifyLink: string;
}

export const sendVerifyEmailEmail = async ({
  email,
  user,
  verifyLink,
}: SendVerifyEmailEmailProps) => {
  try {
    const html = await render(
      VerifyEmailTemplate({
        fullName: user.fullName,
        link: verifyLink,
      }),
    );

    const text = await render(
      VerifyEmailTemplate({
        fullName: user.fullName,
        link: verifyLink,
      }),
      {
        plainText: true,
      },
    );

    const success = await sendEmail({
      to: email,
      subject: 'Verify your email address',
      html,
      text,
    });

    return success;
  } catch (error) {
    logger.error('Error sending verify email email', error);
    return false;
  }
};
