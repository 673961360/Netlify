/**
 * Netlify Function — GitHub Issues 评论代理
 *
 * GET  /.netlify/functions/comments?topic_id=xxx  → 返回某话题下的所有评论
 * POST /.netlify/functions/comments               → 提交新评论
 *
 * 环境变量：
 *   GITHUB_TOKEN      — GitHub Personal Access Token（需 public_repo 权限）
 *   GITHUB_REPO_OWNER — 仓库所有者（如 4024001-netizen）
 *   GITHUB_REPO_NAME  — 仓库名（如 Youthink）
 */

const GH_TOKEN    = process.env.GITHUB_TOKEN;
const GH_OWNER    = process.env.GITHUB_REPO_OWNER;
const GH_REPO     = process.env.GITHUB_REPO_NAME;
const LABEL       = 'comment-store';
const ISSUE_PREFIX = '[comment] ';

const API = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}`;

const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${GH_TOKEN}`,
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
  'User-Agent': 'Youthink-Comments/1.0',
};

/**
 * 解析评论正文（GitHub Issue comment body → 前端所需格式）
 * 格式：NAME | GRADE | TIMESTAMP
 *
 *       正文内容...
 */
function parseComment(body) {
  const lines = body.split('\n');
  const metaLine = lines[0] || '';
  const match = metaLine.match(/^(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)$/);
  if (!match) {
    // 旧格式或无元数据行，直接返回原始内容
    return { name: 'Anonymous', grade: '', content: body, timestamp: '' };
  }
  const name = match[1].trim();
  const grade = match[2].trim();
  const timestamp = match[3].trim();
  const content = lines.slice(1).join('\n').trim();
  return { name, grade, content, timestamp };
}

function formatCommentBody(name, grade, content) {
  const now = new Date().toISOString().replace('T', ' ').replace('Z', '');
  return `${name} | ${grade || '—'} | ${now}\n\n${content}`;
}

/**
 * 查找或创建对应话题的 Issue
 */
async function findOrCreateIssue(topicId) {
  const title = ISSUE_PREFIX + topicId;

  // 先搜索已有该标题的 Issue
  const searchUrl = `${API}/issues?labels=${encodeURIComponent(LABEL)}&state=all&per_page=5`;
  const searchRes = await fetch(searchUrl, { headers });
  if (!searchRes.ok) {
    throw new Error(`GitHub API search failed: ${searchRes.status}`);
  }
  const issues = await searchRes.json();
  const existing = issues.find(i => i.title === title);
  if (existing) return existing;

  // 创建新 Issue
  const createRes = await fetch(`${API}/issues`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title,
      labels: [LABEL],
      body: `Comments for topic: \`${topicId}\`\n\nAuto-created by Youthink comment system.`,
    }),
  });
  if (!createRes.ok) {
    throw new Error(`GitHub API create issue failed: ${createRes.status}`);
  }
  return createRes.json();
}

exports.handler = async (event) => {
  if (!GH_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GITHUB_TOKEN not configured' }),
    };
  }

  // ====== GET: 读取评论 ======
  if (event.httpMethod === 'GET') {
    const topicId = event.queryStringParameters?.topic_id;
    if (!topicId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing topic_id parameter' }),
      };
    }

    try {
      const issue = await findOrCreateIssue(topicId);
      // 获取该 Issue 下的评论（使用 Issue Comments API）
      const commentsUrl = issue.comments_url;
      const commentsRes = await fetch(commentsUrl, { headers });
      if (!commentsRes.ok) {
        throw new Error(`GitHub API get comments failed: ${commentsRes.status}`);
      }
      const ghComments = await commentsRes.json();
      const comments = ghComments.map(c => parseComment(c.body));
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(comments),
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  // ====== POST: 提交评论 ======
  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }

    const { topic_id, name, grade, content } = body;
    if (!topic_id || !name || !content) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: topic_id, name, content' }),
      };
    }

    try {
      const issue = await findOrCreateIssue(topic_id);
      const commentBody = formatCommentBody(name, grade, content);

      const postRes = await fetch(issue.comments_url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ body: commentBody }),
      });
      if (!postRes.ok) {
        throw new Error(`GitHub API post comment failed: ${postRes.status}`);
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ success: true }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  // 不支持的方法
  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};
