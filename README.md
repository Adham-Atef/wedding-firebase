# wedding-3.0

## RSVP spreadsheet backend

Guest RSVPs are stored in Firestore and the `RSVPs` tab. Public blessings are
stored in and displayed from the `Wishes` tab. Google Apps Script connects the
website to the spreadsheet; its source is [`apps-script/Code.gs`](./apps-script/Code.gs).

To deploy the spreadsheet receiver:

1. Open the Apps Script project whose deployment URL is configured in
   `src/services/googleAppsScript.ts`.
2. Replace its source with `apps-script/Code.gs`.
3. The script is configured for the target spreadsheet ID. Run `setup` once
   from the Apps Script editor and authorize access; it creates the `RSVPs`
   and `Wishes` tabs with headers if needed.
4. Choose **Deploy → Manage deployments**, edit the web app deployment, select
   **New version**, set **Execute as** to **Me**, and allow public access.
   Deploy a new version. If Google gives you a new `/exec` URL, update
   `GOOGLE_APPS_SCRIPT_URL` in `src/services/googleAppsScript.ts`.
5. Push the website changes to Vercel. Public blessings are read from the
   `Wishes` tab and refreshed every 15 seconds; deleting a row there removes
   it from the public guestbook on its next refresh. RSVP records remain in
   the separate `RSVPs` tab. Failed script runs are available under
   **Executions** in Apps Script.

The current Firebase project is configured in `firebase-applet-config.json`.
To connect a new Firebase project without enabling billing:

1. Create a Firebase project, register a web app, create a Firestore database
   on the free Spark plan, and enable Google sign-in if you use the host Sheets
   manager.
2. Replace `firebase-applet-config.json` with the new web app configuration.
   Add `"firestoreDatabaseId": "(default)"` to that JSON.
3. Publish `firestore.rules` from the Firebase console and add the deployed
   website domain to Firebase Authentication's authorized domains.
