import { mkdir, writeFile } from 'node:fs/promises'
import { blogs } from '../src/data/blogs.js'
import { topics } from '../src/platform/content.js'

const siteUrl = 'https://devopsx.in'
const routes = ['/', '/blog', '/resources', '/freelance', '/about', '/search', '/privacy', '/terms', ...topics.map(([slug]) => `/${slug}`), ...blogs.map((blog) => `/blog/${blog.slug}`)]
const escapeJson = (value) => JSON.stringify(value)

await mkdir(new URL('../public/', import.meta.url), { recursive: true })
const stripHtml = (value = '') => value.replace(/&lt;[^&]*&gt;/g, ' ').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
await writeFile(new URL('../public/search-index.json', import.meta.url), `${JSON.stringify(blogs.map(({ slug, title, excerpt, category, readTime, publishedAt, tags }) => ({ slug, title, description: stripHtml(excerpt), category, tags: tags || [category], readingTime: readTime, date: publishedAt || null })), null, 2)}\n`)
await writeFile(new URL('../public/sitemap.xml', import.meta.url), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((route) => `  <url><loc>${escapeJson(`${siteUrl}${route}`).slice(1, -1)}</loc></url>`).join('\n')}\n</urlset>\n`)
console.log(`Generated sitemap and search index for ${routes.length} routes.`)
