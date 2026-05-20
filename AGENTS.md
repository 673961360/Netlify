# AGENTS.md

> 本文件供 Codex 及其他 AI 协作工具读取，用于快速了解项目上下文。

## 项目完整文档

**所有开发指南、架构说明、部署信息、开发规范均已汇总在 `CLAUDE.md` 中，请直接阅读该文件。**

```
@ CLAUDE.md
```

## 快速上手

| 项目 | 说明 |
|------|------|
| **文件结构** | 整个项目仅一个文件：`index.html` |
| **构建步骤** | 无，直接编辑 `index.html`，浏览器刷新即可预览 |
| **本地预览** | 双击 `index.html` 或 `python -m http.server` |
| **生产地址** | `https://youthinking.netlify.app/` |
| **备站地址** | `https://4024001-netizen.github.io/Youthink/` |

## 开发注意事项

- 修改任何功能时，先在 `CLAUDE.md` 中确认架构约束（如表结构、API 端点、localStorage key）
- 换行符：LF
- 多语言：所有可翻译文本通过 `data-en` / `data-zh` 属性标注，修改时需同步更新
