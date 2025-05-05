import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="no">
      <Head>
        {/* Meta tags for caching and performance */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Critical assets will be automatically included by Next.js */}
        
        {/* Outfit font used in the header */}
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}