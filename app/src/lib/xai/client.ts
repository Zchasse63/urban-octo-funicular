import type { ShowNotesResult, GenerateShowNotesOptions } from './types';
import { buildShowNotesPrompt } from './prompts';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function markdownToHtml(markdown: string): string {
  // Basic markdown to HTML conversion
  return markdown
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^\- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*<\/li>)/, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.*)$/gm, (match) => {
      if (match.startsWith('<')) return match;
      return `<p>${match}</p>`;
    });
}

export async function generateShowNotes(
  transcript: string,
  options: GenerateShowNotesOptions = {}
): Promise<ShowNotesResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const prompt = buildShowNotesPrompt(transcript, options);

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [
            {
              role: 'system',
              content: 'You are an expert podcast show notes writer. Generate SEO-optimized, engaging show notes that are ready to publish. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        }),
      });

      if (response.status === 429) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }

      if (!response.ok) {
        throw new Error(`xAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in xAI response');
      }

      const parsed = JSON.parse(content);
      const html = markdownToHtml(parsed.markdown);

      return {
        summary: parsed.summary,
        keyTopics: parsed.keyTopics,
        timestamps: parsed.timestamps,
        resources: parsed.resources,
        guestBio: parsed.guestBio,
        markdown: parsed.markdown,
        html,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt < MAX_RETRIES - 1) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }
    }
  }

  throw new Error(`xAI show notes generation failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}
