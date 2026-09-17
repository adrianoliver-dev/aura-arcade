/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  typescript: { ignoreBuildErrors: false },
  agentRules: false,
  devIndicators: false,
  async redirects() {
    return [
      { source: '/humo', destination: '/jugar', permanent: false },
      { source: '/anillos', destination: '/lab/anillos', permanent: false },
      { source: '/radio', destination: '/lab/radio', permanent: false },
      { source: '/muro', destination: '/lab/muro', permanent: false },
      { source: '/salida', destination: '/lab/salida', permanent: false },
    ]
  },
}

export default nextConfig
