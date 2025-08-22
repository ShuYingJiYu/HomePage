# 书樱寄语网络工作室官网

基于 React + TypeScript + Vite + Tailwind CSS 构建的现代化工作室官网。

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式框架**: Tailwind CSS
- **路由**: React Router
- **国际化**: React i18next
- **SEO**: React Helmet Async
- **代码规范**: ESLint + Prettier

## 项目结构

```
├── src/
│   ├── components/     # 可复用组件
│   ├── pages/         # 页面组件
│   ├── hooks/         # 自定义 Hooks
│   ├── utils/         # 工具函数
│   ├── types/         # TypeScript 类型定义
│   ├── App.tsx        # 主应用组件
│   ├── main.tsx       # 应用入口
│   └── index.css      # 全局样式
├── config/            # 配置文件
├── scripts/           # 构建和数据处理脚本
├── data/             # 缓存数据文件
├── public/           # 静态资源
└── dist/             # 构建输出目录
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 使用缓存数据启动开发服务器
npm run dev

# 重新获取数据后启动开发服务器
npm run dev:fresh
```

### 构建部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 代码规范

```bash
# 检查代码规范
npm run lint

# 自动修复代码规范问题
npm run lint:fix

# 格式化代码
npm run format

# 检查代码格式
npm run format:check

# 类型检查
npm run type-check
```

### 数据管理

```bash
# 获取所有数据
npm run data:fetch

# 获取 GitHub 数据
npm run data:fetch:github

# 获取 WordPress 博客数据
npm run data:fetch:wordpress

# 获取服务状态数据
npm run data:fetch:status

# AI 分析和内容生成
npm run data:analyze

# 生成 SEO 内容
npm run seo:generate
```

## 环境配置

复制 `.env.example` 为 `.env.local` 并填入相应的配置信息：

```bash
cp .env.example .env.local
```

## 部署

项目支持部署到 Vercel、Netlify 等静态托管平台。

### Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 自动部署

### 手动部署

```bash
npm run build
# 将 dist 目录上传到静态托管服务
```

## 功能特性

- ✅ 响应式设计
- ✅ 多语言支持 (中文/英文)
- ✅ SEO 优化
- ✅ 性能优化
- ✅ 代码分割
- ✅ 懒加载
- ✅ PWA 支持
- ✅ 社交分享
- ✅ Google Analytics
- ✅ 错误边界

## 许可证

MIT License