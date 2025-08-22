#!/usr/bin/env node

/**
 * 路径别名迁移脚本
 * 自动将项目中的相对路径替换为路径别名
 */

import { readdir, readFile, writeFile, stat } from 'fs/promises'
import { join, relative, resolve } from 'path'

interface PathMapping {
  pattern: RegExp
  replacement: string
}

// 路径映射规则
const pathMappings: PathMapping[] = [
  // 从 src 目录到 config 目录
  {
    pattern: /from ['"]\.\.\/\.\.\/config\/([^'"]+)['"]/g,
    replacement: "from '@/config/$1'"
  },
  // 从 src 目录到 data 目录
  {
    pattern: /from ['"]\.\.\/\.\.\/data\/([^'"]+)['"]/g,
    replacement: "from '@/data/$1'"
  },
  // 从 src/services 到其他 src 目录
  {
    pattern: /from ['"]\.\.\/types\/([^'"]+)['"]/g,
    replacement: "from '@/types/$1'"
  },
  {
    pattern: /from ['"]\.\.\/utils\/([^'"]+)['"]/g,
    replacement: "from '@/utils/$1'"
  },
  {
    pattern: /from ['"]\.\.\/hooks\/([^'"]+)['"]/g,
    replacement: "from '@/hooks/$1'"
  },
  {
    pattern: /from ['"]\.\.\/components\/([^'"]+)['"]/g,
    replacement: "from '@/components/$1'"
  },
  {
    pattern: /from ['"]\.\.\/pages\/([^'"]+)['"]/g,
    replacement: "from '@/pages/$1'"
  },
  // 从 scripts 目录到 src 目录
  {
    pattern: /from ['"]\.\.\/src\/services\/([^'"]+)['"]/g,
    replacement: "from '@/services/$1'"
  },
  {
    pattern: /from ['"]\.\.\/src\/utils\/([^'"]+)['"]/g,
    replacement: "from '@/utils/$1'"
  },
  {
    pattern: /from ['"]\.\.\/src\/types\/([^'"]+)['"]/g,
    replacement: "from '@/types/$1'"
  },
  // 从 config 目录到 src 目录
  {
    pattern: /from ['"]\.\.\/src\/types\/([^'"]+)['"]/g,
    replacement: "from '@/types/$1'"
  },
  // 从 tests 目录到 src 目录
  {
    pattern: /from ['"]\.\.\/\.\.\/src\/services\/([^'"]+)['"]/g,
    replacement: "from '@/services/$1'"
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/src\/utils\/([^'"]+)['"]/g,
    replacement: "from '@/utils/$1'"
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/src\/types\/([^'"]+)['"]/g,
    replacement: "from '@/types/$1'"
  },
  {
    pattern: /from ['"]\.\.\/\.\.\/src\/hooks\/([^'"]+)['"]/g,
    replacement: "from '@/hooks/$1'"
  },
  // 同目录下的相对路径（可选，保持原样）
  // {
  //   pattern: /from ['"]\.\/([^'"]+)['"]/g,
  //   replacement: "from './$1'"
  // }
]

// 支持的文件扩展名
const SUPPORTED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']

// 需要跳过的目录
const SKIP_DIRS = ['node_modules', 'dist', '.git', '.cache', 'coverage']

async function isDirectory(path: string): Promise<boolean> {
  try {
    const stats = await stat(path)
    return stats.isDirectory()
  } catch {
    return false
  }
}

async function processFile(filePath: string): Promise<boolean> {
  try {
    const content = await readFile(filePath, 'utf-8')
    let modifiedContent = content
    let hasChanges = false

    // 应用所有路径映射规则
    for (const mapping of pathMappings) {
      const newContent = modifiedContent.replace(mapping.pattern, mapping.replacement)
      if (newContent !== modifiedContent) {
        modifiedContent = newContent
        hasChanges = true
      }
    }

    if (hasChanges) {
      await writeFile(filePath, modifiedContent, 'utf-8')
      console.log(`✅ 已更新: ${filePath}`)
      return true
    }

    return false
  } catch (error) {
    console.error(`❌ 处理文件失败 ${filePath}:`, error)
    return false
  }
}

async function processDirectory(dirPath: string): Promise<{ processed: number; updated: number }> {
  let processed = 0
  let updated = 0

  try {
    const entries = await readdir(dirPath)
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry)
      
      // 跳过不需要处理的目录
      if (SKIP_DIRS.includes(entry)) {
        continue
      }

      if (await isDirectory(fullPath)) {
        const result = await processDirectory(fullPath)
        processed += result.processed
        updated += result.updated
      } else {
        // 检查文件扩展名
        const ext = entry.substring(entry.lastIndexOf('.'))
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          processed++
          const wasUpdated = await processFile(fullPath)
          if (wasUpdated) {
            updated++
          }
        }
      }
    }
  } catch (error) {
    console.error(`❌ 处理目录失败 ${dirPath}:`, error)
  }

  return { processed, updated }
}

async function main() {
  const projectRoot = process.cwd()
  console.log('🚀 开始路径别名迁移...')
  console.log(`📁 项目根目录: ${projectRoot}`)
  console.log('')

  const startTime = Date.now()
  const result = await processDirectory(projectRoot)
  const endTime = Date.now()

  console.log('')
  console.log('📊 迁移结果:')
  console.log(`   处理文件数: ${result.processed}`)
  console.log(`   更新文件数: ${result.updated}`)
  console.log(`   耗时: ${endTime - startTime}ms`)

  if (result.updated > 0) {
    console.log('')
    console.log('✅ 迁移完成！请检查更新后的文件。')
    console.log('💡 建议运行测试确保一切正常。')
  } else {
    console.log('')
    console.log('ℹ️  没有发现需要迁移的文件。')
  }
}

// 运行脚本
main().catch(console.error)
