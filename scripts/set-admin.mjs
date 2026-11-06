/**
 * Visit & Gift - Admin Promotion & Verification Utility Script
 *
 * This script inspects and configures an account as an authorized administrator in Firebase:
 * 1. Checks whether the target account exists in Firebase Authentication.
 * 2. Applies Firebase Auth Custom Claims: `{ admin: true }` via Identity Toolkit API.
 * 3. Updates Cloud Firestore document `users/{uid}` with `role: 'admin'`.
 *
 * Usage:
 *   node scripts/set-admin.mjs --email nikhiljammula31@gmail.com
 *   node scripts/set-admin.mjs --uid <FIREBASE_USER_UID>
 */

import fs from 'fs';
import https from 'https';

const args = process.argv.slice(2);
const emailArgIndex = args.indexOf('--email');
const uidArgIndex = args.indexOf('--uid');

const targetEmail = emailArgIndex !== -1 ? args[emailArgIndex + 1] : 'nikhiljammula31@gmail.com';
const targetUid = uidArgIndex !== -1 ? args[uidArgIndex + 1] : null;

// Read Firebase CLI token
const configPath = `${process.env.HOME}/.config/configstore/firebase-tools.json`;
if (!fs.existsSync(configPath)) {
  console.error('Error: firebase-tools.json not found. Please log in with firebase-tools.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const token = config.tokens?.access_token;
if (!token) {
  console.error('Error: No access token found in firebase-tools.json.');
  process.exit(1);
}

const projectId = 'visit-and-gift';

function requestJson(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    req.end();
  });
}

async function run() {
  console.log('=====================================================');
  console.log('VISIT & GIFT — ADMINISTRATOR PROMOTION & VERIFICATION');
  console.log('=====================================================\n');

  console.log(`Target: ${targetUid ? `UID: ${targetUid}` : `Email: ${targetEmail}`}`);
  console.log('Step 1: Looking up user in Firebase Authentication...');

  const lookupPayload = targetUid ? { localId: [targetUid] } : { email: [targetEmail] };
  const lookupRes = await requestJson(
    {
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/projects/${projectId}/accounts:lookup`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
    lookupPayload
  );

  if (lookupRes.status !== 200 || !lookupRes.data.users || lookupRes.data.users.length === 0) {
    console.error(`❌ User not found in Firebase Authentication! (${lookupRes.status})`);
    console.error('Please verify the email address exists before attempting promotion.');
    process.exit(1);
  }

  const user = lookupRes.data.users[0];
  const uid = user.localId;
  const email = user.email;
  console.log(`✅ User identified: ${email} (UID: ${uid})`);
  console.log(`Current Custom Claims: ${user.customAttributes || 'None'}`);

  // Step 2: Grant custom claim { admin: true }
  console.log('\nStep 2: Granting Firebase Auth Custom Claims { admin: true }...');
  const claimsRes = await requestJson(
    {
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/projects/${projectId}/accounts:update`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
    {
      localId: uid,
      customAttributes: JSON.stringify({ admin: true }),
    }
  );

  if (claimsRes.status === 200) {
    console.log('✅ Firebase Auth Custom Claims granted successfully!');
  } else {
    console.warn(`Warning: Claims update returned status ${claimsRes.status}:`, claimsRes.data);
  }

  // Step 3: Update Firestore users document role: 'admin'
  console.log('\nStep 3: Updating Firestore user profile to role: "admin"...');
  const firestoreRes = await requestJson(
    {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${projectId}/databases/(default)/documents/users/${uid}?updateMask.fieldPaths=role&updateMask.fieldPaths=updatedAt`,
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
    {
      fields: {
        role: { stringValue: 'admin' },
        updatedAt: { timestampValue: new Date().toISOString() },
      },
    }
  );

  if (firestoreRes.status === 200) {
    console.log('✅ Firestore profile role updated to "admin" successfully!');
  } else {
    console.warn(`Warning: Firestore update returned status ${firestoreRes.status}:`, firestoreRes.data);
  }

  console.log('\n=====================================================');
  console.log(`🎉 Administrator ${email} is now fully authorized!`);
  console.log('=====================================================');
}

run().catch((err) => {
  console.error('Fatal error in set-admin script:', err);
  process.exit(1);
});
