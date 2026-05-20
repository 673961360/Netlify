# Youthink 青思学刊

> 一份面向 7-12 年级中学生的多语言学术期刊网站。

**线上地址**：https://youthinking.netlify.app/

## 系统架构

### 数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                        浏览器 (index.html)                       │
│                                                                   │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────────┐   │
│  │ Google Sheets│    │  Formspree   │    │  Netlify Functions │   │
│  │ (gviz API)   │    │ (xjglnzeq)   │    │  /api/comments     │   │
│  └──────┬───────┘    └──────┬───────┘    └────────┬───────────┘   │
│         │                   │                      │               │
│   文章/论坛/视频       投稿/订阅/反馈          评论系统           │
│   公告/活动/点赞                              ↓                   │
│                                        ┌───────────────┐         │
│                                        │ GitHub Issues │         │
│                                        │ (673961360/   │         │
│                                        │  Netlify)     │         │
│                                        └───────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

| 模块 | 用途 | 技术 |
|------|------|------|
| **文章/论坛/视频/公告/活动** | 内容数据源 | Google Sheets gviz API |
| **投稿/订阅/反馈** | 表单提交 | Formspree (表单 ID: `xjglnzeq`) |
| **评论系统** | 评论读写 | Netlify Functions → GitHub Issues |
| **点赞系统** | 文章点赞 | localStorage 本地存储 |

### 评论系统详细说明

```
用户提交评论
    ↓
前端 POST /api/comments?topic_id=xxx
    ↓
Netlify 路由: /api/comments → /.netlify/functions/comments
    ↓
netlify/functions/comments.js (Node.js 函数)
    ↓
GitHub API: 创建/查找 Issue → 添加评论
    ↓
评论数据存储在 GitHub Issues 中
```

- 每篇文章/话题对应一个 GitHub Issue，标题格式：`[comment] <topic_id>`
- Issue 标签：`comment-store`
- 评论格式：`姓名 | 年级 | 时间戳\n\n评论内容`

## 技术栈

| 项目 | 选型 |
|------|------|
| 前端 | 单文件 `index.html`（HTML + CSS + JS），零构建步骤 |
| 部署 | Netlify（自动 CI/CD） |
| 数据源 | Google Sheets（只读）+ GitHub Issues（评论写入） |
| 表单 | Formspree（无需后端） |
| 多语言 | EN / 简体中文 / 繁体中文，通过 `data-en` / `data-zh` 属性 + `setLang()` 切换 |

## Git 仓库

```
仓库地址: git@github.com:673961360/Netlify.git
主分支: master
```

推送代码后，Netlify 自动检测 `master` 分支变更并触发部署。

## 部署指南

### 前置条件

1. 已注册 [Netlify](https://app.netlify.com/) 账号
2. 已创建 GitHub 仓库 `673961360/Netlify`
3. 已生成 GitHub Personal Access Token（需 `public_repo` 权限）

### 生成 GitHub Token

1. 访问 https://github.com/settings/tokens/new
2. 勾选 `public_repo` 权限
3. 点击 "Generate token"，复制生成的 token（格式：`ghp_xxxx`）

### Netlify 环境变量配置

登录 Netlify → 选择 `youthinking` 站点 → **Site settings** → **Environment variables**，添加以下三个变量：

| 变量名 | 值 |
|--------|-----|
| `GITHUB_TOKEN` | 你的 GitHub Personal Access Token |
| `GITHUB_REPO_OWNER` | `673961360` |
| `GITHUB_REPO_NAME` | `Netlify` |

### 关联 GitHub 仓库

1. 进入 Netlify 站点 → **Site settings** → **Build & deploy**
2. 点击 **Linked repository** → **Connect to repository**
3. 选择 GitHub → 授权 → 选择 `673961360/Netlify`
4. 构建设置保持默认（无需构建命令）
5. 点击 **Deploy site**

### 推送代码

```bash
git remote add origin git@github.com:673961360/Netlify.git
git add .
git commit -m "update"
git push -u origin master
```

推送后 Netlify 自动构建部署，通常 30 秒内完成。

### 验证部署

部署完成后访问以下地址检查：

| 检查项 | URL | 预期结果 |
|--------|-----|----------|
| 主站 | https://youthinking.netlify.app/ | 页面正常展示文章和内容 |
| 评论函数 | https://youthinking.netlify.app/.netlify/functions/comments?topic_id=test | 返回 `[]` |
| Google Sheets | 浏览器打开 index.html | 文章列表正常加载 |

## 开发方式

- **无构建步骤**：直接编辑 `index.html`，保存后刷新浏览器即可预览
- **本地预览**：双击 `index.html` 用浏览器打开，或运行 `python -m http.server`
- **本地测试 Functions**：安装 Netlify CLI 后运行 `netlify dev`
- **换行符**：所有文件使用 LF 行尾

## 项目结构

```
├── index.html              # 唯一前端文件（HTML + CSS + JS）
├── netlify.toml            # Netlify 配置（Functions 路径 + 路由重定向）
├── netlify/
│   └── functions/
│       └── comments.js     # Netlify Function：GitHub Issues 评论代理
├── CLAUDE.md               # AI 开发指引
└── README.md               # 本文档
```

## 关键常量

修改代码时注意同步以下常量：

| 常量 | 值 | 位置 |
|------|-----|------|
| `SHEET_ID` | `1DK-7EE91mg92ohMKGS4SUG97NwaJL2-YGjidPjiT0wc` | `index.html` |
| Formspree ID | `xjglnzeq` | `index.html` |
| 管理员密码 | `youthink2025` | `index.html` |
| 联系邮箱 | `youthink16526@qq.com` | `index.html` |
| `COMMENTS_API` | `/api/comments` | `index.html` + `netlify.toml` |

## Google Sheets 表结构

| Sheet 名 | 关键字段 |
|----------|---------|
| `essays` | id, author, grade, discipline, style, title_en, title_zh, abstract_en, abstract_zh, body_en, body_zh, words, pdf_url, month_best, featured |
| `forum` | id, title_en, title_zh, prompt_en, prompt_zh, context_en, context_zh, date |
| `videos` | id, type, embed_url, link_url, title_en, title_zh, host, tag |
| `notices` | text_en, text_zh, date, type, active |
| `activities` | id, title_en, title_zh, desc_en, desc_zh, deadline, reward, active |
| `likes` | essay_id, count |

## 本地存储

| Key | 用途 |
|-----|------|
| `youthink_liked` | 已点赞文章 ID 列表（防重复点赞） |
| `youthink_local_likes` | 本地点赞计数 |
| `youthink_admin_videos` | 管理面板添加的视频 |
| `youthink_font_scale` | 字体缩放比例 |
