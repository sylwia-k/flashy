/** @type {import('next').NextConfig} */

const path = require('path');

const nextConfig = {
    images: {
        domains: ['images.unsplash.com'],
    },
    webpack: (config) => {
        config.resolve.alias['@/supabase'] = path.resolve(__dirname, 'src/supabase');
        return config;
    }
};



module.exports = nextConfig;