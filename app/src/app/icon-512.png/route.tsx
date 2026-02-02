import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 340,
          background: 'linear-gradient(135deg, #007AFF 0%, #0055CC 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '102px',
          fontWeight: 'bold',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        P
      </div>
    ),
    {
      width: 512,
      height: 512,
    }
  )
}
