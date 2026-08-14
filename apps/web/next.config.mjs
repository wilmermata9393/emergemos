/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // La URL de la API se lee de una variable de entorno pública.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api',
  },
};

export default nextConfig;
