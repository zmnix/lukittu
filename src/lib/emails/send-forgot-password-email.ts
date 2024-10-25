import ResetPasswordTemplate from '@/emails/ResetPasswordTemplate';
import { User } from '@prisma/client';
import { render } from '@react-email/components';
import 'server-only';
import { logger } from '../utils/logger';
import { sendEmail } from '../utils/nodemailer';

interface SendResetPasswordEmailProps {
  email: string;
  user: Omit<User, 'passwordHash'>;
  resetLink: string;
}

export const sendResetPasswordEmail = async ({
  email,
  user,
  resetLink,
}: SendResetPasswordEmailProps) => {
  try {
    const html = await render(
      ResetPasswordTemplate({
        fullName: user.fullName,
        link: resetLink,
      }),
    );

    const text = await render(
      ResetPasswordTemplate({
        fullName: user.fullName,
        link: resetLink,
      }),
      { plainText: true },
    );

    const success = await sendEmail({
      to: email,
      subject: 'Reset your password',
      html,
      text,
    });

    return success;
  } catch (error) {
    logger.error('Error sending forgot password email', error);
    return false;
  }
};
