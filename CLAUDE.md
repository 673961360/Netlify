# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## 项目概述

**Youthink 青思学刊** — 一份面向7-12年级中学生的多语言学术期刊网站。

整个项目仅一个文件：`index.html`，包含完整的 HTML/CSS/JS。无构建工具、无依赖管理、无后端框架。直接在浏览器中打开即可运行。

## 核心架构

### 数据流

```
浏览器 (index.html)
  ├── Google Sheets (gviz API)      ← essays, forum, videos, notices, activities, likes
  ├── Formspree (xjglnzeq)          ← 投稿、订阅、反馈
  └── Netlify Functions (/api/comments) ← 评论系统 → GitHub Issues (GitHub Issues 存储)
```

- **数据读取**：通过 Google Sheets gviz API (`/gviz/tq?tqx=out:json&sheet=xxx`) 拉取 JSON，前端解析
- **评论读写**：通过 Netlify Function (`/api/comments`) 代理 GitHub Issues API，每个话题/文章对应一个 Issue
- **数据写入**：通过 Formspree 表单提交（投稿/订阅/反馈）
- **点赞系统**：纯 localStorage 本地存储，不依赖后端

### 评论系统架构

```
前端 fetch('/api/comments?topic_id=xxx')
  → Netlify redirect: /api/comments → /.netlify/functions/comments
    → netlify/functions/comments.js
      → GitHub API (Issues + Issue Comments)
        → 数据存储在 673961360/Netlify 仓库的 Issues 中
```

- 每个话题/文章对应一个 GitHub Issue，标题格式：`[comment] <topic_id>`，label：`comment-store`
- Issue 下的评论 = 用户评论，格式：`姓名 | 年级 | 时间戳\n\n评论内容`
- 环境变量：`GITHUB_TOKEN`、`GITHUB_REPO_OWNER`、`GITHUB_REPO_NAME`（在 Netlify 控制台配置）

### 页面模块

| Section | ID | 功能 |
|---------|-----|------|
| Home | `section-home` | 精选文章展示、学科筛选、告示栏、本月最佳、论坛预览 |
| Submit | `section-submit` | 双路径投稿（Professional/Creative），Formspree 提交 |
| Browse | `section-browse` | 文章列表、搜索、学科/路径过滤 |
| Forum | `section-forum` | 哲学论坛话题列表 |
| Thread | `section-thread` | 单个话题+评论区（Netlify Functions + GitHub Issues 后端） |
| Discussion | `section-discussion` | 关于我们、视频资源、反馈表单、邮件订阅 |
| Article | `section-article` | 文章阅读页（正文、评论、点赞、分享） |
| Activity | `section-activity` | 每月活动挑战 |
| Admin | `section-admin` | 编辑室面板（密码保护：`youthink2025`） |

### 关键常量（修改时注意同步）

- `SHEET_ID`: `1DK-7EE91mg92ohMKGS4SUG97NwaJL2-YGjidPjiT0wc`
- `ESSAYS_URL` / `FORUM_URL` / `VIDEOS_URL` / `NOTICES_URL` / `ACTIVITIES_URL` / `LIKES_SHEET_URL`
- `COMMENTS_API`: `/api/comments`（Netlify Functions 代理端点）
- Formspree 表单 ID: `xjglnzeq`
- 编辑联系邮箱: `youthink16526@qq.com`
- 管理员密码: `youthink2025`

### Google Sheets 表结构

| Sheet 名 | 关键字段 |
|----------|---------|
| `essays` | id, author, grade, discipline, style, title_en, title_zh, abstract_en, abstract_zh, body_en, body_zh, words, pdf_url, month_best, featured |
| `forum` | id, title_en, title_zh, prompt_en, prompt_zh, context_en, context_zh, date |
| `videos` | id, type, embed_url, link_url, title_en, title_zh, host, tag |
| `notices` | text_en, text_zh, date, type, active |
| `activities` | id, title_en, title_zh, desc_en, desc_zh, deadline, reward, active |
| `likes` | essay_id, count |

### 本地存储

- `youthink_liked` — 已点赞文章 ID 列表（防重复点赞）
- `youthink_local_likes` — 本地点赞计数
- `youthink_admin_videos` — 管理面板添加的视频（localStorage）
- `youthink_font_scale` — 字体缩放比例

## 项目结构

```
├── index.html              # 唯一前端文件
├── netlify.toml            # Netlify 配置（Functions 路径 + 路由重定向）
├── netlify/
│   └── functions/
│       └── comments.js     # Netlify Function：GitHub Issues 评论代理
└── CLAUDE.md
```

## 部署

- **主站**：Netlify (`https://youthinking.netlify.app/`)
- **备站**：GitHub Pages (`https://4024001-netizen.github.io/Youthink/`)
- **仓库**：`https://github.com/673961360/Netlify`（`master` 分支）
- **部署方式**：推送代码到仓库 → Netlify 检测到变更 → 自动构建部署

### Netlify 部署完整步骤

1. 在 Netlify 控制台关联仓库：Site settings → Build & deploy → Linked repository → Connect to GitHub → 选择 `673961360/Netlify`
2. 配置环境变量（见下方表格）
3. 推送代码到 `master` 分支，Netlify 自动触发部署
4. 验证：访问 `https://youthinking.netlify.app/.netlify/functions/comments?topic_id=test` 应返回 `[]`

### Netlify 环境变量（必须在 Netlify 控制台配置）

| 变量名 | 说明 |
|--------|------|
| `GITHUB_TOKEN` | GitHub Personal Access Token（需 `public_repo` 权限） |
| `GITHUB_REPO_OWNER` | 仓库所有者，如 `673961360` |
| `GITHUB_REPO_NAME` | 仓库名，如 `Netlify` |

### 生成 GitHub Token 步骤

1. 进入 https://github.com/settings/tokens/new
2. 勾选 `public_repo` 权限
3. 生成后将 Token 粘贴到 Netlify 环境变量中

## 开发方式

- **无构建步骤**：直接编辑 `index.html`，浏览器刷新即可预览
- **本地预览**：双击 `index.html` 用浏览器打开，或使用任意静态服务器（如 `python -m http.server`）
- **本地测试 Functions**：`netlify dev`（需安装 Netlify CLI）
- **换行符**：LF（非 Windows 脚本，遵循 CLAUDE.md 通用规范）

## 多语言系统

- 支持三种语言：EN / 中文 / 繁中（简体→繁体的基本字符映射转换）
- 通过 `data-en` / `data-zh` 属性标注可翻译文本
- `setLang()` 函数切换全局语言并重新渲染所有模块
