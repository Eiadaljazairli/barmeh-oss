import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #e0aa30 0%, #b8881f 100%)',
          color: '#0a1f1f',
          fontSize: 22,
          fontWeight: 900,
          borderRadius: 7,
          fontFamily: 'sans-serif',
        }}
      >
        ب
      </div>
    ),
    { ...size }
  );
}
