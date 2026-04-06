function cfg() {
  return {
    owner: import.meta.env.GITHUB_OWNER as string,
    repo: import.meta.env.GITHUB_REPO as string,
    token: import.meta.env.GITHUB_TOKEN as string,
    branch: (import.meta.env.GITHUB_BRANCH as string) ?? "main",
  };
}

async function ghFetch(endpoint: string, init?: RequestInit) {
  const { token } = cfg();
  return fetch(`https://api.github.com${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

export async function ghGetSHA(repoPath: string): Promise<string | null> {
  const { owner, repo, branch } = cfg();
  const res = await ghFetch(`/repos/${owner}/${repo}/contents/${repoPath}?ref=${branch}`);
  if (!res.ok) return null;
  const json = await res.json();
  return (json as { sha?: string }).sha ?? null;
}

export async function ghPutFile(repoPath: string, content: string, message: string, sha?: string) {
  const { owner, repo, branch } = cfg();
  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(content, "utf-8").toString("base64"),
    branch,
  };
  if (sha) body.sha = sha;
  const res = await ghFetch(`/repos/${owner}/${repo}/contents/${repoPath}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function ghDeleteFile(repoPath: string, sha: string, message: string) {
  const { owner, repo, branch } = cfg();
  const res = await ghFetch(`/repos/${owner}/${repo}/contents/${repoPath}`, {
    method: "DELETE",
    body: JSON.stringify({ message, sha, branch }),
  });
  if (!res.ok) throw new Error(await res.text());
}

/** 절대 경로 → 레포 상대 경로 (슬래시 정규화) */
export function toRepoPath(absolutePath: string): string {
  const cwd = process.cwd().replace(/\\/g, "/");
  const normalized = absolutePath.replace(/\\/g, "/");
  return normalized.replace(cwd + "/", "");
}
