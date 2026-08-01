export default {
  name: 'TabSyncAI',
  repo: 'UmbertoDiP/TabSyncAI',
  branch: 'main',
  actionsUrl: 'https://github.com/UmbertoDiP/TabSyncAI/actions?query=branch%3Amain',
  versionFiles: ['package.json'],

  gates: {
    lint: 'npx eslint . --max-warnings 0 || true',
    build: 'echo no-build',
    cwd: '.',
  },

  deploy: {
    type: 'none',
  },

  release: {
    maxWaitMin: 30,
    changelog: false,
  },
};