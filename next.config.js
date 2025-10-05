/** @type {import('next').NextConfig} */

const path = require('path');

const nextConfig = {
    images: {
        domains: ['images.unsplash.com'],
    },
    webpack: (config) => {
        // Ensure @ alias resolves to src for all subpaths on Vercel
        config.resolve.alias['@'] = path.resolve(__dirname, 'src');
        return config;
    }
};



module.exports = nextConfig;