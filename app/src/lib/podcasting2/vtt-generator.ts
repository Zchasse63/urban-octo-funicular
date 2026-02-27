/**
 * WebVTT Generator
 *
 * Converts PodBrain's transcript segments (from AssemblyAI) into
 * standard WebVTT format for use with the <podcast:transcript> tag.
 *
 * Spec: https://www.w3.org/TR/webvtt1/
 */

export interface TranscriptSegment {
  text: string;
  start: number; // milliseconds
  end: number; // milliseconds
  speaker?: string | null;
  confidence?: number;
}

/**
 * Generate a WebVTT string from transcript segments.
 *
 * Each segment becomes a cue with optional speaker voice tags.
 * Speaker labels use the WebVTT <v> (voice) tag syntax.
 */
export function generateVTT(segments: TranscriptSegment[]): string {
  let vtt = 'WEBVTT\n\n';

  segments.forEach((seg, i) => {
    const startTime = formatVTTTime(seg.start);
    const endTime = formatVTTTime(seg.end);
    const speaker = seg.speaker ? `<v ${seg.speaker}>` : '';
    vtt += `${i + 1}\n${startTime} --> ${endTime}\n${speaker}${seg.text}\n\n`;
  });

  return vtt;
}

/**
 * Format milliseconds into WebVTT timestamp: HH:MM:SS.mmm
 */
function formatVTTTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad3(millis)}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function pad3(n: number): string {
  return n.toString().padStart(3, '0');
}
