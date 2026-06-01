# 创艺非遗 · 梆鼓咚数字化创意平台

> 围绕福建莆田国家级非物质文化遗产 **梆鼓咚** 打造的数字化展示与体验网站 —— 集非遗科普、传承人介绍、在线课程、文创商城、互动小游戏与 AI 问答于一体。

🌐 **在线访问**:
> - 🇨🇳 国内:<https://yukun181013.github.io/chuyi-feiyi/>(GitHub Pages)
> - 🌍 海外:<https://chuyi-feiyi.vercel.app>(Vercel)

---

## 项目简介

**梆鼓咚**(别名：板鼓咚 · 乞丐歌 · 俚歌梆鼓)起源于宋代、盛行于清代，流行于福建莆田、仙游等兴化方言地区，以莆田方言（兴化语）演唱，2023 年成功列入国家级非物质文化遗产，保留传统曲目 70 余个。

本项目用现代 Web 技术把这门古老的鼓乐艺术搬上网络，让学生与公众可以在线了解、学习与体验。

## ✨ 功能模块

| 模块 | 说明 |
| --- | --- |
| 🏠 首页 | 轮播 Hero、非遗概览与各模块入口 |
| 🎭 非遗作品 | 梆鼓咚相关作品与影像展示 |
| 👤 传承人 | 代表性传承人介绍 |
| 📅 活动中心 | 演出、展览、媒体报道等活动资讯 |
| 📚 在线课程 | 分级课程（鼓乐技法、方言演唱等） |
| 🛍 手办商城 | 文创产品展示与详情页 |
| 🎮 小游戏 | 内嵌 **Unity WebGL** 音乐节奏小游戏 |
| 🤖 AI 助手 | 基于大模型的非遗问答 |
| 👥 个人中心 | 登录 / 注册与用户资料 |

此外还有基于 **Web Audio API** 合成的传统乐器音效（鼓、梆子、竹板、醒木）与滚动揭示动画等细节。

## 🛠 技术栈

- **React 19** + **Vite 8**（无 TypeScript，源码为 `.jsx` / `.js`）
- **哈希路由**：无路由库，基于 `window.location.hash` + `hashchange` 实现（`#/home`、`#/works` …）
- **Unity WebGL**：`public/game/` 内嵌预构建游戏，通过 `<iframe>` 加载
- **AI 问答**：两套后端——Vercel 部署用 Serverless 函数 `api/qa.js` 转发到 NVIDIA NIM（`meta/llama-3.1-8b-instruct`）；纯静态 / 国内部署（设 `VITE_ZHIPU_API_KEY`）则由前端直连智谱 `GLM-4-Flash`（支持 CORS、国内可访问、无需后端）
- **状态**：全部集中在单一 `App` 组件，认证信息持久化到 `localStorage`
- **部署**：Vercel（push 到 `main` 自动部署）

## 🚀 本地开发

```bash
pnpm install   # 安装依赖
pnpm dev       # 启动开发服务器（Vite HMR）
pnpm build     # 生产构建
pnpm preview   # 本地预览生产构建
pnpm lint      # ESLint 检查
```

> 本地开发时，AI 问答由 `vite.config.js` 中的开发中间件 `qaProxyPlugin` 代理（仅 dev 生效）；生产环境则由 `api/qa.js` Serverless 函数提供。

### 环境变量

复制 `.env.example` 为 `.env` 并按需填写：

```bash
NVIDIA_API_KEY=your_nvidia_api_key_here   # AI 问答所需
```

## 📁 项目结构

```
.
├── api/qa.js            # Vercel Serverless：AI 问答接口（/api/qa）
├── public/
│   ├── game/            # Unity WebGL 预构建游戏
│   └── pptx-imgs/       # 站点图片资源
├── src/
│   ├── App.jsx          # 应用主体（路由、状态、各页面渲染）
│   ├── App.css          # 全部样式
│   ├── ClickEffect.jsx  # 点击装饰动画组件
│   └── main.jsx         # React 入口
├── vercel.json          # Vercel 构建配置
└── vite.config.js       # Vite 配置（含 dev 专用中间件）
```

## 🌐 部署

项目托管在 **Vercel**，并已接入 GitHub 原生 Git 集成：

- **push 到 `main`** → 自动部署到生产环境
- **开 PR / 推分支** → 自动生成 Preview 预览环境

AI 问答所需的 `NVIDIA_API_KEY` 配置在 Vercel 项目的环境变量中（不写入代码仓库）。Unity 游戏资源已解压为非压缩格式，无需服务器额外设置 `Content-Encoding` 即可在任意静态托管正常加载。

### 国内访问（GitHub Pages）

由于 Vercel 在中国大陆访问不稳定，另用 **GitHub Pages** 部署了一份国内可访问版本（`gh-pages` 分支），AI 问答改为前端直连免费的智谱 `GLM-4-Flash`，无需后端：

- 访问地址:<https://yukun181013.github.io/chuyi-feiyi/>
- 构建（子路径 + 智谱直连）:
  ```bash
  VITE_BASE=/chuyi-feiyi/ VITE_ZHIPU_API_KEY=<你的智谱key> pnpm build
  ```
  - `VITE_BASE` 让资源适配 `/chuyi-feiyi/` 子路径；`VITE_ZHIPU_API_KEY` 注入后前端即走智谱直连。
- 部署:将构建产物 `dist/` 推送到 `gh-pages` 分支，GitHub Pages 会自动发布。
- ⚠️ 注意:`VITE_` 变量会被打包进前端、对外可见，请使用免费额度的 key 并按需轮换。
