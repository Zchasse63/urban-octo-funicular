import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(135deg, #007AFF 0%, #0055CC 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '38px',
          fontWeight: 'bold',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        P
      </div>
    ),
    {
      width: 192,
      height: 192,
    }
  )
}
