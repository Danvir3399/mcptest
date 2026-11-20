// Version information - this should be updated during build process
export const VERSION_INFO = {
  commitHash: '456aa9cba6e885eb7faf07564783d8bb61aa8611',
  commitDate: '2026-11-19T22:46:07+00:00',
  shortHash: '456aa9c'
};

export const getGithubCommitUrl = (commitHash: string): string => {
  return `https://github.com/integry/mcptest/commit/${commitHash}`;
};
