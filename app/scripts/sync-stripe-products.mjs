#!/usr/bin/env node
/**
 * Sync Stripe products/prices to match the pricing refactor.
 *
 * Target state (from app/src/lib/pricing.ts):
 *   Pro       $29/mo   $290/yr    300 min/mo
 *   Creator   $59/mo   $590/yr  1,200 min/mo
 *   Agency   $149/mo  $1490/yr  3,600 min/mo
 *
 * What it does:
 *   1. Looks for an existing product per tier by name (case-insensitive).
 *   2. Creates a new product if none found, or updates metadata if found.
 *   3. Creates a new monthly + annual Price under each product at the target
 *      amounts, recurring = month/year. Existing prices stay active (which is
 *      the right thing for existing subscribers).
 *   4. Writes a JSON summary of the new price IDs to scripts/stripe-sync-result.json
 *      so we can update .env.local from it in a follow-up step.
 *
 * Guardrails:
 *   - Dry run by default. Pass --apply to actually write to Stripe.
 *   - Never deletes anything.
 *   - Never deactivates existing prices — that's a manual step for ops.
 *   - Skips creating a new price if an existing active price on the same
 *     product already has the exact target amount + interval.
 */

import { readFileSync } from 'node:fs'
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import Stripe from 'stripe'

const __dirname = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')

// Load .env.local manually so this script works outside Next's dev server
const envPath = resolve(__dirname, '..', '.env.local')
const envText = readFileSync(envPath, 'utf8')
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m) process.env[m[1]] = m[2]
}

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY not found in .env.local')
  process.exit(1)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
})

/** @type {Array<{tier: string, name: string, monthly: number, annual: number, minutes: number, features: string[]}>} */
const TARGET_TIERS = [
  {
    tier: 'pro',
    name: 'PodBrain Pro',
    monthly: 2900, // cents
    annual: 29000,
    minutes: 300,
    features: [
      '300 minutes of audio/month',
      '2 podcast shows',
      'AI show notes, assets, SEO, guest packages',
    ],
  },
  {
    tier: 'creator',
    name: 'PodBrain Creator',
    monthly: 5900,
    annual: 59000,
    minutes: 1200,
    features: [
      '1,200 minutes of audio/month',
      '10 podcast shows',
      'Hosting push, pre-interview intel, webhooks, bulk upload',
    ],
  },
  {
    tier: 'agency',
    name: 'PodBrain Agency',
    monthly: 14900,
    annual: 149000,
    minutes: 3600,
    features: [
      '3,600 minutes of audio/month',
      'Unlimited podcast shows',
      'Agency-scale processing, priority support',
    ],
  },
]

async function findExistingProduct(tier, name) {
  const products = await stripe.products.list({ active: true, limit: 100 })
  // Match by metadata.tier first (most reliable), then name fallback
  let match = products.data.find((p) => p.metadata?.tier === tier)
  if (!match) {
    match = products.data.find((p) =>
      p.name.toLowerCase().includes(tier.toLowerCase())
    )
  }
  return match ?? null
}

async function findMatchingPrice(productId, unitAmount, interval) {
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  })
  return (
    prices.data.find(
      (p) =>
        p.unit_amount === unitAmount &&
        p.currency === 'usd' &&
        p.recurring?.interval === interval
    ) ?? null
  )
}

async function ensureProduct(target) {
  const existing = await findExistingProduct(target.tier, target.name)
  const description = `${target.minutes} minutes of audio/month.\n${target.features.join('\n')}`

  if (existing) {
    console.log(
      `  ✓ Product exists: ${existing.id} (${existing.name}) — updating metadata`
    )
    if (APPLY) {
      await stripe.products.update(existing.id, {
        name: target.name,
        description,
        metadata: { tier: target.tier, audio_minutes_per_month: String(target.minutes) },
      })
    }
    return existing
  }

  console.log(`  + Creating product "${target.name}"`)
  if (!APPLY) {
    return {
      id: `PRODUCT_PLACEHOLDER_${target.tier.toUpperCase()}`,
      name: target.name,
    }
  }
  const created = await stripe.products.create({
    name: target.name,
    description,
    metadata: { tier: target.tier, audio_minutes_per_month: String(target.minutes) },
  })
  return created
}

async function ensurePrice(product, unitAmount, interval, label) {
  // Skip look-up in dry run to avoid noisy API errors with placeholder product IDs
  if (APPLY) {
    const existing = await findMatchingPrice(product.id, unitAmount, interval)
    if (existing) {
      console.log(
        `    ✓ Price exists (${label}): ${existing.id} — $${unitAmount / 100}/${interval}`
      )
      return existing.id
    }
  }

  console.log(
    `    + Creating ${label} price: $${unitAmount / 100} / ${interval}`
  )
  if (!APPLY) {
    return `PRICE_PLACEHOLDER_${product.name.replace(/\s+/g, '_').toUpperCase()}_${interval.toUpperCase()}`
  }
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: unitAmount,
    currency: 'usd',
    recurring: { interval },
    nickname: label,
  })
  return price.id
}

async function main() {
  console.log('\nStripe sync for pricing refactor')
  console.log('================================')
  console.log(`Mode: ${APPLY ? '🔴 APPLY (writes to live Stripe)' : '🟡 DRY RUN (no writes)'}`)
  console.log(`Key:  ${process.env.STRIPE_SECRET_KEY.startsWith('sk_live') ? 'LIVE' : 'TEST'}`)
  console.log('')

  const result = {
    mode: APPLY ? 'apply' : 'dry-run',
    timestamp: new Date().toISOString(),
    tiers: {},
  }

  for (const target of TARGET_TIERS) {
    console.log(`Tier: ${target.tier}`)
    const product = await ensureProduct(target)
    const monthlyId = await ensurePrice(
      product,
      target.monthly,
      'month',
      `${target.name} Monthly`
    )
    const annualId = await ensurePrice(
      product,
      target.annual,
      'year',
      `${target.name} Annual`
    )
    result.tiers[target.tier] = {
      productId: product.id,
      monthlyPriceId: monthlyId,
      annualPriceId: annualId,
    }
    console.log('')
  }

  const outPath = resolve(__dirname, 'stripe-sync-result.json')
  writeFileSync(outPath, JSON.stringify(result, null, 2))
  console.log(`Wrote result to ${outPath}`)

  console.log('')
  console.log('New env var values:')
  console.log(`  STRIPE_PRO_PRICE_ID=${result.tiers.pro.monthlyPriceId}`)
  console.log(`  STRIPE_PRO_ANNUAL_PRICE_ID=${result.tiers.pro.annualPriceId}`)
  console.log(`  STRIPE_CREATOR_PRICE_ID=${result.tiers.creator.monthlyPriceId}`)
  console.log(`  STRIPE_CREATOR_ANNUAL_PRICE_ID=${result.tiers.creator.annualPriceId}`)
  console.log(`  STRIPE_AGENCY_PRICE_ID=${result.tiers.agency.monthlyPriceId}`)
  console.log(`  STRIPE_AGENCY_ANNUAL_PRICE_ID=${result.tiers.agency.annualPriceId}`)

  if (!APPLY) {
    console.log('')
    console.log('Dry run complete. Re-run with --apply to write to Stripe.')
  }
}

main().catch((err) => {
  console.error('\nFailed:', err.message)
  if (err.raw) console.error(err.raw)
  process.exit(1)
})
