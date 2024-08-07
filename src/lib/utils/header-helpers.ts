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
