const REPO = 'wkalidev/base2stacks-tracker'
const BASE = 'https://api.github.com'

function ghHeaders() {
  return {
    Authorization:        `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept:               'application/vnd.github+json',
    'Content-Type':       'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

/** Creates a GitHub issue. Returns the issue number, or null if GITHUB_TOKEN is unset or the call fails. */
export async function createIssue(
  title:  string,
  body:   string,
  labels: string[],
): Promise<number | null> {
  if (!process.env.GITHUB_TOKEN) return null
  try {
    const res = await fetch(`${BASE}/repos/${REPO}/issues`, {
      method:  'POST',
      headers: ghHeaders(),
      body:    JSON.stringify({ title, body, labels }),
    })
    if (!res.ok) {
      console.error('GitHub createIssue failed:', res.status, await res.text())
      return null
    }
    const data = await res.json()
    return data.number as number
  } catch (err) {
    console.error('GitHub createIssue error:', err)
    return null
  }
}

/** Posts a comment on an existing issue. Silently no-ops if GITHUB_TOKEN is unset. */
export async function addIssueComment(issueNumber: number, body: string): Promise<void> {
  if (!process.env.GITHUB_TOKEN) return
  try {
    await fetch(`${BASE}/repos/${REPO}/issues/${issueNumber}/comments`, {
      method:  'POST',
      headers: ghHeaders(),
      body:    JSON.stringify({ body }),
    })
  } catch (err) {
    console.error('GitHub addIssueComment error:', err)
  }
}

/** Closes an issue. */
export async function closeIssue(issueNumber: number): Promise<void> {
  if (!process.env.GITHUB_TOKEN) return
  try {
    await fetch(`${BASE}/repos/${REPO}/issues/${issueNumber}`, {
      method:  'PATCH',
      headers: ghHeaders(),
      body:    JSON.stringify({ state: 'closed' }),
    })
  } catch (err) {
    console.error('GitHub closeIssue error:', err)
  }
}

/** Adds labels to an issue (does not replace existing ones). */
export async function addIssueLabels(issueNumber: number, labels: string[]): Promise<void> {
  if (!process.env.GITHUB_TOKEN) return
  try {
    await fetch(`${BASE}/repos/${REPO}/issues/${issueNumber}/labels`, {
      method:  'POST',
      headers: ghHeaders(),
      body:    JSON.stringify({ labels }),
    })
  } catch (err) {
    console.error('GitHub addIssueLabels error:', err)
  }
}
