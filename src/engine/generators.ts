import type { Architecture, CloudProvider } from '../types'

const safeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '') || 'workload'

export function generateDocumentation(architecture: Architecture, projectName: string, providers: CloudProvider[]) {
  const services = architecture.nodes.map((node) => `- **${node.data.label}** (${node.data.provider.toUpperCase()}): ${node.data.category}`).join('\n') || '- No resources have been added yet.'
  const providerList = providers.map((provider) => provider.toUpperCase()).join(', ') || 'No provider selected'
  const data = architecture.nodes.filter((node) => ['database', 'storage'].includes(node.data.category))
  const links = architecture.edges.map((edge) => {
    const source = architecture.nodes.find((node) => node.id === edge.source)?.data.label ?? edge.source
    const target = architecture.nodes.find((node) => node.id === edge.target)?.data.label ?? edge.target
    return `- ${source} → ${target}`
  }).join('\n') || '- No connections are defined.'
  return `# ${projectName}\n\n## Architecture Overview\n\nA locally generated architecture description. Resource configuration and provider defaults must be reviewed before implementation.\n\n## Cloud Providers\n\n${providerList}\n\n## Network Architecture\n\nReview network boundaries, routes, ingress and egress controls before deployment.\n\n## Compute\n\n${services}\n\n## Database and Storage\n\n${data.map((node) => `- ${node.data.label}: ${node.data.provider.toUpperCase()}`).join('\n') || '- No data services are modeled.'}\n\n## Security\n\nValidate IAM scope, encryption keys, secret rotation and public exposure.\n\n## Observability\n\nSpecify logs, metrics, traces, alert thresholds and ownership.\n\n## High Availability\n\nReview multi-zone capacity and dependency failure modes.\n\n## Disaster Recovery\n\nRecord RTO, RPO, backup retention and tested recovery procedures.\n\n## Data Flow\n\n${links}\n\n## Dependencies\n\n${architecture.edges.length} connections across ${architecture.nodes.length} resources.\n\n## Architecture Decisions\n\nDocument design tradeoffs and service selection decisions here.\n\n## Risks and Recommendations\n\nRun the DevOpsX local validation rules and have the design reviewed by the relevant provider specialists.\n`
}

export function generateTerraform(architecture: Architecture, providers: CloudProvider[]) {
  const providerBlocks: Record<CloudProvider, string> = {
    aws: 'provider "aws" { region = var.aws_region }',
    azure: 'provider "azurerm" { features {} }',
    gcp: 'provider "google" { project = var.gcp_project region = var.gcp_region }',
  }
  const resources = architecture.nodes.map((node, index) => {
    const name = safeName(node.data.label)
    return `  "${name}-${index + 1}" = {\n    provider = "${node.data.provider}"\n    service  = "${node.data.serviceId}"\n    category = "${node.data.category}"\n  }`
  }).join('\n')
  const groups: Record<string, string> = {}
  for (const category of ['networking', 'compute', 'containers', 'database', 'storage', 'security']) {
    const entries = architecture.nodes.filter((node) => node.data.category === category)
    groups[`${category}.tf`] = `locals {\n  ${category}_design = [\n${entries.map((node) => `    "${node.data.provider}:${node.data.serviceId}"`).join(',\n')}\n  ]\n}\n\n# Review provider-specific resources, network placement, IAM policies, and inputs before deployment.\n`
  }
  return {
    'main.tf': `terraform {\n  required_version = ">= 1.5.0"\n  required_providers {\n    aws = { source = "hashicorp/aws" }\n    azurerm = { source = "hashicorp/azurerm" }\n    google = { source = "hashicorp/google" }\n  }\n}\n\nlocals {\n  architecture_resources = {\n${resources}\n  }\n}\n`,
    'providers.tf': `${[...new Set(providers)].map((provider) => providerBlocks[provider]).join('\n\n') || '# Select a cloud provider to generate provider configuration.'}\n`,
    'variables.tf': 'variable "aws_region" { type = string default = "us-east-1" }\nvariable "gcp_project" { type = string default = "replace-me" }\nvariable "gcp_region" { type = string default = "us-central1" }\n',
    'outputs.tf': `output "modeled_resource_count" { value = length(local.architecture_resources) }\noutput "modeled_services" { value = [for resource in values(local.architecture_resources) : resource.service] }\n`,
    ...groups,
  }
}

