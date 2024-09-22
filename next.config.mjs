import createNextIntlPlugin from 'next-intl/plugin';
import pkg from './package.json' with { type: 'json' };

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // TODO: Enable, fixes react-leaflet for nextjs 15
  output: 'standalone',
  poweredByHeader: false,
  env: {
    version: pkg.version,
  },
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
