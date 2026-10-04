import type { CloudProvider } from '../types'
import awsLogo from '../assets/providers/aws.svg'
import azureLogo from '../assets/providers/azure.svg'
import gcpLogo from '../assets/providers/gcp.svg'

const logoSources: Record<CloudProvider, string> = {
  aws: awsLogo,
  azure: azureLogo,
  gcp: gcpLogo,
}

export default function ProviderLogo({ provider }: { provider: CloudProvider }) {
  return <img className="provider-logo" src={logoSources[provider]} alt="" aria-hidden="true" draggable={false} />
}
