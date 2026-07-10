/**
 * GitHub API service to fetch developer velocity and open-source metrics.
 */

export interface GitHubMetrics {
  totalStars: number;
  totalForks: number;
  repoCount: number;
  topLanguages: string[];
  recentActivityScore: number; // 0-100 score based on recent updates
  contributorCount: number;
}

/**
 * Extracts the GitHub organization or username from a website URL or a GitHub link.
 * 
 * @param url Website URL or GitHub URL
 * @returns Org/user name or null if cannot be extracted
 */
export function extractGitHubOrg(url: string): string | null {
  if (!url) return null;
  try {
    const cleanUrl = url.toLowerCase().trim();
    
    // If it's already a github url
    if (cleanUrl.includes("github.com/")) {
      const parts = cleanUrl.split("github.com/")[1].split("/");
      return parts[0] || null;
    }
    
    // Otherwise assume domain name (e.g., vercel.com -> vercel)
    const urlObj = new URL(cleanUrl.startsWith("http") ? cleanUrl : `https://${cleanUrl}`);
    const host = urlObj.hostname.replace(/^www\./, "");
    const parts = host.split(".");
    return parts[0] || null;
  } catch {
    return null;
  }
}

/**
 * Fetches metrics for a GitHub organization or user.
 * 
 * @param orgName Organization or user name
 * @returns GitHub metrics or null if failed/not found
 */
export async function getOrgMetrics(orgName: string): Promise<GitHubMetrics | null> {
  if (!orgName) return null;

  const headers: Record<string, string> = {
    "User-Agent": "VC-Intelligence-Platform",
    "Accept": "application/vnd.github.v3+json",
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  try {
    // Try to fetch repositories for an organization first
    let response = await fetch(`https://api.github.com/orgs/${orgName}/repos?per_page=30&sort=updated`, { headers });
    
    // If organization not found, try user repositories
    if (response.status === 404) {
      response = await fetch(`https://api.github.com/users/${orgName}/repos?per_page=30&sort=updated`, { headers });
    }

    if (!response.ok) {
      console.warn(`GitHub API: Failed to fetch repos for ${orgName}: ${response.statusText}`);
      return null;
    }

    const repos = (await response.json()) as any[];
    if (!Array.isArray(repos) || repos.length === 0) {
      return null;
    }

    let totalStars = 0;
    let totalForks = 0;
    const languagesMap: Record<string, number> = {};
    let activeReposCount = 0;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    repos.forEach((repo) => {
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;
      
      if (repo.language) {
        languagesMap[repo.language] = (languagesMap[repo.language] || 0) + 1;
      }

      // Check if updated in the last 30 days
      if (repo.updated_at) {
        const updatedAt = new Date(repo.updated_at);
        if (updatedAt >= thirtyDaysAgo) {
          activeReposCount++;
        }
      }
    });

    // Top 3 languages
    const topLanguages = Object.entries(languagesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([lang]) => lang);

    // Calculate recent activity score (percentage of active repos updated in the last 30 days)
    const recentActivityScore = repos.length > 0 
      ? Math.round((activeReposCount / repos.length) * 100) 
      : 0;

    // Fetch contributor count for the most popular repository to avoid rate limit spamming
    const popularRepo = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count)[0];
    let contributorCount = 0;

    if (popularRepo) {
      try {
        const contribResponse = await fetch(
          `https://api.github.com/repos/${orgName}/${popularRepo.name}/contributors?per_page=1&anon=true`,
          { headers }
        );
        if (contribResponse.ok) {
          // Parse Link header to get total count
          const linkHeader = contribResponse.headers.get("Link");
          if (linkHeader) {
            const match = linkHeader.match(/&page=(\d+)>;\s*rel="last"/);
            if (match && match[1]) {
              contributorCount = parseInt(match[1], 10);
            } else {
              const contribs = await contribResponse.json();
              contributorCount = Array.isArray(contribs) ? contribs.length : 0;
            }
          } else {
            const contribs = await contribResponse.json();
            contributorCount = Array.isArray(contribs) ? contribs.length : 0;
          }
        }
      } catch (e) {
        console.warn("GitHub API: Failed to fetch contributors", e);
      }
    }

    return {
      totalStars,
      totalForks,
      repoCount: repos.length,
      topLanguages,
      recentActivityScore,
      contributorCount: contributorCount || 5, // fallback if zero/failed
    };
  } catch (error) {
    console.error("GitHub API service error:", error);
    return null;
  }
}
