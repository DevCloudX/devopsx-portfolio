import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Bot, Box, Check, Cloud, Code2, Command, GitBranch, Github, Menu, Network, Search, ShieldCheck, X, Zap } from 'lucide-react'
import { CONTACT_EMAIL } from '../config/contact'
import { blogs } from '../data/blogs'
import { categoryDescriptions, guides, resources, services, topics } from './content'
import './platform.css'

const siteUrl = 'https://devopsx.in'
const currentYear = new Date().getFullYear()
const iconSet = [GitBranch, ShieldCheck, Box, Cloud, Cloud, Code2, Github, Network, Zap, Bot]
const plainText = (value = '') => value.replace(/&lt;[^&]*&gt;/g, ' ').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
const articleImage = (article) => {
  const terms = `${article.category || ''} ${article.title || ''} ${article.tags?.join(' ') || ''}`.toLowerCase()
  if (/(kubernetes|k8s|aks|eks|helm|ingress|kubectl)/.test(terms)) return { src: '/images/kubernetes-production.png', alt: 'Kubernetes production cluster architecture' }
  if (/(terraform|aws|azure|cloud|finops|lambda|infrastructure)/.test(terms)) return { src: '/images/cloud-infrastructure.png', alt: 'Cloud infrastructure architecture' }
  if (/(security|devsecops|github|ci\/cd|gitlab|pipeline|automation)/.test(terms)) return { src: '/images/secure-delivery-pipeline.png', alt: 'Secure software delivery pipeline' }
  return { src: '/images/devopsx-cloud-control-plane.png', alt: 'DevOps cloud control plane' }
}

function setSeo(title, description, type = 'website') {
  document.title = title
  const descriptionTag = document.querySelector('meta[name="description"]') || document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'description' }))
  descriptionTag.content = description
  const canonical = document.querySelector('link[rel="canonical"]') || document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'canonical' }))
  canonical.href = `${siteUrl}${window.location.pathname}`
  const updates = [['meta[property="og:title"]', 'property', 'og:title', title], ['meta[property="og:description"]', 'property', 'og:description', description], ['meta[property="og:type"]', 'property', 'og:type', type], ['meta[property="og:url"]', 'property', 'og:url', canonical.href], ['meta[name="twitter:title"]', 'name', 'twitter:title', title], ['meta[name="twitter:description"]', 'name', 'twitter:description', description]]
  updates.forEach(([selector, attribute, key, content]) => {
    const tag = document.querySelector(selector) || document.head.appendChild(Object.assign(document.createElement('meta'), { [attribute]: key }))
    tag.content = content
  })
}

function Logo() {
  return <a className="platform-logo" href="/" aria-label="DevOpsX home"><span className="platform-logo-mark"><i /><i /></span><span>DevOps<span>X</span><small>ENGINEERING PLATFORM</small></span></a>
}

function Header() {
  const [open, setOpen] = useState(false)
  const links = [['Articles', '/blog'], ['Topics', '/#topics'], ['Resources', '/resources'], ['Guides', '/#guides'], ['About', '/about'], ['Freelance', '/freelance']]
  return <header className="platform-header"><div className="platform-shell platform-header-inner"><Logo /><nav className={open ? 'platform-nav is-open' : 'platform-nav'} aria-label="Primary navigation">{links.map(([label, href]) => <a href={href} key={label} onClick={() => setOpen(false)}>{label}</a>)}</nav><div className="platform-header-actions"><a className="platform-search-link" href="/search" aria-label="Search articles"><Search size={18} /></a><a className="platform-header-cta" href="/freelance">Work with me <ArrowRight size={15} /></a><button className="platform-menu" type="button" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <Menu size={21} />}</button></div></div></header>
}

function Footer() {
  return <footer className="platform-footer"><div className="platform-shell platform-footer-grid"><div><Logo /><p>Practical DevOps, cloud and platform engineering knowledge from real operational problems.</p></div><div><h3>Explore</h3><a href="/blog">Articles</a><a href="/resources">Resources</a><a href="/freelance">Freelance</a><a href="/about">About</a></div><div><h3>Topics</h3>{topics.slice(0, 5).map(([slug, title]) => <a href={`/${slug}`} key={slug}>{title}</a>)}</div><div><h3>Connect</h3><a href={`mailto:${CONTACT_EMAIL}`}>Email</a><a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a><a href="https://www.linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a><a href="/sitemap.xml">Sitemap</a></div></div><div className="platform-shell platform-footer-bottom"><span>© {currentYear} DevOpsX. Built for better engineering.</span><span><a href="/privacy">Privacy</a> <a href="/terms">Terms</a></span></div></footer>
}

