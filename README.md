# GST Bill Maker – Phase 2
1. Open the folder in VS Code.
2. Run with Live Server (or any HTTP server). Firebase popup auth should not be tested from file://.
3. Create a Firebase project and Web App.
4. Firebase Console -> Authentication -> Sign-in method -> Google -> Enable.
5. Add localhost and your deployed domain under Authentication -> Settings -> Authorized domains.
6. Put the Web App config into app.js.
7. Deploy to Vercel/Netlify.

Firebase is used only for Google Authentication in this version. No invoice data is written to Firestore or Realtime Database.
Do not place Firebase Admin SDK private keys in frontend files.

GST calculations are basic invoice calculations. This is not an official GST portal and does not verify GSTIN/HSN/SAC against government systems.