export function generateKubernetes(architecture: Architecture, projectName: string) {
  const workloads = architecture.nodes.filter((node) => node.data.category === 'containers' || ['eks', 'aks', 'gke'].some((name) => node.data.serviceId.includes(name)))
  const selected = workloads.length ? workloads : architecture.nodes.filter((node) => node.data.category === 'compute')
  const name = safeName(projectName)
  const app = selected[0] ? safeName(selected[0].data.label) : name
  const namespace = `apiVersion: v1\nkind: Namespace\nmetadata:\n  name: ${name}\n`
  const deployment = `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: ${app}\n  namespace: ${name}\nspec:\n  replicas: ${Number(selected[0]?.data.config.nodeCount ?? selected[0]?.data.config.desiredCount ?? 2)}\n  selector:\n    matchLabels:\n      app: ${app}\n  template:\n    metadata:\n      labels:\n        app: ${app}\n    spec:\n      containers:\n        - name: ${app}\n          image: nginx:1.27\n          ports:\n            - containerPort: 8080\n          resources:\n            requests:\n              cpu: 100m\n              memory: 128Mi\n`
  const service = `apiVersion: v1\nkind: Service\nmetadata:\n  name: ${app}\n  namespace: ${name}\nspec:\n  selector:\n    app: ${app}\n  ports:\n    - port: 80\n      targetPort: 8080\n`
  const ingress = `apiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: ${app}\n  namespace: ${name}\nspec:\n  rules:\n    - host: ${name}.example.com\n      http:\n        paths:\n          - path: /\n            pathType: Prefix\n            backend:\n              service:\n                name: ${app}\n                port:\n                  number: 80\n`
  const configmap = `apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: ${app}-config\n  namespace: ${name}\ndata:\n  APP_ENV: production\n`
  const secret = `apiVersion: v1\nkind: Secret\nmetadata:\n  name: ${app}-secret\n  namespace: ${name}\ntype: Opaque\nstringData:\n  EXAMPLE_SECRET: replace-with-external-secret-reference\n`
  const hpa = `apiVersion: autoscaling/v2\nkind: HorizontalPodAutoscaler\nmetadata:\n  name: ${app}\n  namespace: ${name}\nspec:\n  scaleTargetRef:\n    apiVersion: apps/v1\n    kind: Deployment\n    name: ${app}\n  minReplicas: 2\n  maxReplicas: 10\n  metrics:\n    - type: Resource\n      resource:\n        name: cpu\n        target:\n          type: Utilization\n          averageUtilization: 70\n`
  return { 'namespace.yaml': namespace, 'deployment.yaml': deployment, 'service.yaml': service, 'ingress.yaml': ingress, 'configmap.yaml': configmap, 'secret.yaml': secret, 'hpa.yaml': hpa }
}

export function generateHelm(architecture: Architecture, projectName: string) {
  const manifests = generateKubernetes(architecture, projectName)
  const chartName = safeName(projectName)
  const values = `replicaCount: 2\nimage:\n  repository: nginx\n  tag: "1.27"\nservice:\n  type: ClusterIP\n  port: 80\ningress:\n  enabled: true\n  className: ""\nresources:\n  requests:\n    cpu: 100m\n    memory: 128Mi\nautoscaling:\n  enabled: true\n  minReplicas: 2\n  maxReplicas: 10\n`
  const templates = Object.fromEntries(Object.entries(manifests).filter(([filename]) => filename !== 'namespace.yaml').map(([filename, content]) => [`templates/${filename}`, content]))
  return { 'Chart.yaml': `apiVersion: v2\nname: ${chartName}\ndescription: Locally generated DevOpsX chart scaffold\ntype: application\nversion: 0.1.0\nappVersion: "1.0.0"\n`, 'values.yaml': values, ...templates }
}