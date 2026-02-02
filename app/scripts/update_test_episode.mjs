import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data, error } = await supabase
  .from('episodes')
  .update({
    status: 'completed',
    guest_name: 'John Smith',
    guest_email: 'john@example.com',
    guest_bio: 'Tech entrepreneur and AI enthusiast',
    transcript: 'This is a test transcript about AI and podcasting. The guest shared amazing insights about the future of content creation. We discussed how AI tools are revolutionizing the podcasting industry.',
    show_notes: 'Test show notes about AI and podcasting innovations.',
    viral_moments: [{
      timestamp: '00:01:30',
      quote: 'AI will revolutionize content creation',
      context: 'Discussion about AI in content'
    }]
  })
  .eq('id', 'bd1e28b1-5ac2-41cf-a1ab-6a2376a46e35')
  .select();

console.log('Updated:', JSON.stringify(data, null, 2));
if (error) console.error('Error:', error);
