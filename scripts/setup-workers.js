#!/usr/bin/env node
// Interactive installer for Cloudflare Worker and related secrets
// - Sets wrangler secrets
// - Updates wrangler.toml vars
// - Optionally sets GitHub repo secrets using `gh` if available
// - Optionally runs SQL against a provided DATABASE_URL using psql

import { spawn } from 'child_process';
import fs from 'fs/promises';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

const rl = readline.createInterface({ input, output });

function yesNoPrompt(prompt, def = true) {
  return rl.question(`${prompt} (${def ? 'Y/n' : 'y/N'}): `).then(ans => {
    if (ans === '') return def;
    return /^y(es)?$/i.test(ans);
  });
}

async function runCmd(cmd, args, inputStr = null) {
  return new Promise((resolve, reject) => {
    const cp = spawn(cmd, args, { stdio: ['pipe', 'inherit', 'inherit'] });
    if (inputStr) {
      cp.stdin.write(inputStr);
      cp.stdin.end();
    }
    cp.on('exit', (code) => {
      if (code === 0) resolve(code);
      else reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`));
    });
    cp.on('error', reject);
  });
}

async function setWranglerSecret(name, value) {
  try {
    await runCmd('wrangler', ['secret', 'put', name, '--raw'], value + '\n');
    console.log(`Set secret ${name}`);
  } catch (err) {
    console.error(`Failed to set ${name}:`, err.message || err);
  }
}

async function setGhSecret(name, value) {
  try {
    await runCmd('gh', ['secret', 'set', name, '--body', value]);
    console.log(`Set GitHub repo secret ${name}`);
  } catch (err) {
    console.error(`Failed to set GitHub secret ${name}:`, err.message || err);
  }
}

async function updateWranglerTomlVars(replacements) {
  const path = 'workers/wrangler.toml';
  let content = await fs.readFile(path, 'utf8');
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`(^#?\s*${key}\s*=\s*").*(".*$)`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `$1${value}$2`);
    } else {
      // append under [vars]
      if (!content.includes('[vars]')) content += '\n[vars]\n';
      content += `${key} = "${value}"\n`;
    }
  }
  await fs.writeFile(path, content, 'utf8');
  console.log('Updated workers/wrangler.toml [vars]');
}

async function run() {
  console.log('\nInteractive Installer — Worker + Supabase + Stripe\n');

  // Check for wrangler
  try { await runCmd('wrangler', ['--version']); } catch (err) { console.warn('wrangler not found; please install it (npm i -g wrangler) and login with `wrangler login` before running this installer.'); }

  const stripeKey = await rl.question('Stripe Secret Key (STRIPE_SECRET_KEY): ');
  const supabaseKey = await rl.question('Supabase Service Role Key (SUPABASE_SERVICE_ROLE_KEY): ');
  const supabaseUrl = await rl.question('Supabase URL (SUPABASE_URL): ');
  const webhookSecret = await rl.question('Stripe Webhook Secret (STRIPE_WEBHOOK_SECRET): ');
  const adminSecret = await rl.question('Admin Secret for admin UI (ADMIN_SECRET): ');
  const sentryDsn = await rl.question('Sentry DSN (optional, press enter to skip): ');
  const monitoringWebhook = await rl.question('Monitoring Webhook URL (optional): ');
  const rateLimitMax = await rl.question('Rate limit max (requests per window, default 60): ') || '60';
  const rateLimitWindow = await rl.question('Rate limit window (seconds, default 60): ') || '60';

  // Set secrets using wrangler
  console.log('\nSetting Wrangler secrets...');
  if (stripeKey) await setWranglerSecret('STRIPE_SECRET_KEY', stripeKey);
  if (supabaseKey) await setWranglerSecret('SUPABASE_SERVICE_ROLE_KEY', supabaseKey);
  if (webhookSecret) await setWranglerSecret('STRIPE_WEBHOOK_SECRET', webhookSecret);
  if (adminSecret) await setWranglerSecret('ADMIN_SECRET', adminSecret);

  // Optionally set SUPABASE_URL as secret or var
  const supabaseAsSecret = await yesNoPrompt('Store SUPABASE_URL as secret (yes) or var in wrangler.toml (no)?', false);
  if (supabaseAsSecret) {
    if (supabaseUrl) await setWranglerSecret('SUPABASE_URL', supabaseUrl);
  } else {
    await updateWranglerTomlVars({ SUPABASE_URL: supabaseUrl });
  }

  if (sentryDsn) await updateWranglerTomlVars({ SENTRY_DSN: sentryDsn });
  if (monitoringWebhook) await updateWranglerTomlVars({ MONITORING_WEBHOOK_URL: monitoringWebhook });
  if (rateLimitMax) await updateWranglerTomlVars({ RATE_LIMIT_MAX: rateLimitMax });
  if (rateLimitWindow) await updateWranglerTomlVars({ RATE_LIMIT_WINDOW: rateLimitWindow });

  // Optionally set GitHub repo secrets
  const setGh = await yesNoPrompt('Do you want to set these as GitHub repo secrets via `gh` CLI? (requires gh authenticated)', false);
  if (setGh) {
    try { await runCmd('gh', ['--version']); } catch (err) { console.warn('gh not found or not authenticated. Skipping GitHub secrets.'); }
    if (stripeKey) await setGhSecret('STRIPE_SECRET_KEY', stripeKey);
    if (supabaseKey) await setGhSecret('SUPABASE_SERVICE_ROLE_KEY', supabaseKey);
    if (webhookSecret) await setGhSecret('STRIPE_WEBHOOK_SECRET', webhookSecret);
    if (adminSecret) await setGhSecret('ADMIN_SECRET', adminSecret);
    if (supabaseUrl) await setGhSecret('SUPABASE_URL', supabaseUrl);
    if (sentryDsn) await setGhSecret('SENTRY_DSN', sentryDsn);
  }

  // Offer to run SQL if the user provides DATABASE_URL
  const runSql = await yesNoPrompt('Do you want the installer to attempt to run the SQL `workers/sql/schema.sql` against a DATABASE_URL (PSQL)?', false);
  if (runSql) {
    const dbUrl = await rl.question('Paste DATABASE_URL (Postgres) for your Supabase DB (format: postgres://...): ');
    if (dbUrl) {
      try {
        await runCmd('psql', [dbUrl, '-f', 'workers/sql/schema.sql']);
        console.log('SQL executed.');
      } catch (err) {
        console.error('Failed to run SQL automatically. Please run `workers/sql/schema.sql` in Supabase SQL editor manually. Error:', err.message || err);
      }
    }
  }

  // Optionally publish the worker now
  const doPublish = await yesNoPrompt('Publish the worker now with `wrangler publish`?', true);
  if (doPublish) {
    const accountId = await rl.question('Cloudflare Account ID (leave blank to skip and publish manually): ');
    try {
      if (accountId) await runCmd('wrangler', ['publish', '--account-id', accountId]);
      else await runCmd('wrangler', ['publish']);
      console.log('Published worker.');
    } catch (err) {
      console.error('Publish failed:', err.message || err);
    }
  }

  console.log('\nDone. Please verify the endpoints with `wrangler dev` and the curl examples in workers/README.md');
  rl.close();
}

run().catch(err => { console.error('Installer error', err); process.exit(1); });
