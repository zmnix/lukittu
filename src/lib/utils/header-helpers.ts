import { cookies, headers } from 'next/headers';
import 'server-only';

/**
 * Get the IP address from the headers
 */
export const getIp = () => {
  const forwardedFor = headers().get('x-forwarded-for');
  const realIp = headers().get('x-real-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) return realIp.trim();

  return null;
};

/**
 * Get origin from the headers
 */
export const getOrigin = () => headers().get('origin');

/**
 * Get the user agent from the headers
 */
export const getUserAgent = () => headers().get('user-agent');

/**
 * Get the language from the cookie or the accept-language header
 */
export const getLanguage = () => {
  const langCookie = cookies().get('lang')?.value;
  const acceptedLang = headers().get('accept-language');

  const allowedLangs = ['en', 'fi'];

  let lang = 'en';

  if (langCookie && allowedLangs.includes(langCookie)) {
    lang = langCookie;
  }

  if (acceptedLang && allowedLangs.includes(acceptedLang)) {
    lang = acceptedLang;
  }

  return lang;
};

export const getSelectedTeam = () => {
  const selectedTeamCookie = cookies().get('selectedTeam')?.value;

  if (!selectedTeamCookie) return null;

  const validUuid =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!validUuid.test(selectedTeamCookie)) return null;

  return selectedTeamCookie;
};
