import { useMemo, useState } from 'react'
import { ArrowRight, BarChart3, Bot, CalendarDays, CheckCircle2, Cloud, Code2, Github, Linkedin, Mail, Menu, Search, ShieldCheck, Terminal, X } from 'lucide-react'
import { blogs } from './data/blogs'
import './blog-home.css'

const categories = [
  { id: 'devops', title: 'DevOps', description: 'CI/CD, GitOps, Jenkins, Automation', icon: Bot, tone: 'blue', query: 'CI/CD' },
  { id: 'devsecops', title: 'DevSecOps', description: 'Security, Compliance, Secure SDLC', icon: ShieldCheck, tone: 'purple', query: 'DEVSECOPS' },
  { id: 'cloudops', title: 'CloudOps', description: 'AWS, Azure, GCP, Cloud Architecture', icon: Cloud, tone: 'green', query: 'CLOUD' },
  { id: 'automation', title: 'Automation', description: 'Python, PowerShell, n8n, APIs', icon: Code2, tone: 'orange', query: 'AUTOMATION' },
]

const featured = [
  { icon: 'K8S', category: 'KUBERNETES', tone: 'blue', match: ['kubernetes', 'aks'] },
  { icon: 'SEC', category: 'DEVSECOPS', tone: 'purple', match: ['security', 'devsecops', 'github advanced'] },
  { icon: 'IaC', category: 'CLOUDOPS', tone: 'orange', match: ['terraform', 'cloud'] },
]

const fallbackPosts = [
  { title: 'Kubernetes Best Practices for Production', excerpt: 'Key practices to run reliable and secure Kubernetes clusters in production.', category: 'KUBERNETES', readTime: '10 min read' },
  { title: 'GitHub Actions CI/CD Best Practices', excerpt: 'Tips and patterns for scalable and maintainable GitHub Actions workflows.', category: 'CI/CD', readTime: '8 min read' },
  { title: 'Optimizing AWS Costs for DevOps Workloads', excerpt: 'Practical strategies to reduce cloud costs without compromising performance.', category: 'CLOUD', readTime: '6 min read' },
]

function findPost(match) {
  return blogs.find((blog) => match.some((term) => blog.title.toLowerCase().includes(term))) || blogs[0]
}

function BlogHomeLogo() {
  return <a className="blog-home-logo" href="#top" aria-label="DevOpsX home"><span className="blog-home-mark"><i /><i /></span><span>DevOps<span>X</span><small>Learn · Build · Automate</small></span></a>
}

