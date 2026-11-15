// Version information - this should be updated during build process
export const VERSION_INFO = {
  commitHash: 'e66fd970b8094d2afb5511c29bb521e889f6fb8d',
  commitDate: '2026-11-15T00:04:59+00:00',
  shortHash: 'e66fd97'
};

export const getGithubCommitUrl = (commitHash: string): string => {
  return `https://github.com/integry/mcptest/commit/${commitHash}`;
};
