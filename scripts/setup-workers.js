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
  console.log('\nInteractive Installer — Worker + Supabase + YOCO\n');

  // Check for wrangler
  try { await runCmd('wrangler', ['--version']); } catch (err) { console.warn('wrangler not found; please install it (npm i -g wrangler) and login with `wrangler login` before running this installer.'); }

  const yocoApiUrl = await rl.question('YOCO API Base URL (YOCO_API_URL, e.g., https://api.yoco.com): ');
  const yocoKey = await rl.question('YOCO Secret Key (YOCO_SECRET_KEY): ');
  const yocoWebhookSecret = await rl.question('YOCO Webhook Secret (YOCO_WEBHOOK_SECRET): ');
  const supabaseKey = await rl.question('Supabase Service Role Key (SUPABASE_SERVICE_ROLE_KEY): ');
  const supabaseUrl = await rl.question('Supabase URL (SUPABASE_URL): ');
  const adminSecret = await rl.question('Admin Secret for admin UI (ADMIN_SECRET): ');
  const sentryDsn = await rl.question('Sentry DSN (optional, press enter to skip): ');
  const monitoringWebhook = await rl.question('Monitoring Webhook URL (optional): ');
  const rateLimitMax = await rl.question('Rate limit max (requests per window, default 60): ') || '60';
  const rateLimitWindow = await rl.question('Rate limit window (seconds, default 60): ') || '60';
  const githubClientId = await rl.question('GitHub Client ID (optional): ');
  const githubClientSecret = await rl.question('GitHub Client Secret (optional): ');
  const adminGithubUsers = await rl.question('Comma-separated allowed GitHub usernames (optional): ');
  const adminGithubOrgs = await rl.question('Comma-separated allowed GitHub orgs (optional): ');
  const adminUsername = await rl.question('Admin username (for built-in auth, optional): ');
  const adminPassword = await rl.question('Admin password (for built-in auth, optional): ');
  const adminJwtSecret = await rl.question('Admin JWT secret (for signing tokens): ');
  const adminJwtExpires = await rl.question('Admin JWT expiry (seconds, default 86400): ') || '86400';
  const oauthKvChoice = await yesNoPrompt('Do you want to create a KV namespace for OAuth state (recommended)?', true);
  let kvId = '';
  if (oauthKvChoice) {
    console.log('\nTo create a KV namespace run: wrangler kv:namespace create "OAUTH_KV"');
    kvId = await rl.question('If you created it, paste the namespace id (optional): ');
  }

  // Set secrets using wrangler
  console.log('\nSetting Wrangler secrets...');
  if (yocoKey) await setWranglerSecret('YOCO_SECRET_KEY', yocoKey);
  if (yocoApiUrl) await updateWranglerTomlVars({ YOCO_API_URL: yocoApiUrl });
  if (yocoWebhookSecret) await setWranglerSecret('YOCO_WEBHOOK_SECRET', yocoWebhookSecret);
  if (supabaseKey) await setWranglerSecret('SUPABASE_SERVICE_ROLE_KEY', supabaseKey);
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
  if (githubClientId) await updateWranglerTomlVars({ GITHUB_CLIENT_ID: githubClientId });
  if (githubClientSecret) await setWranglerSecret('GITHUB_CLIENT_SECRET', githubClientSecret);
  if (adminGithubUsers) await updateWranglerTomlVars({ ADMIN_GITHUB_USERS: adminGithubUsers });
  if (adminGithubOrgs) await updateWranglerTomlVars({ ADMIN_GITHUB_ORGS: adminGithubOrgs });
  if (adminUsername) await updateWranglerTomlVars({ ADMIN_USERNAME: adminUsername });
  if (adminPassword) await setWranglerSecret('ADMIN_PASSWORD', adminPassword);
  if (adminJwtSecret) await setWranglerSecret('ADMIN_JWT_SECRET', adminJwtSecret);
  if (adminJwtExpires) await updateWranglerTomlVars({ ADMIN_JWT_EXPIRES: adminJwtExpires });
  if (kvId) await updateWranglerTomlVars({ OAUTH_KV_ID: kvId });

  // Optionally set GitHub repo secrets
  const setGh = await yesNoPrompt('Do you want to set these as GitHub repo secrets via `gh` CLI? (requires gh authenticated)', false);
  if (setGh) {
    try { await runCmd('gh', ['--version']); } catch (err) { console.warn('gh not found or not authenticated. Skipping GitHub secrets.'); }
    if (yocoKey) await setGhSecret('YOCO_SECRET_KEY', yocoKey);
    if (supabaseKey) await setGhSecret('SUPABASE_SERVICE_ROLE_KEY', supabaseKey);
    if (yocoWebhookSecret) await setGhSecret('YOCO_WEBHOOK_SECRET', yocoWebhookSecret);
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

      const runApplyWorkflow = await yesNoPrompt('Would you like to also dispatch the GitHub "Apply DB Schema" workflow (requires `gh` CLI and repository secret DATABASE_URL)?', false);
      if (runApplyWorkflow) {
        try {
          await runCmd('gh', ['workflow', 'run', 'apply-schema.yml']);
          console.log('Dispatched apply-schema workflow. View it in the Actions tab.');
        } catch (err) {
          console.error('Failed to dispatch apply-schema workflow via gh. Ensure `gh` is installed and authenticated with repo access.', err.message || err);
        }
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