function Button({ children, href, secondary = false }) { return <a className={secondary ? 'platform-button secondary' : 'platform-button'} href={href}>{children}<ArrowRight size={16} /></a> }

function HeroVisual() {
  return <div className="platform-hero-visual" aria-label="Cloud engineering control plane" role="img">
    <div className="hero-grid-lines" /><div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" />
    <div className="hero-core"><Network size={24} /><strong>CONTROL PLANE</strong><small>DEVOPSX / ONLINE</small></div>
    {[['K8S', 'node-k8s'], ['AWS', 'node-aws'], ['CI/CD', 'node-cicd'], ['SECURITY', 'node-security'], ['AI', 'node-ai']].map(([label, className]) => <span className={`hero-node ${className}`} key={label}><i />{label}</span>)}
    <div className="hero-status-card"><div><span className="hero-live-dot" /> PLATFORM STATUS <strong>99.99%</strong></div><div className="hero-sparkline"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><small>Latency stable · last deploy 04m ago</small></div>
    <div className="hero-command"><span>›</span> kubectl get deploy <b>production</b><small>6 workloads healthy</small></div>
    <div className="hero-telemetry"><span /><span /><span /><small>PIPELINES / HEALTHY</small></div>
  </div>
}

function Hero() {
  return <section className="platform-hero"><div className="platform-shell platform-hero-grid"><div className="platform-hero-copy"><span className="platform-eyebrow">DEVOPSX / ENGINEERING PLATFORM</span><h1>Reliable systems.<br /><em>Better engineering.</em></h1><p>Practical DevOps, Cloud, DevSecOps, Kubernetes, Automation and AI engineering guides built from real-world engineering problems.</p><div className="platform-actions"><Button href="#featured">Explore Articles</Button><Button href="/resources" secondary>DevOps Resources</Button><Button href="/freelance" secondary>Work With Me</Button></div><div className="platform-proof"><span><Check size={14} /> Production-minded</span><span><Check size={14} /> Cloud-native</span><span><Check size={14} /> No fluff</span></div></div><HeroVisual /></div></section>
}

function SectionHeading({ eyebrow, title, text, action }) {
  return <div className="platform-section-heading"><div><span className="platform-eyebrow">{eyebrow}</span><h2>{title}</h2></div>{text && <p>{text}</p>}{action && <a className="platform-text-link" href={action.href}>{action.label} <ArrowRight size={15} /></a>}</div>
}

function TopicCard({ topic, index }) {
  const [slug, title, description] = topic
  const Icon = iconSet[index % iconSet.length]
  return <a className="topic-card" href={`/${slug}`}><span className="topic-icon"><Icon size={20} /></span><span className="topic-index">0{index + 1}</span><h3>{title}</h3><p>{description}</p><span className="platform-text-link">Explore topic <ArrowRight size={14} /></span></a>
}

function ArticleCard({ article, featured = false }) {
  const category = article.category?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'devops'
  const visual = articleImage(article)
  return <article className={featured ? 'article-card featured' : 'article-card'}><div className="article-card-art"><img src={visual.src} alt={visual.alt} loading="lazy" decoding="async" /><span>{article.category || 'DEVOPS'}</span></div><div className="article-card-body"><div className="article-meta"><span>{article.readTime || '8 min read'}</span><span>{article.publishedAt || 'Field note'}</span></div><h3>{article.title}</h3><p>{plainText(article.excerpt) || 'Practical engineering guidance for reliable platforms and delivery systems.'}</p><a href={`/blog/${article.slug}`} className="platform-text-link">Read article <ArrowRight size={14} /></a><small className="article-author">DevOpsX Editorial / {category}</small></div></article>
}

