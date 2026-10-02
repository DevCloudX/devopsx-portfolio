import type { Architecture, CloudProvider, Finding, Project } from './index'

export interface AIArchitectProvider {
  generateArchitecture(prompt: string): Promise<Architecture>
}

export interface CloudProviderIntegration {
  readonly provider: CloudProvider
  validateArchitecture(architecture: Architecture): Promise<Finding[]>
}

export interface GitHubProvider {
  exportProject(project: Project, repository: string): Promise<{ url: string }>
}

export interface PricingProvider {
  estimate(architecture: Architecture, provider: CloudProvider): Promise<{ currency: string; monthlyTotal: number }>
}

export interface SecurityScanner {
  scan(architecture: Architecture): Promise<Finding[]>
}

export interface DatabaseProvider {
  save(project: Project): Promise<void>
  load(projectId: string): Promise<Project | null>
  list(): Promise<Project[]>
}

export interface AuthenticationProvider {
  getCurrentUser(): Promise<{ id: string; displayName: string } | null>
  signIn(): Promise<void>
  signOut(): Promise<void>
}