function BlogHome() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [notice, setNotice] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const posts = useMemo(() => blogs.length ? blogs : fallbackPosts, [])
  const latestPosts = posts.slice(0, 3)
  const popularPosts = posts.slice(3, 7)
  const filteredPosts = posts.filter((post) => `${post.title} ${post.excerpt} ${post.category}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5)

  const handleSubscribe = (event) => {
    event.preventDefault()
    setSubscribed(true)
  }

  const handleSearch = (event) => {
    event.preventDefault()
    setNotice(query.trim() ? `${filteredPosts.length} article${filteredPosts.length === 1 ? '' : 's'} found.` : 'Enter a topic or article title to search.')
  }

  return <div className="blog-home" id="top">
    <header className="blog-home-nav">
      <div className="blog-home-container blog-home-nav-inner">
        <BlogHomeLogo />
        <nav className={menuOpen ? 'blog-home-links is-open' : 'blog-home-links'} aria-label="Main navigation">
          <a className="active" href="#top" onClick={() => setMenuOpen(false)}>Home</a>
          {categories.map((category) => <a href={`#${category.id}`} key={category.id} onClick={() => setMenuOpen(false)}>{category.title}</a>)}
          <a href="#tools" onClick={() => setMenuOpen(false)}>Tools</a>
          <a href="#blog" onClick={() => setMenuOpen(false)}>Blog</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
        </nav>
        <div className="blog-home-nav-actions">
          <button className="blog-icon-button" type="button" aria-label="Search articles" onClick={() => setSearchOpen(!searchOpen)}><Search size={18} /></button>
          <a className="blog-subscribe-button" href="#newsletter">Subscribe</a>
          <button className="blog-icon-button blog-menu-button" type="button" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={23} /> : <Menu size={23} />}</button>
        </div>
      </div>
      {searchOpen && <form className="blog-nav-search blog-home-container" onSubmit={handleSearch}><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search articles, topics and tools" aria-label="Search articles" /><button type="submit"><Search size={16} /> Search</button></form>}
    </header>

    <main>
      <section className="blog-home-hero">
        <div className="blog-home-container blog-home-hero-grid">
          <div className="blog-home-hero-copy">
            <span className="blog-home-eyebrow">ENGINEERING KNOWLEDGE FOR THE CLOUD</span>
            <h1>Learn. Build. Automate.<br /><span>A Better Tomorrow.</span></h1>
            <p>Practical tutorials, architecture guides and real-world solutions for DevOps, DevSecOps, CloudOps and Automation.</p>
            <div className="blog-home-actions"><a className="blog-primary-button" href="#blog">Explore Articles <ArrowRight size={16} /></a><a className="blog-secondary-button" href="#categories">Browse by Category</a></div>
            <div className="blog-benefits"><span><strong>🎓 Practical Guides</strong>Step-by-step tutorials</span><span><strong>⌘ Real Examples</strong>Configs, YAML, code</span><span><strong>▣ Production Ready</strong>Learn from experience</span><span><strong>♙ Growing Community</strong>Let's build together</span></div>
          </div>
          <div className="blog-cloud-art" aria-label="DevOpsX cloud technology map" role="img"><div className="blog-cloud"><strong>DevOpsX</strong><small>Build · Automate · Secure · Scale</small></div><span className="blog-tech-node node-one">☸ Kubernetes</span><span className="blog-tech-node node-two">AWS</span><span className="blog-tech-node node-three">Terraform</span><span className="blog-tech-node node-four">Azure</span><span className="blog-tech-node node-five">GitHub Actions</span><span className="blog-tech-node node-six">Security</span></div>
        </div>
      </section>

      <section className="blog-home-section blog-featured-section" id="blog"><div className="blog-home-container"><div className="blog-section-heading"><div><h2>Featured Articles</h2><p>Handpicked guides to help you build, secure and scale your infrastructure.</p></div><a href="/blog">View All Articles <ArrowRight size={15} /></a></div><div className="blog-article-grid">{featured.map((item) => { const post = findPost(item.match); return <article className="blog-article-card" key={item.category}><div className={`blog-article-art ${item.tone}`}><strong>{item.icon}</strong><span>{item.category}</span></div><div className="blog-article-body"><span className="blog-category">{item.category}</span><h3>{post?.title || 'Production engineering field note'}</h3><p>{post?.excerpt || 'Practical guidance for reliable infrastructure and delivery.'}</p><div className="blog-meta"><CalendarDays size={12} /> {post?.readTime || '8 min read'}</div><a href={post ? `/blog/${post.slug}` : '/blog'}>Read article <ArrowRight size={14} /></a></div></article> })}</div></div></section>

      <section className="blog-home-section blog-categories-section" id="categories"><div className="blog-home-container"><div className="blog-section-heading"><div><h2>Explore by Category</h2><p>Browse articles by topic and level up your skills.</p></div><a href="/blog">View All Categories <ArrowRight size={15} /></a></div><div className="blog-category-grid">{categories.map(({ id, title, description, icon: Icon, tone, query: categoryQuery }) => <a className="blog-category-card" id={id} href={`/blog?category=${categoryQuery}`} key={id}><span className={`blog-category-icon ${tone}`}><Icon size={20} /></span><h3>{title}</h3><p>{description}</p><span className="blog-card-link">Explore <ArrowRight size={14} /></span></a>)}</div></div></section>

      <section className="blog-newsletter" id="newsletter"><div className="blog-home-container blog-newsletter-box"><div className="blog-newsletter-copy"><span className="blog-mail-icon"><Mail size={20} /></span><div><h2>Join the DevOpsX Newsletter</h2><p>Get the latest DevOps, Cloud and Automation articles straight to your inbox.</p></div></div>{subscribed ? <p className="blog-form-success"><CheckCircle2 size={16} /> You're on the list. Watch your inbox.</p> : <form className="blog-inline-form" onSubmit={handleSubscribe}><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email address" aria-label="Email address" /><button type="submit">Subscribe</button></form>}</div></section>

      <section className="blog-home-section blog-latest-section" id="tools"><div className="blog-home-container blog-latest-grid"><div><div className="blog-section-heading"><div><h2>Latest Articles</h2><p>Stay updated with the newest content.</p></div><a href="/blog">View All Posts <ArrowRight size={15} /></a></div>{latestPosts.map((post, index) => <a className="blog-post-row" href={`/blog/${post.slug}`} key={post.slug || post.title}><span className={`blog-post-thumb tone-${index}`}>{index === 0 ? '☸' : index === 1 ? '◉' : 'aws'}</span><span><h3>{post.title}</h3><p>{post.excerpt}</p><small><CalendarDays size={12} /> {post.readTime}</small></span></a>)}</div><aside className="blog-sidebar"><div className="blog-side-box"><h3>Search Articles</h3><form className="blog-search-box" onSubmit={handleSearch}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for articles, tutorials, tools..." aria-label="Search for articles" /><button type="submit" aria-label="Submit search"><Search size={16} /></button></form>{notice && <p className="blog-search-notice">{notice}</p>}</div><div className="blog-side-box"><h3>Popular Articles</h3>{popularPosts.map((post) => <a className="blog-popular-post" href={`/blog/${post.slug}`} key={post.slug}><span className="popular-icon"><BarChart3 size={15} /></span><span><strong>{post.title}</strong><small>{post.readTime}</small></span></a>)}</div></aside></div></section>
    </main>

    <footer className="blog-home-footer" id="about"><div className="blog-home-container blog-footer-grid"><div><BlogHomeLogo /><p>A technical blog for DevOps, DevSecOps, CloudOps and Automation. Sharing practical knowledge to help you build a better tomorrow.</p></div><div><h3>Quick Links</h3><a href="#top">Home</a><a href="#categories">Categories</a><a href="#blog">Blog</a><a href="#about">About</a><a href="#newsletter">Contact</a></div><div><h3>Categories</h3>{categories.map((category) => <a href={`#${category.id}`} key={category.id}>{category.title}</a>)}<a href="#tools">Tools</a></div><div><h3>Follow Me</h3><div className="blog-social-links"><a href="https://www.linkedin.com" aria-label="LinkedIn"><Linkedin size={17} /></a><a href="https://github.com" aria-label="GitHub"><Github size={17} /></a><a href="#blog" aria-label="Blog"><Terminal size={17} /></a><a href={`mailto:hello@devopsx.in`} aria-label="Email"><Mail size={17} /></a></div><p className="blog-footer-tagline">Keep Learning.<br />Keep Building.<br />— DevOpsX</p></div></div><div className="blog-home-container blog-footer-bottom"><span>© 2026 DevOpsX. All rights reserved.</span><span>Built for the DevOps community.</span></div></footer>
  </div>
}

export default BlogHome
