/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    '@coinbase/agentkit',
    '@coinbase/agentkit-langchain',
    '@langchain/langgraph',
    '@langchain/groq',
    'langchain',
    '@across-protocol/app-sdk',
  ],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // ✅ Ajout de s3.tradingview.com pour le widget chart
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.tradingview.com",
              "style-src 'self' 'unsafe-inline' https://s3.tradingview.com",
              "img-src 'self' data: blob: https:",
              "font-src 'self' https://s3.tradingview.com",
              [
                "connect-src 'self'",
                'https://api.mainnet.hiro.so',
                'https://api.testnet.hiro.so',
                'https://mainnet.base.org',
                'https://api.coingecko.com',
                'https://pro-api.coingecko.com',
                'https://api.groq.com',
                'https://base2stacks-tracker-production-8e00.up.railway.app',
                'wss://api.mainnet.hiro.so',
                'wss://api.testnet.hiro.so',
                // ✅ TradingView websocket pour les données live du chart
                'wss://data.tradingview.com',
                'https://data.tradingview.com',
              ].join(' '),
              "frame-src 'self' https://s.tradingview.com https://www.tradingview.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;