import { cookies, headers } from 'next/headers';
import 'server-only';

/**
 * Get the IP address from the headers
 */
export const getIp = async () => {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) return realIp.trim();

  return null;
};

/**
 * Get origin from the headers
 */
export const getOrigin = async () => {
  const headersList = await headers();
  return headersList.get('origin');
};

/**
 * Get the user agent from the headers
 */
export const getUserAgent = async () => {
  const headersList = await headers();
  return headersList.get('user-agent');
};

/**
 * Get the language from the cookie or the accept-language header
 */
export const getLanguage = async () => {
  const headersList = await cookies();
  const langCookie = headersList.get('lang')?.value;
  const acceptedLang = headersList.get('accept-language');

  const allowedLangs = ['en', 'fi'];

  let lang = 'en';

  if (langCookie && allowedLangs.includes(langCookie)) {
    lang = langCookie;
  }

  if (acceptedLang && allowedLangs.includes(acceptedLang.value)) {
    lang = acceptedLang.value;
  }

  return lang;
};

export const getSelectedTeam = async () => {
  const cookieStore = await cookies();
  const selectedTeamCookie = cookieStore.get('selectedTeam')?.value;

  if (!selectedTeamCookie) return null;

  const validUuid =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!validUuid.test(selectedTeamCookie)) return null;

  return selectedTeamCookie;
};
