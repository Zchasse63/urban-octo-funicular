'use client'

import * as React from 'react'
import { Copy, Check, Linkedin, Twitter, Instagram } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SocialPostVariant } from '@/lib/guest-package/generator'

interface SocialPostCardProps {
  post: SocialPostVariant
  onContentChange?: (content: string) => void
}

const platformConfig = {
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'text-[#0A66C2]',
    bgColor: 'bg-[#0A66C2]/10',
  },
  twitter: {
    name: 'Twitter / X',
    icon: Twitter,
    color: 'text-[#1DA1F2]',
    bgColor: 'bg-[#1DA1F2]/10',
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'text-[#E4405F]',
    bgColor: 'bg-[#E4405F]/10',
  },
} as const

export function SocialPostCard({ post, onContentChange }: SocialPostCardProps) {
  const [content, setContent] = React.useState(post.content)
  const [copied, setCopied] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const config = platformConfig[post.platform]
  const Icon = config.icon
  const characterCount = content.length
  const isOverLimit = characterCount > post.maxCharacters

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    onContentChange?.(newContent)
  }

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [content])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', config.bgColor)}>
            <Icon className={cn('h-5 w-5', config.color)} />
          </div>
          <div>
            <CardTitle className="text-sm normal-case tracking-normal font-sans font-semibold text-[var(--text-primary)]">
              {config.name}
            </CardTitle>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Ready to share
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          className="shrink-0"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-[var(--accent-green)]" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </Button>
      </CardHeader>

      <CardContent>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          className={cn(
            'w-full min-h-[120px] p-3 rounded-lg border resize-none',
            'bg-[var(--bg-subtle)] border-[var(--border-soft)]',
            'text-sm text-[var(--text-primary)] leading-relaxed',
            'focus:outline-none focus:border-[var(--accent-blue)] focus:shadow-[var(--shadow-focus)]',
            'transition-colors duration-200'
          )}
          placeholder="Edit your post..."
        />

        <div className="flex items-center justify-between mt-3">
          <span
            className={cn(
              'font-mono text-xs',
              isOverLimit ? 'text-[var(--accent-red)]' : 'text-[var(--text-tertiary)]'
            )}
          >
            {characterCount.toLocaleString()} / {post.maxCharacters.toLocaleString()} characters
          </span>
          {isOverLimit && (
            <span className="text-xs text-[var(--accent-red)]">
              {characterCount - post.maxCharacters} over limit
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
