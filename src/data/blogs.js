const topics = [
  ['Kubernetes', 'Kubernetes', 'production cluster operations, workload reliability and platform standards'],
  ['GitHub Actions', 'CI/CD', 'reusable workflows, secure releases and delivery automation'],
  ['DevSecOps', 'DEVSECOPS', 'security controls, vulnerability response and developer enablement'],
  ['Azure Container Apps', 'CLOUD', 'managed containers, environment design and Azure delivery patterns'],
  ['AWS Lambda', 'CLOUD', 'serverless architecture, event-driven systems and reliable deployments'],
  ['Terraform', 'INFRASTRUCTURE', 'repeatable infrastructure, modules and multi-environment delivery'],
  ['Helm', 'KUBERNETES', 'chart design, release management and maintainable Kubernetes configuration'],
  ['Shell scripting', 'AUTOMATION', 'portable scripts, operational tooling and safer automation'],
  ['YAML', 'CI/CD', 'configuration design, validation and readable automation pipelines'],
  ['GitLab to GitHub migration', 'MIGRATION', 'repository migration planning, workflow conversion and adoption'],
  ['GitHub Advanced Security', 'DEVSECOPS', 'code scanning, secret detection and dependency risk management'],
  ['DORA metrics', 'RELIABILITY', 'delivery performance measurement and useful engineering reporting'],
  ['FinOps', 'CLOUD', 'cloud cost ownership, visibility and practical optimization'],
  ['Prometheus', 'OBSERVABILITY', 'metrics design, alert quality and Kubernetes monitoring'],
  ['Grafana', 'OBSERVABILITY', 'operational dashboards, useful signals and incident context'],
  ['Docker', 'CONTAINERS', 'image design, build security and container troubleshooting'],
  ['EKS', 'KUBERNETES', 'AWS Kubernetes operations, scaling and production readiness'],
  ['AKS', 'KUBERNETES', 'Azure Kubernetes operations, identity and deployment patterns'],
  ['Jenkins', 'CI/CD', 'pipeline modernization, administration and migration strategy'],
  ['GitOps', 'DELIVERY', 'declarative delivery, reconciliation and environment promotion'],
  ['Secrets management', 'SECURITY', 'credential rotation, secret handling and least privilege'],
  ['Python for DevOps', 'AUTOMATION', 'API automation, reporting and practical platform tooling'],
  ['PowerShell', 'AUTOMATION', 'Windows automation, cloud operations and repeatable administration'],
  ['CI/CD testing', 'CI/CD', 'test stages, quality gates and fast feedback loops'],
  ['Platform engineering', 'PLATFORM', 'internal developer platforms, golden paths and team enablement'],
]

const formats = [
  ['A Practical Guide to', 'A practical guide with patterns, trade-offs and a production checklist.'],
  ['Best Practices for', 'A field-tested set of practices for building safer, more maintainable systems.'],
  ['Common Mistakes in', 'A troubleshooting-focused guide to the mistakes that create avoidable delivery and reliability problems.'],
  ['A Production Checklist for', 'A concise checklist for reviewing architecture, automation, security and operational readiness.'],
]

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const blogs = topics.flatMap(([topic, category, focus], topicIndex) => formats.map(([format, summary], formatIndex) => {
  const title = `${format} ${topic}`
  return {
    id: topicIndex * formats.length + formatIndex + 1,
    slug: slugify(`${title}-${topicIndex + 1}`),
    title,
    category,
    readTime: `${5 + ((topicIndex + formatIndex) % 8)} min read`,
    excerpt: `${summary} Learn how to apply ${topic.toLowerCase()} to ${focus}.`,
    body: [
      `${topic} is most useful when it reduces operational friction for engineering teams. This guide focuses on practical decisions, clear ownership and repeatable automation rather than unnecessary complexity.`,
      `Start by defining the desired outcome, the boundaries of the system and the signals that will show whether it is working. From there, introduce small, reviewable changes and document the path so the team can operate it confidently.`,
      `Use the checklist at the end of this article to review reliability, security, maintainability and developer experience before taking the pattern into production.`,
    ],
  }
}))

export const getBlogBySlug = (slug) => blogs.find((blog) => blog.slug === slug)
