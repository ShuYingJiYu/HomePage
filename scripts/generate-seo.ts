#!/usr/bin/env tsx

/**
 * SEO Generation Script
 * Generates SEO metadata, sitemap, and robots.txt
 */

import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonicalUrl: string;
}

interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: number;
}

async function generateSEO(): Promise<void> {
  console.log('📄 SEO Generation Script');
  
  // Ensure public directory exists
  const publicDir = join(__dirname, '../public');
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }
  
  try {
    // TODO: Generate sitemap.xml
    const sitemap = generateSitemap();
    const sitemapPath = join(publicDir, 'sitemap.xml');
    writeFileSync(sitemapPath, sitemap);
    
    // TODO: Generate robots.txt
    const robotsTxt = generateRobotsTxt();
    const robotsPath = join(publicDir, 'robots.txt');
    writeFileSync(robotsPath, robotsTxt);
    
    // TODO: Generate SEO metadata
    const seoMetadata = generateSEOMetadata();
    const dataDir = join(__dirname, '../data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    const metadataPath = join(dataDir, 'seo-metadata.json');
    writeFileSync(metadataPath, JSON.stringify(seoMetadata, null, 2));
    
    console.log('ℹ️  This is a placeholder script - SEO generation will be implemented in a future task');
    console.log('✅ SEO generation completed (placeholder)');
    
  } catch (error) {
    console.error('❌ SEO generation failed:', error);
    process.exit(1);
  }
}

function generateSitemap(): string {
  const baseUrl = 'https://shuyingapp.cn';
  const entries: SitemapEntry[] = [
    {
      url: `${baseUrl}/`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 1.0
    },
    {
      url: `${baseUrl}/projects`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.8
    },
    {
      url: `${baseUrl}/tech-stack`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      url: `${baseUrl}/team`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      url: `${baseUrl}/blog`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.7
    },
    {
      url: `${baseUrl}/contact`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: 0.5
    }
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return xml;
}

function generateRobotsTxt(): string {
  const baseUrl = 'https://shuyingapp.cn';
  
  return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;
}

function generateSEOMetadata(): Record<string, SEOMetadata> {
  const baseUrl = 'https://shuyingapp.cn';
  
  return {
    home: {
      title: '书樱寄语网络工作室 - 专业的网络开发服务',
      description: '书樱寄语网络工作室提供专业的Web应用开发、移动应用开发和技术咨询服务。我们专注于现代化技术栈和用户体验优化。',
      keywords: ['网络开发', 'Web开发', '移动应用', 'React', 'TypeScript', '技术咨询'],
      ogTitle: '书樱寄语网络工作室 - Shuying Studio',
      ogDescription: '专业的网络开发工作室，提供现代化的Web应用开发和技术咨询服务',
      ogImage: `${baseUrl}/og-image.png`,
      canonicalUrl: baseUrl
    },
    projects: {
      title: '项目作品集 - 书樱寄语网络工作室',
      description: '查看我们的项目作品集，包括Web应用、移动应用和开源项目。展示我们的技术实力和创新能力。',
      keywords: ['项目作品集', '开源项目', 'Web应用', '移动应用', 'GitHub'],
      ogTitle: '项目作品集 - Shuying Studio',
      ogDescription: '查看我们的技术项目和开源贡献',
      ogImage: `${baseUrl}/og-projects.png`,
      canonicalUrl: `${baseUrl}/projects`
    }
  };
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSEO().catch(console.error);
}

export { generateSEO };
