import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // TODO: Enable, fixes react-leaflet for nextjs 15
  images: {
    remotePatterns: [
      {
        hostname: 'www.gravatar.com',
        protocol: 'https',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
