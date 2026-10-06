// Bundles each extension context into dist/. Content scripts can't use ES
// module imports in MV3, so everything is bundled to a single IIFE per entry.
import { build, context } from 'esbuild';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const watch = process.argv.includes('--watch');

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });

// Static files copied as-is (flat, so manifest paths stay simple).
cpSync('src/manifest.json', 'dist/manifest.json');
cpSync('src/sidepanel/sidepanel.html', 'dist/sidepanel.html');
cpSync('src/sidepanel/sidepanel.css', 'dist/sidepanel.css');

const options = {
  entryPoints: {
    background: 'src/background/index.js',
    'content-bridge': 'src/content/bridge.js',
    'content-inject': 'src/content/inject/index.js',
    sidepanel: 'src/sidepanel/main.js'
  },
  outdir: 'dist',
  bundle: true,
  format: 'iife',
  target: 'chrome114',
  logLevel: 'info'
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log('watching… (reload the extension in chrome://extensions after changes)');
} else {
  await build(options);
}
