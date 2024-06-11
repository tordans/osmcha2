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
  // Docs: https://nextjs.org/docs/app/building-your-application/routing/redirecting#redirects-in-nextconfigjs
  // Docs: https://nextjs.org/docs/app/api-reference/next-config-js/redirects
  redirects: async () => [
    // TODO: Make use only non-www-domains are used; configure once a domain is known
    //   // https://stackoverflow.com/a/70184067
    //   {
    //     source: '/:path*',
    //     has: [{ type: 'host', value: 'www.DOMAIN.de' }],
    //     destination: 'https://DOMAIN.de/:path*',
    //     permanent: true,
    //   },
    {
      // We don't have a page for `/changeset` so we fall back to root
      source: '/changesets',
      destination: '/',
      permanent: false,
    },
    {
      // osm.org uses `changeset/ID` but OSMCha always used the plural form
      source: '/changeset/:slug*',
      destination: '/changesets/:slug*',
      permanent: true,
    },
  ],
  // ABOUT: components/zod/writeDebugFile/README.md
  // webpack(config) {
  //   config.resolve.fallback = {
  //     ...config.resolve.fallback,
  //     fs: false,
  //   }
  //   return config
  // },
}

export default nextConfig
