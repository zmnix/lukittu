import crypto from 'crypto';

export const getGravatarUrl = (email: string) => {
  const hash = crypto.createHash('md5').update(email).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?d=404&s=200`;
};
