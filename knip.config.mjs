/** @type {import('knip').KnipConfig} */
// Vite SPA — trace from the HTML/TSX boot and Vite config.
// Verify scripts (@see .cursor/rules/package-json-scripts.md):
//   "knip": "KNIP_STRICT=1 knip --config knip.config.mjs"
//   "knip-warn": "knip --config knip.config.mjs || true"
const strict = process.env.KNIP_STRICT === '1'

export default {
  entry: [
    'index.html',
    'src/index.tsx',
    'src/**/*.test.ts',
    'src/**/*.test.tsx',
    'vite.config.js',
  ],
  ignore: ['.agents/**', 'src/routeTree.gen.ts'],
  ignoreBinaries: ['code', 'gh', 'rg', 'jq'],
  rules: {
    files: 'error',
    dependencies: 'error',
    devDependencies: 'error',
    unlisted: 'error',
    binaries: 'error',
    exports: strict ? 'error' : 'warn',
    types: strict ? 'error' : 'warn',
    enumMembers: strict ? 'error' : 'warn',
    duplicates: 'warn',
  },
}
