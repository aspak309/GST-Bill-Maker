# GST Bill Maker - Complete Version

1. Put all files in the same folder.
2. Firebase Console -> Authentication -> Sign-in method -> Google -> Enable.
3. Firebase Console -> Authentication -> Settings -> Authorized domains: add your deployed Vercel/Netlify domain.
4. Replace YOUR-DOMAIN.vercel.app in index.html, robots.txt and sitemap.xml with your real domain.
5. Deploy to Vercel/Netlify.
6. The Google Search Console verification meta tag is already in index.html.
7. No invoice database is used. Invoice data is processed in the browser and PDF is generated locally.
8. Do not put Firebase Admin/service-account private keys in frontend code.
