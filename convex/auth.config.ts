import type { AuthConfig } from 'convex/server'

const firebaseProjectId = 'tx-hash'
const firebaseIssuer = `https://securetoken.google.com/${firebaseProjectId}`
const firebaseJwks = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

export default {
  providers: [
    {
      type: 'customJwt',
      issuer: firebaseIssuer,
      applicationID: firebaseProjectId,
      jwks: firebaseJwks,
      algorithm: 'RS256'
    }
  ]
} satisfies AuthConfig
