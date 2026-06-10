/**
 * @file scripts/seed-internal-users.ts
 *
 * Idempotent seed for Stockia internal test users.
 * Uses the Firebase CLI's cached credentials — no service-account.json needed.
 *
 * Usage:
 *   npm run seed                  # create/update the 3 internal users
 *   npm run seed:cleanup          # + pause known fake documents
 *
 * Collections touched:
 *   - Firebase Auth  (create / update users)
 *   - Firestore: users, commerces, distributors
 */

import * as admin from 'firebase-admin'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

// ─── Credential: refresh Firebase CLI cached token ────────────────────────────

const FIREBASE_CLIENT_ID     = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
const FIREBASE_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi'
const PROJECT_ID             = 'stockia-6b3ed'

async function getAccessToken(): Promise<string> {
  // 1. Try GOOGLE_APPLICATION_CREDENTIALS (service account) if set
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return '' // admin.initializeApp() will handle it via applicationDefault()
  }

  // 2. Use Firebase CLI cached refresh token
  const configPath = resolve(process.env.HOME ?? '~', '.config/configstore/firebase-tools.json')
  if (!existsSync(configPath)) {
    throw new Error('Firebase CLI not logged in. Run: firebase login')
  }

  const config = JSON.parse(readFileSync(configPath, 'utf-8'))
  const refreshToken: string = config?.tokens?.refresh_token

  if (!refreshToken) {
    throw new Error('No refresh token found. Run: firebase login')
  }

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     FIREBASE_CLIENT_ID,
      client_secret: FIREBASE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }).toString(),
  })

  if (!resp.ok) {
    const txt = await resp.text()
    throw new Error(`Token refresh failed: ${resp.status} ${txt}`)
  }

  const data = await resp.json() as { access_token: string }
  return data.access_token
}

async function initAdmin() {
  // If a service account is present, prefer it
  const saPath = resolve(process.cwd(), 'service-account.json')
  if (existsSync(saPath)) {
    const serviceAccount = JSON.parse(readFileSync(saPath, 'utf-8'))
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: PROJECT_ID })
    return { auth: admin.auth(), db: admin.firestore() }
  }

  // Otherwise ensure ADC exists (created from Firebase CLI cached tokens)
  await ensureADC()
  admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: PROJECT_ID })
  return { auth: admin.auth(), db: admin.firestore() }
}

async function ensureADC() {
  const adcPath = resolve(process.env.HOME ?? '~', '.config/gcloud/application_default_credentials.json')
  if (existsSync(adcPath)) return   // already set up

  const configPath = resolve(process.env.HOME ?? '~', '.config/configstore/firebase-tools.json')
  if (!existsSync(configPath)) throw new Error('Firebase CLI not logged in. Run: firebase login')

  const config = JSON.parse(readFileSync(configPath, 'utf-8'))
  const refreshToken: string | undefined = config?.tokens?.refresh_token
  if (!refreshToken) throw new Error('No Firebase CLI refresh token. Run: firebase login')

  const { mkdirSync } = await import('fs')
  const { dirname } = await import('path')
  mkdirSync(dirname(adcPath), { recursive: true })

  const { writeFileSync } = await import('fs')
  writeFileSync(adcPath, JSON.stringify({
    client_id:     FIREBASE_CLIENT_ID,
    client_secret: FIREBASE_CLIENT_SECRET,
    refresh_token: refreshToken,
    type:          'authorized_user',
  }, null, 2))

  console.log('  [adc] created ~/.config/gcloud/application_default_credentials.json from Firebase CLI tokens')
}

// ─── Internal test user definitions ───────────────────────────────────────────

