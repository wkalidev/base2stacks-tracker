/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@coinbase/agentkit',
      '@coinbase/agentkit-langchain',
      '@langchain/langgraph',
      '@langchain/groq',
      'langchain',
      '@across-protocol/app-sdk',
    ],
  },
};

module.exports = nextConfig;