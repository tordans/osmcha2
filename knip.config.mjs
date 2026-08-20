/** @type {import('knip').KnipConfig} */
// Vite SPA. The Vite plugin traces index.html / vite.config.js.
// Catalyst UI kit is copied wholesale; unused kit files/exports are ignored until wired up.
const strict = process.env.KNIP_STRICT === '1'

export default {
  entry: ['src/**/*.test.ts'],
  ignore: ['src/components/ui/**'],
  ignoreFiles: [
    'src/components/loading_enhancer.tsx',
    'src/components/user/block_markup.tsx',
    // Aliased as `stream` in vite.config.js; knip does not follow Vite aliases.
    'src/shims/empty-node-stream.ts',
    'src/utils/isMobile.ts',
    'src/utils/toast.ts',
  ],
  ignoreIssues: {
    'src/components/filters/index.ts': ['exports'],
    'src/components/changeset/**': ['exports', 'types'],
    'src/network/**': ['exports'],
    'src/routing/searchSchemas.ts': ['exports', 'types'],
    'src/query/hooks/useNominatimSearch.ts': ['types'],
    'src/components/debug/DebugDataHelper.tsx': ['types'],
  },
  ignoreDependencies: ['tailwind-merge'],
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
