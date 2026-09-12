import { readFile, writeFile } from 'node:fs/promises'

const feeds = [
  { name: 'Kubernetes Blog', url: 'https://kubernetes.io/feed.xml', category: 'KUBERNETES' },
  { name: 'CNCF', url: 'https://www.cncf.io/feed/', category: 'CLOUD NATIVE' },
  { name: 'GitHub Blog', url: 'https://github.blog/feed/', category: 'GITHUB' },
]
const outputPath = new URL('../src/data/remoteBlogs.js', import.meta.url)
const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
const stripTags = (value = '') => value.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim()
const readTag = (item, tag) => item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'))?.[1] || ''
const readLink = (item) => item.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim() || item.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] || ''

const entries = []
for (const feed of feeds) {
  try {
    const response = await fetch(feed.url, { headers: { 'user-agent': 'DevOpsX-Blog-Refresh/1.0' } })
    if (!response.ok) continue
    const xml = await response.text()
    const items = [...xml.matchAll(/<(item|entry)[^>]*>([\s\S]*?)<\/\1>/gi)].map((match) => match[2])
    for (const item of items.slice(0, 5)) {
      const title = stripTags(readTag(item, 'title'))
      const link = stripTags(readLink(item))
      const description = stripTags(readTag(item, 'description') || readTag(item, 'summary') || readTag(item, 'content'))
      if (title && link) entries.push({ title, link, description, source: feed.name, category: feed.category })
    }
  } catch (error) {
    console.warn(`Could not read ${feed.name}: ${error.message}`)
  }
}

const existingSource = await readFile(outputPath, 'utf8')
const existingUrls = new Set([...existingSource.matchAll(/sourceUrl: '([^']+)'/g)].map((match) => match[1]))
const next = entries.find((entry) => !existingUrls.has(entry.link))
if (!next) {
  console.log('No new blog entry found.')
  process.exit(0)
}

const safe = (value) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ')
const excerpt = next.description.slice(0, 220) || `A new ${next.category.toLowerCase()} update from ${next.source}.`
const entry = `  { id: 'remote-${Date.now()}', slug: '${slugify(next.title)}-${Date.now()}', title: '${safe(next.title)}', category: '${next.category}', readTime: 'External read', publishedAt: '${new Date().toISOString().slice(0, 10)}', excerpt: '${safe(excerpt)}', sourceUrl: '${safe(next.link)}', body: ['This DevOpsX field note highlights a new article from ${safe(next.source)}.', 'Read the original source for the complete technical details, examples and implementation guidance.', 'Use the ideas as a starting point and validate them against your own platform, security requirements and operational context.'] },\n`
const updated = existingSource.replace('export const remoteBlogs = [', `export const remoteBlogs = [\n${entry}`)
await writeFile(outputPath, updated)
console.log(`Added: ${next.title}`)
