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
          // Empêche le clickjacking (intégration dans une iframe)
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Empêche le MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Force HTTPS pendant 1 an
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // Contrôle les infos envoyées dans le header Referer
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Désactive les fonctionnalités navigateur non utilisées
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // Content Security Policy — adapté pour Next.js + Stacks + CoinGecko
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts : Next.js a besoin d'inline scripts pour l'hydratation
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Styles : Tailwind génère des styles inline
              "style-src 'self' 'unsafe-inline'",
              // Images : autoriser les data URIs et les sources externes utilisées
              "img-src 'self' data: blob: https:",
              // Fonts
              "font-src 'self'",
              // Connexions API autorisées
              [
                "connect-src 'self'",
                'https://api.mainnet.hiro.so',
                'https://api.testnet.hiro.so',
                'https://mainnet.base.org',
                'https://api.coingecko.com',
                'https://pro-api.coingecko.com',
                'https://api.groq.com',
                'wss://api.mainnet.hiro.so',
                'wss://api.testnet.hiro.so',
              ].join(' '),
              // Frames : aucune
              "frame-src 'self' https://s.tradingview.com https://www.tradingview.com",
              // Objets (Flash, etc.) : aucun
              "object-src 'none'",
              // Base URI : limiter au domaine courant
              "base-uri 'self'",
              // Form actions : limiter au domaine courant
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;