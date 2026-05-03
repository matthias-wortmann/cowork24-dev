#!/usr/bin/env node
/**
 * One-time migration script: sync Stripe connection status into profile.publicData
 * for every user who has a Stripe Connect account but no publicData.stripeConnected flag.
 *
 * Prerequisites:
 *   1. Add Integration API credentials to your .env file:
 *        SHARETRIBE_INTEGRATION_CLIENT_ID=<your integration client ID>
 *        SHARETRIBE_INTEGRATION_CLIENT_SECRET=<your integration client secret>
 *      Get these from Sharetribe Console → Build → Applications → Create Integration app.
 *
 *   2. Run with:
 *        node scripts/sync-stripe-status-all.js
 *        # or with a custom env file:
 *        node -r dotenv/config scripts/sync-stripe-status-all.js dotenv_config_path=.env
 *
 * The script is idempotent: users who already have stripeConnected=true are skipped.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.development') });

const integrationSdk = require('sharetribe-flex-integration-sdk');

const INTEGRATION_CLIENT_ID = process.env.SHARETRIBE_INTEGRATION_CLIENT_ID;
const INTEGRATION_CLIENT_SECRET = process.env.SHARETRIBE_INTEGRATION_CLIENT_SECRET;
const BASE_URL = process.env.REACT_APP_SHARETRIBE_SDK_BASE_URL;

if (!INTEGRATION_CLIENT_ID || !INTEGRATION_CLIENT_SECRET) {
  console.error(`
ERROR: Integration API credentials not found.

Please add to your .env file:
  SHARETRIBE_INTEGRATION_CLIENT_ID=<your integration client ID>
  SHARETRIBE_INTEGRATION_CLIENT_SECRET=<your integration client secret>

Get these from: Sharetribe Console → Build → Applications → Create Integration app
`);
  process.exit(1);
}

const baseUrlMaybe = BASE_URL ? { baseUrl: BASE_URL } : {};

const sdk = integrationSdk.createInstance({
  clientId: INTEGRATION_CLIENT_ID,
  clientSecret: INTEGRATION_CLIENT_SECRET,
  ...baseUrlMaybe,
});

const PAGE_SIZE = 100;

async function fetchAllUsers() {
  const users = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    process.stdout.write(`  Fetching users page ${page}/${totalPages}...\r`);
    const response = await sdk.users.query({
      include: ['stripeAccount'],
      page,
      perPage: PAGE_SIZE,
    });

    const meta = response.data.meta;
    totalPages = meta.totalPages;

    const included = response.data.included || [];
    const stripeAccountMap = {};
    included.forEach(entity => {
      if (entity.type === 'stripeAccount') {
        stripeAccountMap[entity.id.uuid] = entity;
      }
    });

    response.data.data.forEach(user => {
      const stripeAccountRel = user.relationships?.stripeAccount?.data;
      const stripeAccount = stripeAccountRel ? stripeAccountMap[stripeAccountRel.uuid] : null;
      users.push({ user, stripeAccount });
    });

    page++;
  }

  console.log(`\n  Found ${users.length} users across ${totalPages} pages.`);
  return users;
}

async function run() {
  console.log('\n=== Stripe Status Sync ===');
  console.log('Marketplace:', BASE_URL || 'flex-api.sharetribe.com (production)');
  console.log('');

  let allUsers;
  try {
    allUsers = await fetchAllUsers();
  } catch (err) {
    console.error('Failed to fetch users:', err.message || err);
    process.exit(1);
  }

  const toSync = allUsers.filter(({ user, stripeAccount }) => {
    if (!stripeAccount) return false; // no Stripe account → nothing to sync
    const alreadySynced = user.attributes?.profile?.publicData?.stripeConnected;
    return !alreadySynced;
  });

  const alreadyDone = allUsers.filter(({ user, stripeAccount }) => {
    return stripeAccount && user.attributes?.profile?.publicData?.stripeConnected;
  });

  console.log(`Users with Stripe account:      ${toSync.length + alreadyDone.length}`);
  console.log(`Already synced (will skip):      ${alreadyDone.length}`);
  console.log(`Needs sync:                      ${toSync.length}`);
  console.log('');

  if (toSync.length === 0) {
    console.log('✓ All users already synced. Nothing to do.');
    return;
  }

  let synced = 0;
  let failed = 0;

  for (const { user } of toSync) {
    const userId = user.id.uuid;
    const displayName = user.attributes?.profile?.displayName || userId;
    try {
      await sdk.users.updateProfile(
        { id: userId, publicData: { stripeConnected: true } },
        { expand: true }
      );
      synced++;
      process.stdout.write(`  [${synced + failed}/${toSync.length}] ✓ ${displayName.padEnd(40)}\r`);
    } catch (err) {
      failed++;
      console.error(`\n  ✗ Failed to update ${displayName} (${userId}):`, err.message || err);
    }

    // Gentle rate limiting — avoid hammering the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n');
  console.log(`=== Done ===`);
  console.log(`Synced:  ${synced}`);
  console.log(`Failed:  ${failed}`);
  console.log(`Skipped: ${alreadyDone.length}`);
  console.log('');

  if (synced > 0) {
    console.log('✓ Stripe connection status is now publicly readable via profile.publicData.stripeConnected.');
    console.log('  Customers booking these providers will now route to the normal checkout.');
  }
}

run().catch(err => {
  console.error('\nUnexpected error:', err);
  process.exit(1);
});
