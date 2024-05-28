// @ts-check
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  images: {
    // Allowlist of external image sources for next/image <Image />
    // Docs https://nextjs.org/docs/messages/next-image-unconfigured-host
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
        port: '',
        pathname: '/avatar/**',
      },
      {
        protocol: 'https',
        hostname: 'www.openstreetmap.org',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // TODO: Make use only non-www-domains are used; configure once a domain is known
  // redirects: async () => [
  //   // https://stackoverflow.com/a/70184067
  //   {
  //     source: '/:path*',
  //     has: [{ type: 'host', value: 'www.DOMAIN.de' }],
  //     destination: 'https://DOMAIN.de/:path*',
  //     permanent: true,
  //   },
  // ],
}

export default nextConfig
