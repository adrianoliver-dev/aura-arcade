/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  allowedDevOrigins: ['127.0.0.1'],
  typescript: { ignoreBuildErrors: false },
  agentRules: false,
  devIndicators: false,
  async redirects() {
    return [
      { source: '/humo', destination: '/jugar', permanent: false },
      { source: '/anillos', destination: '/lab/anillos', permanent: false },
      { source: '/radio', destination: '/lab/radio', permanent: false },
      { source: '/muro', destination: '/lab', permanent: false },
      { source: '/salida', destination: '/lab', permanent: false },
      { source: '/lab/muro', destination: '/lab', permanent: false },
      { source: '/lab/salida', destination: '/lab', permanent: false },
    ]
  },
}

export default nextConfig
