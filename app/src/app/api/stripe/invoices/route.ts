import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

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
      return NextResponse.json({ data: [], error: null })
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

    return NextResponse.json({ data: invoiceData, error: null })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ data: null, error: 'Failed to fetch invoices' }, { status: 500 })
  }
}
