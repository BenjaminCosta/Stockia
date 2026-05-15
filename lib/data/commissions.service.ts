import {
  getDocumentsByField,
  updateDocument,
} from '../firebase/firestore'
import { COLLECTIONS } from '../firebase/collections'

// ─── Firestore shape ──────────────────────────────────────────────────────────

export type CommissionStatus = 'pending' | 'paid' | 'overdue'

export interface FirestoreCommission {
  distributorId: string
  orderId: string
  orderTotal: number
  commissionRate: number   // always 0.015
  commissionAmount: number
  status: CommissionStatus
  period: string           // "YYYY-MM"
  createdAt: unknown
  paidAt?: unknown
}

export interface CommissionSummary {
  period: string
  totalOrders: number
  totalSales: number
  commissionAmount: number
  status: CommissionStatus
}

// ─── Mock fallback data ───────────────────────────────────────────────────────

const MOCK_COMMISSIONS: (FirestoreCommission & { id: string })[] = [
  {
    id: 'comm-1',
    distributorId: 'dist-1',
    orderId: 'order-1',
    orderTotal: 100680,
    commissionRate: 0.015,
    commissionAmount: 1510.2,
    status: 'paid',
    period: '2024-03',
    createdAt: '2024-03-11T10:00:00',
    paidAt: '2024-04-01T00:00:00',
  },
  {
    id: 'comm-2',
    distributorId: 'dist-1',
    orderId: 'order-6',
    orderTotal: 70800,
    commissionRate: 0.015,
    commissionAmount: 1062,
    status: 'pending',
    period: '2024-03',
    createdAt: '2024-03-12T09:00:00',
  },
  {
    id: 'comm-3',
    distributorId: 'dist-2',
    orderId: 'order-9',
    orderTotal: 149100,
    commissionRate: 0.015,
    commissionAmount: 2236.5,
    status: 'pending',
    period: '2024-03',
    createdAt: '2024-03-09T12:00:00',
  },
  {
    id: 'comm-4',
    distributorId: 'dist-4',
    orderId: 'order-17',
    orderTotal: 117720,
    commissionRate: 0.015,
    commissionAmount: 1765.8,
    status: 'overdue',
    period: '2024-03',
    createdAt: '2024-03-09T14:00:00',
  },
]

// ─── Service ──────────────────────────────────────────────────────────────────

/** Returns all commissions for a distributor. */
export async function getCommissionsByDistributor(
  distributorId: string
): Promise<(FirestoreCommission & { id: string })[]> {
  try {
    const docs = await getDocumentsByField<FirestoreCommission>(
      COLLECTIONS.commissions,
      'distributorId',
      '==',
      distributorId
    )
    if (docs.length > 0) return docs
  } catch {
    // fall through
  }
  return MOCK_COMMISSIONS.filter(c => c.distributorId === distributorId)
}

/** Returns all commissions (admin view). */
export async function getAllCommissions(): Promise<(FirestoreCommission & { id: string })[]> {
  try {
    const docs = await getDocumentsByField<FirestoreCommission>(
      COLLECTIONS.commissions,
      'status',
      'in',
      ['pending', 'paid', 'overdue']
    )
    if (docs.length > 0) return docs
  } catch {
    // fall through
  }
  return MOCK_COMMISSIONS
}

/**
 * Returns a monthly summary of commissions for a distributor.
 * Useful for the distribuidora ventas panel.
 */
export async function getCommissionSummaryByDistributor(
  distributorId: string
): Promise<CommissionSummary[]> {
  const commissions = await getCommissionsByDistributor(distributorId)

  const byPeriod: Record<string, CommissionSummary> = {}

  for (const c of commissions) {
    if (!byPeriod[c.period]) {
      byPeriod[c.period] = {
        period: c.period,
        totalOrders: 0,
        totalSales: 0,
        commissionAmount: 0,
        status: c.status,
      }
    }
    byPeriod[c.period].totalOrders += 1
    byPeriod[c.period].totalSales += c.orderTotal
    byPeriod[c.period].commissionAmount += c.commissionAmount
    // If any commission in the period is overdue, mark the whole period overdue
    if (c.status === 'overdue') byPeriod[c.period].status = 'overdue'
  }

  return Object.values(byPeriod).sort((a, b) => b.period.localeCompare(a.period))
}

/**
 * Mark a commission as paid (admin action).
 * TODO: restrict to admin role via Firestore rules.
 */
export async function markCommissionAsPaid(id: string): Promise<void> {
  await updateDocument(COLLECTIONS.commissions, id, {
    status: 'paid' as CommissionStatus,
    paidAt: new Date().toISOString(),
  })
}

/**
 * Mark a commission as overdue (admin cron / batch action).
 * TODO: automate with a Cloud Function scheduled job.
 */
export async function markCommissionAsOverdue(id: string): Promise<void> {
  await updateDocument(COLLECTIONS.commissions, id, {
    status: 'overdue' as CommissionStatus,
  })
}
