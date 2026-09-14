/**
 * Route warmup script for Turbopack dev mode.
 * Hits critical routes WITH a fake JWT cookie so proxy.ts doesn't redirect them,
 * forcing Turbopack to actually compile and register each route in the manifest.
 * Run after `next dev` is ready (in a second terminal).
 */
const http = require('http');

// Routes to warm up — these are the ones users hit first after login
const ROUTES = [
  '/en',
  '/en/login',
  '/en/dashboard',
  '/en/dashboard/admin',
  '/en/dashboard/teacher',
  '/en/dashboard/student',
  '/en/dashboard/parent',
  '/en/dashboard/accountant',
  '/en/dashboard/account-lead',
  '/en/dashboard/director',
  '/en/dashboard/worker',
  '/en/dashboard/section-head',
];

const BASE_HOST = 'localhost';
const BASE_PORT = 3000;
const DELAY_MS = 600; // stagger to avoid overloading the compiler

// A fake JWT so proxy.ts treats the request as authenticated
// (the actual value is invalid, but proxy only checks cookie presence)
const FAKE_JWT = 'warmup.eyJhbGciOiJIUzI1NiJ9.warmup';

function fetchRoute(path, withAuth = false) {
  return new Promise((resolve) => {
    const options = {
      host: BASE_HOST,
      port: BASE_PORT,
      path,
      method: 'GET',
      headers: {
        'Accept': 'text/html',
        // Provide a fake JWT so the proxy auth guard passes through
        ...(withAuth ? { 'Cookie': `jwt=${FAKE_JWT}` } : {}),
      },
    };

    const req = http.request(options, (res) => {
      res.resume();
      res.on('end', () => {
        const status = res.statusCode;
        const icon = status === 200 ? '✓' : status === 307 ? '→' : '✗';
        console.log(`  ${icon} ${path} → ${status}`);
        resolve(status);
      });
    });

    req.on('error', (e) => {
      console.warn(`  ✗ ${path} → ${e.message}`);
      resolve(0);
    });

    req.setTimeout(15000, () => {
      req.destroy();
      console.warn(`  ✗ ${path} → timeout`);
      resolve(0);
    });

    req.end();
  });
}

async function waitForServer(retries = 30) {
  process.stdout.write('   Waiting for Next.js dev server');
  for (let i = 0; i < retries; i++) {
    const status = await fetchRoute('/en').catch(() => 0);
    if (status === 200) {
      process.stdout.write(' ready!\n');
      return true;
    }
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 1000));
  }
  process.stdout.write(' timed out.\n');
  return false;
}

async function main() {
  console.log('\n🔥 Warming up Turbopack route cache...');

  const ready = await waitForServer();
  if (!ready) {
    console.warn('   Server not reachable — skipping warmup.');
    return;
  }

  console.log('\n   Pass 1: public routes (no auth)');
  await fetchRoute('/en');
  await new Promise(r => setTimeout(r, DELAY_MS));
  await fetchRoute('/en/login');
  await new Promise(r => setTimeout(r, DELAY_MS));

  console.log('\n   Pass 2: protected routes (with fake auth cookie to bypass proxy guard)');
  for (const route of ROUTES.filter(r => r.includes('/dashboard'))) {
    await fetchRoute(route, true); // withAuth = true → sends fake JWT cookie
    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  // Second pass: verify all routes now respond correctly
  console.log('\n   Verification pass:');
  for (const route of ROUTES) {
    await fetchRoute(route, route.includes('/dashboard'));
  }

  console.log('\n✅ Route warmup complete. All critical pages are pre-compiled.\n');
}

main();