function HomePage() {
  const featured = blogs.slice(0, 6)
  return <><Header /><main><Hero /><section className="platform-section topics-section" id="topics"><div className="platform-shell"><SectionHeading eyebrow="THE ENGINEERING MAP" title={<>Explore by <em>topic.</em></>} text="Clear starting points for the systems and workflows that matter to modern engineering teams." /><div className="topic-grid">{topics.map((topic, index) => <TopicCard topic={topic} index={index} key={topic[0]} />)}</div></div></section><section className="platform-section featured-section" id="featured"><div className="platform-shell"><SectionHeading eyebrow="FIELD NOTES" title={<>Ideas worth putting <em>into production.</em></>} action={{ href: '/blog', label: 'View all articles' }} /><div className="article-grid">{featured.map((article, index) => <ArticleCard article={article} featured={index === 0} key={article.slug} />)}</div></div></section><section className="platform-section guide-section" id="guides"><div className="platform-shell"><SectionHeading eyebrow="ENGINEERING GUIDES" title={<>Build with <em>confidence.</em></>} text="Long-form starting points for platform work, infrastructure design and operational readiness." /><div className="guide-grid">{guides.map(([title, text, topic], index) => <a className="guide-card" href={`/${topic}`} key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div><ArrowRight size={18} /></a>)}</div></div></section><ResourceSection /><ConsultingCta /><Newsletter /></main><Footer /></>
}

function ResourceSection() {
  return <section className="platform-section resource-section" id="resources-preview"><div className="platform-shell"><SectionHeading eyebrow="RESOURCE CENTER" title={<>Tools for the <em>daily work.</em></>} action={{ href: '/resources', label: 'Browse resources' }} /><div className="resource-grid">{resources.slice(0, 6).map(([title, text, topic]) => <a className="resource-card" href={`/resources#${topic}`} key={title}><Command size={18} /><div><h3>{title}</h3><p>{text}</p></div><ArrowRight size={15} /></a>)}</div></div></section>
}

function ConsultingCta() {
  return <section className="consulting-cta"><div className="platform-shell consulting-grid"><div><span className="platform-eyebrow">ENGINEERING SUPPORT</span><h2>Need help with DevOps or <em>Cloud Engineering?</em></h2></div><div><p>From Kubernetes and Terraform to CI/CD, security automation and observability, get practical support that leaves your team stronger.</p><Button href="/freelance">Let's Work Together</Button></div></div></section>
}

function Newsletter() {
  const [submitted, setSubmitted] = useState(false)
  return <section className="newsletter-section"><div className="platform-shell newsletter-box"><div><span className="platform-eyebrow">THE WEEKLY SIGNAL</span><h2>Useful ideas for your next deployment.</h2><p>No backend is connected yet. This static signup is ready for your chosen newsletter provider.</p></div>{submitted ? <strong className="newsletter-success"><Check size={17} /> Thanks. You are on the list.</strong> : <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true) }}><input required type="email" aria-label="Email address" placeholder="you@company.com" /><button type="submit">Subscribe <ArrowRight size={15} /></button></form>}</div></section>
}

function BlogPage() {
  const [query, setQuery] = useState('')
  const filtered = blogs.filter((article) => `${article.title} ${article.excerpt} ${article.category}`.toLowerCase().includes(query.toLowerCase()))
  return <><Header /><main className="inner-page"><section className="platform-shell page-intro"><span className="platform-eyebrow">DEVOPSX / FIELD NOTES</span><h1>Practical knowledge for <em>reliable systems.</em></h1><p>Technical articles across DevOps, DevSecOps, Kubernetes, cloud, automation and platform engineering.</p><div className="search-bar"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search articles, topics and tags" aria-label="Search articles" /></div></section><section className="platform-shell archive-grid"><div className="article-grid">{filtered.map((article) => <ArticleCard article={article} key={article.slug} />)}</div><aside className="archive-aside"><div className="aside-panel"><span className="platform-eyebrow">POPULAR</span><h2>Start here</h2>{guides.slice(0, 4).map(([title, , topic]) => <a href={`/${topic}`} key={title}>{title} <ArrowRight size={14} /></a>)}</div></aside></section></main><Footer /></>
}

