import 'server-only'

import { cert, getApp, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'

type FirebaseServiceAccountInput = {
  project_id?: string
  projectId?: string
  client_email?: string
  clientEmail?: string
  private_key?: string
  privateKey?: string
}

let cachedAuth: Auth | null | undefined

function normalizePrivateKey(privateKey: string) {
  return privateKey.replace(/\\n/g, '\n')
}

function buildServiceAccount(
  projectId: string | undefined,
  clientEmail: string | undefined,
  privateKey: string | undefined
) {
  if (!projectId || !clientEmail || !privateKey) {
    return null
  }

  return {
    projectId,
    clientEmail,
    privateKey: normalizePrivateKey(privateKey)
  }
}

function readServiceAccountFromJson(): ServiceAccount | null {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim()

  if (!rawServiceAccount?.startsWith('{')) {
    return null
  }

  try {
    const parsed = JSON.parse(rawServiceAccount) as FirebaseServiceAccountInput
    return (
      buildServiceAccount(
        parsed.project_id ?? parsed.projectId ?? process.env.FIREBASE_PROJECT_ID,
        parsed.client_email ?? parsed.clientEmail ?? process.env.FIREBASE_CLIENT_EMAIL,
        parsed.private_key ?? parsed.privateKey ?? process.env.FIREBASE_PRIVATE_KEY
      ) ?? null
    )
  } catch {
    return null
  }
}

function readServiceAccountFromEnv(): ServiceAccount | null {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const rawServiceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  const privateKey =
    rawServiceAccountKey && rawServiceAccountKey.includes('BEGIN PRIVATE KEY')
      ? rawServiceAccountKey
      : process.env.FIREBASE_PRIVATE_KEY

  const serviceAccount = buildServiceAccount(projectId, clientEmail, privateKey)

  if (serviceAccount) {
    return serviceAccount
  }

  return null
}

function readServiceAccount(): ServiceAccount | null {
  return readServiceAccountFromJson() ?? readServiceAccountFromEnv()
}

export function getFirebaseAdminAuth(): Auth | null {
  if (cachedAuth !== undefined) {
    return cachedAuth
  }

  if (getApps().length > 0) {
    cachedAuth = getAuth(getApp())
    return cachedAuth
  }

  const serviceAccount = readServiceAccount()

  if (!serviceAccount) {
    cachedAuth = null
    return null
  }

  const app = initializeApp({
    credential: cert(serviceAccount)
  })

  cachedAuth = getAuth(app)
  return cachedAuth
}
