// Version information - this should be updated during build process
export const VERSION_INFO = {
  commitHash: 'ef0a7ddfdecb9d54a5ef83a695131fd0cdad6e80',
  commitDate: '2026-11-18T15:31:14+00:00',
  shortHash: 'ef0a7dd'
};

export const getGithubCommitUrl = (commitHash: string): string => {
  return `https://github.com/integry/mcptest/commit/${commitHash}`;
};