function ArticlePage({ article }) {
  useEffect(() => {
    if (!article) return undefined
    setSeo(`${article.title} | DevOpsX`, article.excerpt || 'Practical DevOps engineering field note.', 'article')
    const script = document.createElement('script')
    script.id = 'article-structured-data'
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify([
      { '@context': 'https://schema.org', '@type': 'Article', headline: article.title, description: article.excerpt, author: { '@type': 'Organization', name: 'DevOpsX' }, datePublished: article.publishedAt || '2026-01-01', dateModified: article.publishedAt || '2026-01-01', mainEntityOfPage: `${siteUrl}/blog/${article.slug}`, publisher: { '@type': 'Organization', name: 'DevOpsX', url: siteUrl } },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl }, { '@type': 'ListItem', position: 2, name: 'Articles', item: `${siteUrl}/blog` }, { '@type': 'ListItem', position: 3, name: article.title, item: `${siteUrl}/blog/${article.slug}` }] },
    ])
    document.head.appendChild(script)
    return () => script.remove()
  }, [article])
  if (!article) return <NotFound />
  const related = blogs.filter((item) => item.slug !== article.slug && item.category === article.category).slice(0, 3)
  return <><Header /><main className="article-page"><article className="platform-shell article-layout"><div className="article-main"><a className="breadcrumb" href="/blog">Articles <ArrowRight size={13} /> {article.category}</a><span className="platform-eyebrow">{article.category} / FIELD NOTE</span><h1>{article.title}</h1><p className="article-lede">{article.excerpt}</p><div className="article-byline"><strong>DevOpsX Editorial</strong><span>{article.publishedAt || 'Published 2026'}</span><span>{article.readTime || '8 min read'}</span></div><div className="article-content"><h2 id="why">Why this matters</h2>{article.body?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<div className="production-note"><strong>Production recommendation</strong><p>Make ownership, rollback paths and operational signals explicit before this pattern reaches production.</p></div><h2 id="checklist">Production checklist</h2><ul><li>Define ownership, environments and rollback paths.</li><li>Automate repeatable checks and make failures visible.</li><li>Review security, cost and operational signals before release.</li></ul>{article.sourceUrl && <a className="platform-button" href={article.sourceUrl} target="_blank" rel="noreferrer">Read the original source <ArrowRight size={16} /></a>}</div></div><aside className="article-aside"><div className="toc"><strong>On this page</strong><a href="#why">Why this matters</a><a href="#checklist">Production checklist</a><a href="#related">Related articles</a></div><div className="aside-panel"><span className="platform-eyebrow">NEED HELP?</span><h2>Make it real.</h2><p>Get support applying the idea to your platform.</p><a href="/freelance" className="platform-text-link">Work with me <ArrowRight size={14} /></a></div></aside></article><section className="platform-shell related-section" id="related"><SectionHeading eyebrow="KEEP READING" title={<>Related <em>field notes.</em></>} /> <div className="article-grid">{related.map((item) => <ArticleCard article={item} key={item.slug} />)}</div></section></main><Footer /></>
}

function CategoryPage({ slug }) {
  const topic = topics.find(([id]) => id === slug) || topics[0]
  const categoryTerms = [topic[1].toLowerCase(), slug.toLowerCase()]
  const articles = blogs.filter((article) => categoryTerms.some((term) => `${article.title} ${article.category}`.toLowerCase().includes(term))).slice(0, 12)
  return <><Header /><main className="inner-page"><section className="platform-shell page-intro category-intro"><span className="platform-eyebrow">TOPIC / {topic[1].toUpperCase()}</span><h1>{topic[1]} <em>engineering.</em></h1><p>{categoryDescriptions[slug]}</p></section><section className="platform-shell category-content"><div><SectionHeading eyebrow="FEATURED GUIDES" title={<>Start with the <em>essentials.</em></>} /><div className="guide-grid">{guides.filter((guide) => guide[2] === slug).map(([title, text]) => <a className="guide-card" href="#articles" key={title}><span>01</span><div><h3>{title}</h3><p>{text}</p></div><ArrowRight size={18} /></a>)}</div><div id="articles" className="article-grid category-articles">{(articles.length ? articles : blogs.slice(0, 6)).map((article) => <ArticleCard article={article} key={article.slug} />)}</div></div><aside className="archive-aside"><div className="aside-panel"><span className="platform-eyebrow">RELATED RESOURCES</span>{resources.filter((resource) => resource[2] === slug).map(([title]) => <a href={`/resources#${slug}`} key={title}>{title} <ArrowRight size={14} /></a>)}</div></aside></section></main><Footer /></>
}

function ResourcesPage() {
  return <><Header /><main className="inner-page"><section className="platform-shell page-intro"><span className="platform-eyebrow">DEVOPSX / RESOURCE CENTER</span><h1>Tools for better <em>engineering.</em></h1><p>Searchable starting points, command references and production checklists for the work engineers do every day.</p></section><section className="platform-shell resource-directory">{topics.slice(0, 5).map(([slug, title]) => <div className="resource-topic" id={slug} key={slug}><div><span className="platform-eyebrow">{title.toUpperCase()}</span><h2>{title} resources</h2></div><div className="resource-list">{resources.filter((resource) => resource[2] === slug).map(([resourceTitle, text]) => <a href={`/${slug}`} key={resourceTitle}><span><strong>{resourceTitle}</strong><small>{text}</small></span><ArrowRight size={16} /></a>)}</div></div>)}</section></main><Footer /></>
}

