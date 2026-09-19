export const topics = [
  ['devops', 'DevOps', 'Delivery systems, GitOps, release engineering and platform practice.'],
  ['devsecops', 'DevSecOps', 'Security controls that live inside the engineering workflow.'],
  ['kubernetes', 'Kubernetes', 'Production operations, networking, scaling and troubleshooting.'],
  ['aws', 'AWS', 'Cloud foundations, serverless delivery and cost-aware architecture.'],
  ['azure', 'Azure', 'AKS, Container Apps, identity and enterprise cloud patterns.'],
  ['terraform', 'Terraform', 'Modules, state, policy and multi-environment infrastructure.'],
  ['github-actions', 'GitHub Actions', 'Reusable workflows, automation and secure CI/CD.'],
  ['observability', 'Observability', 'Metrics, logs, traces and alerts that support decisions.'],
  ['automation', 'Automation', 'Python, PowerShell, APIs and operational tooling.'],
  ['ai', 'AI Engineering', 'Practical AI-assisted engineering for platform teams.'],
]

export const guides = [
  ['Kubernetes Production Guide', 'A practical path from cluster baseline to reliable workloads.', 'kubernetes'],
  ['Terraform Best Practices', 'Design modules, manage state and ship infrastructure safely.', 'terraform'],
  ['DevSecOps Pipeline Guide', 'Add security signals without slowing delivery teams down.', 'devsecops'],
  ['GitHub Actions Guide', 'Build reusable, observable workflows for real repositories.', 'github-actions'],
  ['AKS Troubleshooting', 'A field checklist for identity, networking and workload failures.', 'azure'],
  ['Cloud Cost Optimization', 'Find waste, establish ownership and make FinOps actionable.', 'aws'],
]

export const resources = [
  ['Kubernetes Cheat Sheet', 'kubectl commands, rollout checks and production triage.', 'kubernetes'],
  ['Terraform Cheat Sheet', 'Core commands, state operations and module patterns.', 'terraform'],
  ['GitHub Actions Cheat Sheet', 'Workflow syntax, contexts, artifacts and environments.', 'github-actions'],
  ['Docker Cheat Sheet', 'Images, containers, registries and debugging commands.', 'devops'],
  ['Linux Commands', 'The operational commands engineers use every day.', 'automation'],
  ['AWS CLI Commands', 'Identity, storage, compute and inspection shortcuts.', 'aws'],
  ['Azure CLI Commands', 'Resource, AKS and Container Apps command patterns.', 'azure'],
  ['kubectl Commands', 'Fast checks for nodes, pods, events and networking.', 'kubernetes'],
  ['Helm Commands', 'Chart development, release management and rollback.', 'kubernetes'],
  ['Git Commands', 'Clean history, investigation and team workflows.', 'github-actions'],
]

export const services = [
  'Kubernetes / AKS', 'AWS / Azure', 'Terraform', 'CI/CD', 'DevSecOps',
  'GitHub Automation', 'Observability', 'Cloud Cost Optimization', 'Infrastructure Automation',
]

export const categoryDescriptions = {
  devops: 'Practical delivery engineering across CI/CD, GitOps, release automation and platform workflows.',
  devsecops: 'Security reporting, supply-chain controls and secure delivery patterns for modern teams.',
  kubernetes: 'Production Kubernetes engineering covering AKS, deployments, networking, ingress and observability.',
  aws: 'AWS architecture, serverless delivery, IAM, automation and cost-aware cloud operations.',
  azure: 'Azure platform engineering across AKS, Container Apps, identity and enterprise delivery.',
  terraform: 'Repeatable infrastructure through modules, state management, policy and multi-environment design.',
  'github-actions': 'Reusable workflows, migrations, security automation and reliable GitHub delivery.',
  observability: 'Metrics, logs, dashboards and alerting that help teams operate with less guesswork.',
  automation: 'Python, PowerShell, APIs and small tools that remove repetitive operational work.',
  ai: 'Grounded AI-assisted engineering patterns for productivity, safety and platform capability.',
}
