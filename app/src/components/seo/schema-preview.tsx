'use client'

import * as React from 'react'
import {
  Code,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { PodcastEpisodeSchema } from '@/lib/seo/schema-generator'
import { validateSchema, schemaToJsonLd } from '@/lib/seo/schema-generator'

interface SchemaPreviewProps {
  schema: PodcastEpisodeSchema
  onValidate?: () => void
  validationUrl?: string
  className?: string
}

function SyntaxHighlightedJson({ json }: { json: string }) {
  // Simple syntax highlighting for JSON
  const highlighted = json
    // String values (after colon)
    .replace(
      /: "([^"]+)"/g,
      ': <span class="text-[var(--accent-green)]">"$1"</span>'
    )
    // Property names
    .replace(
      /"([^"]+)":/g,
      '<span class="text-[var(--accent-blue)]">"$1"</span>:'
    )
    // Numbers
    .replace(
      /: (\d+)/g,
      ': <span class="text-[var(--accent-amber)]">$1</span>'
    )
    // Booleans and null
    .replace(
      /: (true|false|null)/g,
      ': <span class="text-[var(--accent-red)]">$1</span>'
    )

  return (
    <pre
      className="text-xs font-mono leading-relaxed overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  )
}

function ValidationStatus({
  valid,
  errors,
  warnings,
}: {
  valid: boolean
  errors: string[]
  warnings: string[]
}) {
  if (valid && warnings.length === 0) {
    return (
      <div className="flex items-center gap-2 text-[var(--accent-green)]">
        <CheckCircle className="w-4 h-4" />
        <span className="text-xs font-medium">Valid Schema</span>
      </div>
    )
  }

  if (!valid) {
    return (
      <div className="flex items-center gap-2 text-[var(--accent-red)]">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-xs font-medium">{errors.length} Error{errors.length !== 1 ? 's' : ''}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-[var(--accent-amber)]">
      <AlertTriangle className="w-4 h-4" />
      <span className="text-xs font-medium">{warnings.length} Warning{warnings.length !== 1 ? 's' : ''}</span>
    </div>
  )
}

export function SchemaPreview({
  schema,
  validationUrl = 'https://search.google.com/test/rich-results',
  className,
}: SchemaPreviewProps) {
  const [copied, setCopied] = React.useState(false)
  const [showValidation, setShowValidation] = React.useState(false)

  const jsonLd = React.useMemo(() => schemaToJsonLd(schema), [schema])
  const validation = React.useMemo(() => validateSchema(schema), [schema])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonLd)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleValidate = () => {
    // Open Google's Rich Results Test in a new tab
    // Note: The actual URL would need the schema content encoded
    window.open(validationUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-4 h-4" />
          Schema Markup (JSON-LD)
        </CardTitle>
        <div className="flex items-center gap-2">
          <ValidationStatus
            valid={validation.valid}
            errors={validation.errors}
            warnings={validation.warnings}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Code Block */}
        <div className="relative">
          <div className="rounded-lg bg-[#1a1a1a] p-4 text-[#e0e0e0] overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#333]">
              <Badge variant="default" className="bg-[#333] text-[#888] border-0">
                application/ld+json
              </Badge>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowValidation(!showValidation)}
                  className="h-7 px-2 text-[#888] hover:text-white hover:bg-[#333]"
                >
                  {showValidation ? 'Hide' : 'Show'} Issues
                </Button>
              </div>
            </div>

            {/* JSON Content */}
            <div className="max-h-[300px] overflow-y-auto">
              <SyntaxHighlightedJson json={jsonLd} />
            </div>
          </div>

          {/* Copy button overlay */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            className="absolute top-3 right-3 h-8"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </Button>
        </div>

        {/* Validation Issues */}
        {showValidation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
          <div className="space-y-3">
            {validation.errors.length > 0 && (
              <div className="rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] p-3">
                <h4 className="text-xs font-semibold text-[var(--accent-red)] mb-2">
                  Errors
                </h4>
                <ul className="space-y-1">
                  {validation.errors.map((error, i) => (
                    <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                      <span className="text-[var(--accent-red)]">-</span>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div className="rounded-lg bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] p-3">
                <h4 className="text-xs font-semibold text-[var(--accent-amber)] mb-2">
                  Recommendations
                </h4>
                <ul className="space-y-1">
                  {validation.warnings.map((warning, i) => (
                    <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                      <span className="text-[var(--accent-amber)]">-</span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={handleValidate}>
            <ExternalLink className="w-3 h-3" />
            Validate with Google
          </Button>
          <p className="text-xs text-[var(--text-tertiary)]">
            Test your schema with Google&apos;s Rich Results Test
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Export syntax highlighter for reuse
export { SyntaxHighlightedJson, ValidationStatus }