function FreelancePage() {
  return <><Header /><main className="inner-page"><section className="platform-shell page-intro freelance-intro"><span className="platform-eyebrow">DEVOPSX / FREELANCE ENGINEERING</span><h1>DevOps & Cloud <em>Engineering Services.</em></h1><p>Practical platform help for teams that need reliable infrastructure, safer delivery and clear operational ownership.</p><Button href={`mailto:${CONTACT_EMAIL}`}>Start a Conversation</Button></section><section className="platform-shell service-layout"><div className="service-list">{services.map((service, index) => <div key={service}><span>0{index + 1}</span><h2>{service}</h2><ArrowRight size={18} /></div>)}</div><div className="process-panel"><span className="platform-eyebrow">A CLEAR PATH FORWARD</span><h2>How we work</h2>{['Discovery', 'Architecture', 'Implementation', 'Automation', 'Monitoring', 'Documentation'].map((step, index) => <div key={step}><strong>0{index + 1}</strong><span>{step}</span></div>)}</div></section></main><ConsultingCta /><Footer /></>
}

function AboutPage() {
  return <><Header /><main className="inner-page"><section className="platform-shell page-intro"><span className="platform-eyebrow">ABOUT DEVOPSX</span><h1>Engineering with <em>less friction.</em></h1><p>DevOpsX is a technical engineering platform for people building, securing and operating modern software systems.</p></section><section className="platform-shell about-grid"><div><h2>Real-world systems. <em>Useful knowledge.</em></h2></div><div><p>DevOpsX focuses on practical engineering across cloud infrastructure, Kubernetes, DevSecOps, CI/CD, observability and automation. The goal is not to add complexity. It is to make the path from idea to reliable production clearer.</p><p>AI-assisted engineering is part of that future, but it belongs inside good operating practices: explicit constraints, reviewable changes, security controls and measurable outcomes.</p></div></section></main><Footer /></>
}

function SearchPage() {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(blogs)
  useEffect(() => { fetch('/search-index.json').then((response) => response.ok ? response.json() : null).then((data) => { if (Array.isArray(data)) setIndex(data) }).catch(() => {}) }, [])
  const results = useMemo(() => index.filter((article) => `${article.title} ${article.description || article.excerpt} ${article.category} ${(article.tags || []).join(' ')}`.toLowerCase().includes(query.toLowerCase())), [index, query])
  return <><Header /><main className="inner-page"><section className="platform-shell page-intro"><span className="platform-eyebrow">DEVOPSX / SEARCH</span><h1>Find the right <em>field note.</em></h1><p>Search titles, descriptions, categories and tags across the engineering library.</p><div className="search-bar"><Search size={18} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try Kubernetes, Terraform or security" aria-label="Search the engineering library" /></div></section><section className="platform-shell search-results"><p className="results-count">{results.length} result{results.length === 1 ? '' : 's'}</p><div className="article-grid">{results.map((article) => <ArticleCard article={{ ...article, excerpt: article.description || article.excerpt }} key={article.slug} />)}</div></section></main><Footer /></>
}

function NotFound() {
  return <><Header /><main className="platform-shell not-found"><span className="platform-eyebrow">404 / NOT FOUND</span><h1>This page is not in the <em>runbook.</em></h1><p>Search the engineering library or return to the platform homepage.</p><Button href="/">Back to home</Button><Button href="/search" secondary>Search articles</Button></main><Footer /></>
}

function PlatformApp() {
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  useEffect(() => {
    const description = path === '/' ? 'Practical DevOps, cloud, DevSecOps, Kubernetes, automation and AI engineering guides.' : 'DevOpsX engineering knowledge platform for DevOps, cloud infrastructure, Kubernetes and secure delivery.'
    setSeo(path === '/' ? 'DevOpsX | Reliable Systems. Better Engineering.' : `DevOpsX | ${path.slice(1).replaceAll('-', ' ')}`, description)
  }, [path])
  if (path === '/') return <HomePage />
  if (path === '/blog') return <BlogPage />
  if (path === '/resources') return <ResourcesPage />
  if (path === '/freelance') return <FreelancePage />
  if (path === '/about') return <AboutPage />
  if (path === '/search') return <SearchPage />
  if (path.startsWith('/blog/')) return <ArticlePage article={blogs.find((item) => item.slug === path.slice(6))} />
  if (topics.some(([slug]) => `/${slug}` === path)) return <CategoryPage slug={path.slice(1)} />
  return <NotFound />
}

export default PlatformApp