const INTERNAL_USERS = [
  {
    email: 'comercio@stockia.test',
    password: 'stockia123',
    displayName: 'Comercio Demo',
    role: 'comercio' as const,
  },
  {
    email: 'distribuidora@stockia.test',
    password: 'stockia123',
    displayName: 'Distribuidora Demo',
    role: 'distribuidora' as const,
  },
  {
    email: 'admin@stockia.app',
    password: 'stockia_admin_2025',
    displayName: 'Admin Stockia',
    role: 'admin' as const,
  },
] as const

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function upsertAuthUser(
  auth: admin.auth.Auth,
  email: string,
  password: string,
  displayName: string
): Promise<string> {
  try {
    const existing = await auth.getUserByEmail(email)
    await auth.updateUser(existing.uid, { password, displayName, emailVerified: true })
    console.log(`  [auth] updated : ${email}  (uid: ${existing.uid})`)
    return existing.uid
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      const created = await auth.createUser({ email, password, displayName, emailVerified: true })
      console.log(`  [auth] created : ${email}  (uid: ${created.uid})`)
      return created.uid
    }
    throw err
  }
}

async function upsertDoc(
  db: admin.firestore.Firestore,
  collection: string,
  id: string,
  data: Record<string, unknown>
) {
  await db.collection(collection).doc(id).set(
    { ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  )
  console.log(`  [firestore] ${collection}/${id}`)
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nSeeding internal test users...\n')

  const { auth, db } = await initAdmin()
  const cleanupDemo   = process.argv.includes('--cleanup-demo')

  for (const u of INTERNAL_USERS) {
    console.log(`\n> ${u.email}  [${u.role}]`)

    const uid = await upsertAuthUser(auth, u.email, u.password, u.displayName)

    await upsertDoc(db, 'users', uid, {
      name:           u.displayName,
      email:          u.email,
      role:           u.role,
      isInternalTest: true,
    })

    if (u.role === 'comercio') {
      await upsertDoc(db, 'commerces', uid, {
        userId:                uid,
        businessName:          'Comercio Demo (Test)',
        phone:                 '',
        address:               'Test — no publicar',
        city:                  'Buenos Aires',
        province:              'Buenos Aires',
        provinceSlug:          'buenos-aires',
        citySlug:              'buenos-aires',
        locationKey:           'buenos-aires:buenos-aires',
        status:                'active',
        isInternalTest:        true,
        visibleInMarketplace:  false,
      })
    }

    if (u.role === 'distribuidora') {
      await upsertDoc(db, 'distributors', uid, {
        userId:                uid,
        companyName:           'Distribuidora Demo (Test)',
        phone:                 '',
        address:               'Test — no publicar',
        city:                  'Buenos Aires',
        province:              'Buenos Aires',
        provinceSlug:          'buenos-aires',
        citySlug:              'buenos-aires',
        locationKey:           'buenos-aires:buenos-aires',
        coverageRadiusKm:      50,
        minimumOrder:          5000,
        categories:            [],
        status:                'active',
        isInternalTest:        true,
        visibleInMarketplace:  false,
      })
    }
  }

  if (cleanupDemo) {
    console.log('\nCleanup: pausing known fake distributor/commerce documents...\n')

    const FAKE_DISTRIBUTOR_IDS = ['dist-1', 'dist-2', 'dist-3', 'dist-4', 'dist-5']
    const FAKE_COMMERCE_IDS    = ['com-1',  'com-2',  'com-3',  'com-4',  'com-5']
    const ts = admin.firestore.FieldValue.serverTimestamp()

    for (const id of FAKE_DISTRIBUTOR_IDS) {
      const snap = await db.collection('distributors').doc(id).get()
      if (snap.exists) {
        await db.collection('distributors').doc(id).update({ status: 'paused', updatedAt: ts })
        console.log(`  [cleanup] distributors/${id} → paused`)
      }
    }
    for (const id of FAKE_COMMERCE_IDS) {
      const snap = await db.collection('commerces').doc(id).get()
      if (snap.exists) {
        await db.collection('commerces').doc(id).update({ status: 'paused', updatedAt: ts })
        console.log(`  [cleanup] commerces/${id} → paused`)
      }
    }
  }

  console.log('\nDone.\n')
  process.exit(0)
}

main().catch(err => {
  console.error('\nSeed failed:', err.message ?? err)
  process.exit(1)
})
