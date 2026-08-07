/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  // Repositori ini juga memuat proyek Laravel lama di direktori induk;
  // tanpa ini Next menebak akar ruang kerja ke sana.
  outputFileTracingRoot: import.meta.dirname,
  typescript: {
    // build tetap jalan walau ada type warning dari dependency pihak ketiga
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
