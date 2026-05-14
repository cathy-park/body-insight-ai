/** @type {import('next').NextConfig} */
const isElectronBuild = process.env.ELECTRON_BUILD === 'true';

const nextConfig = {
  ...(isElectronBuild && {
    output: 'export',
    trailingSlash: true,
    assetPrefix: './',
  }),
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
