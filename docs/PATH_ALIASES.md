# 路径别名使用指南

本项目已配置完整的路径别名系统，避免使用相对路径（如 `../` 和 `./`）。

## 可用的路径别名

### 主要别名
- `@/*` - 指向 `src/*` 目录
- `@/components/*` - 指向 `src/components/*` 目录
- `@/pages/*` - 指向 `src/pages/*` 目录
- `@/hooks/*` - 指向 `src/hooks/*` 目录
- `@/utils/*` - 指向 `src/utils/*` 目录
- `@/types/*` - 指向 `src/types/*` 目录
- `@/services/*` - 指向 `src/services/*` 目录

### 配置和数据别名
- `@/data/*` - 指向 `data/*` 目录
- `@/config/*` - 指向 `config/*` 目录
- `@/scripts/*` - 指向 `scripts/*` 目录

## 使用示例

### ❌ 不推荐：使用相对路径
```typescript
// 不推荐
import { WordPressFetcher } from './wordpress-fetcher'
import { wordpressConfig } from '../../config/wordpress.config'
import type { BlogPost } from '../types/blog'
```

### ✅ 推荐：使用路径别名
```typescript
// 推荐
import { WordPressFetcher } from '@/services/wordpress-fetcher'
import { wordpressConfig } from '@/config/wordpress.config'
import type { BlogPost } from '@/types/blog'
```

## 配置文件支持

以下配置文件已支持路径别名：

1. **TypeScript 配置**
   - `tsconfig.json` - 主项目配置
   - `tsconfig.node.json` - Node.js 环境配置

2. **构建工具配置**
   - `vite.config.ts` - Vite 开发服务器和构建配置
   - `vitest.config.ts` - 测试环境配置

## 迁移指南

### 1. 服务层文件
```typescript
// 旧方式
import { wordpressConfig } from '../../config/wordpress.config'
import type { BlogPost } from '../types/blog'

// 新方式
import { wordpressConfig } from '@/config/wordpress.config'
import type { BlogPost } from '@/types/blog'
```

### 2. 工具函数
```typescript
// 旧方式
import { ConfigLoader } from './config-loader'
import type { ConfigValidationResult } from '../types/config'

// 新方式
import { ConfigLoader } from '@/utils/config-loader'
import type { ConfigValidationResult } from '@/types/config'
```

### 3. 测试文件
```typescript
// 旧方式
import { GitHubFetcher } from '../../src/services/github-fetcher'
import type { Repository } from '../../src/types/repository'

// 新方式
import { GitHubFetcher } from '@/services/github-fetcher'
import type { Repository } from '@/types/repository'
```

### 4. 脚本文件
```typescript
// 旧方式
import { GitHubDataManager } from '../src/services/github-data-manager.js'
import { CacheManager } from '../src/utils/cache-integration.js'

// 新方式
import { GitHubDataManager } from '@/services/github-data-manager.js'
import { CacheManager } from '@/utils/cache-integration.js'
```

## 优势

1. **可读性更好** - 路径更清晰，易于理解
2. **维护性更强** - 文件移动时不需要修改大量相对路径
3. **IDE 支持更好** - 更好的自动补全和跳转支持
4. **减少错误** - 避免相对路径计算错误

## 注意事项

1. 确保所有配置文件都已正确设置路径别名
2. 在迁移过程中，建议逐步替换，避免一次性修改过多文件
3. 测试环境（Vitest）和构建环境（Vite）都需要配置相同的别名
4. Node.js 脚本也需要在 `tsconfig.node.json` 中配置别名支持
