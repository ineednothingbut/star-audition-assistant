/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 构建时忽略 ESLint 错误和警告
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 也忽略 TypeScript 错误（如果有的话）
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
