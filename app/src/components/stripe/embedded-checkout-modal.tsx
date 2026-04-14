"use client"

import { useCallback, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Loader2, CreditCard } from 'lucide-react'

// Load Stripe.js ONCE, outside of component renders.
// The publishable key is safe to include client-side — it's not a secret.
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    process.env.STRIPE_PUBLISHABLE_KEY ||
    ''
)

interface EmbeddedCheckoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The tier the user is upgrading to (e.g. 'pro', 'agency') */
  tier: string
  /** Billing interval */
  interval?: 'monthly' | 'annual'
}

/**
 * Stripe Embedded Checkout rendered inside a Radix Dialog.
 *
 * The user stays on the PodBrain settings page. The Stripe payment form
 * renders in an iframe inside this dialog — no redirect to stripe.com.
 * After successful payment, Stripe calls our `return_url` which reloads
 * the settings page with a `?success=true` query param.
 *
 * PCI compliance: the iframe is hosted by Stripe, so PodBrain never
 * touches card data. Apple Pay / Google Pay / Link are rendered
 * automatically when available.
 */
export function EmbeddedCheckoutModal({
  open,
  onOpenChange,
  tier,
  interval = 'monthly',
}: EmbeddedCheckoutModalProps) {
  const [error, setError] = useState<string | null>(null)

  // Called by EmbeddedCheckoutProvider to get the client secret.
  // This triggers the server to create a Checkout Session and return
  // the secret that mounts the embedded form.
  const fetchClientSecret = useCallback(async () => {
    setError(null)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, interval }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || `Checkout failed (${response.status})`)
      }

      const { clientSecret } = await response.json()

      if (!clientSecret) {
        throw new Error('No client secret returned from checkout session')
      }

      return clientSecret as string
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start checkout'
      setError(message)
      throw err
    }
  }, [tier, interval])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-stone-100" />
              </div>
              <div>
                <Dialog.Title className="font-sans font-bold text-[15px] text-foreground tracking-tight">
                  Upgrade to {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </Dialog.Title>
                <Dialog.Description className="text-[11.5px] font-serif text-muted-foreground">
                  {interval === 'annual' ? 'Annual billing — save ~17%' : 'Monthly billing'}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Embedded Checkout */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {error ? (
              <div className="p-8 text-center space-y-3">
                <p className="font-sans text-sm text-destructive">{error}</p>
                <button
                  onClick={() => {
                    setError(null)
                    onOpenChange(false)
                  }}
                  className="font-sans text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Close and try again
                </button>
              </div>
            ) : (
              <div id="embedded-checkout-container" className="min-h-[400px]">
                <EmbeddedCheckoutProvider
                  stripe={stripePromise}
                  options={{ fetchClientSecret }}
                >
                  <EmbeddedCheckout className="stripe-embedded-checkout" />
                </EmbeddedCheckoutProvider>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
