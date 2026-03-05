import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { errorResponse, successResponse, handleApiError } from '@/lib/api/helpers'

interface InvoiceData {
  id: string
  date: string
  amount: number
  currency: string
  status: string
  pdfUrl: string | null
  description: string | null
}

export async function GET() {
  try {
    const { userId } = await requireAuth()
    const supabase = await createClient()

    // Get the user's Stripe customer ID
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (!sub?.stripe_customer_id) {
      return successResponse([])
    }

    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: sub.stripe_customer_id,
      limit: 20,
    })

    const invoiceData: InvoiceData[] = invoices.data.map(inv => ({
      id: inv.id,
      date: new Date((inv.created || 0) * 1000).toISOString(),
      amount: (inv.amount_paid || 0) / 100,
      currency: inv.currency || 'usd',
      status: inv.status || 'unknown',
      pdfUrl: inv.invoice_pdf || null,
      description: inv.lines?.data?.[0]?.description || null,
    }))

    return successResponse(invoiceData)
  } catch (error) {
    return handleApiError(error, 'fetching invoices')
  }
}
