/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pg", "better-sqlite3"],
  },
};

export default nextConfig;
