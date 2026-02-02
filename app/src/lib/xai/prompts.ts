export function buildShowNotesPrompt(
  transcript: string,
  options: {
    episodeTitle?: string;
    guestName?: string;
    targetKeywords?: string[];
  }
): string {
  const { episodeTitle, guestName, targetKeywords } = options;

  const prompt = `Generate comprehensive podcast show notes from the following transcript.

${episodeTitle ? `Episode Title: ${episodeTitle}\n` : ''}${guestName ? `Guest: ${guestName}\n` : ''}${targetKeywords && targetKeywords.length > 0 ? `Target Keywords: ${targetKeywords.join(', ')}\n` : ''}
Transcript:
${transcript}

Generate show notes with the following structure:

1. SUMMARY (2-3 paragraphs)
Write an engaging summary that captures the main theme and value proposition of the episode.${targetKeywords ? ` Naturally incorporate these keywords: ${targetKeywords.join(', ')}.` : ''}

2. KEY TOPICS (bullet list)
List 5-7 main topics discussed in the episode. Be specific and actionable.

3. TIMESTAMPS
Provide 5-10 key timestamps with brief descriptions of what's discussed at each point.
Format: [MM:SS] - Description

4. RESOURCES & LINKS
List all books, tools, websites, companies, or other resources mentioned in the conversation.

${guestName ? `5. GUEST BIO\nWrite a 2-3 sentence bio for ${guestName} based on information from the episode.\n` : ''}

Return the response in this exact JSON format:
{
  "summary": "...",
  "keyTopics": ["...", "..."],
  "timestamps": [{"time": 120, "description": "..."}],
  "resources": ["...", "..."],
  ${guestName ? '"guestBio": "...",' : ''}
  "markdown": "# Show Notes\\n\\n..."
}

Make the content SEO-optimized, engaging, and ready to publish. The markdown field should contain the complete formatted show notes.`;

  return prompt;
}
