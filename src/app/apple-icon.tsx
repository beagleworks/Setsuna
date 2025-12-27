import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 120,
        background: '#0a0a0a',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        fontWeight: 700,
        color: '#00ff88',
        letterSpacing: '-4px',
      }}
    >
      S
    </div>,
    {
      ...size,
    }
  );
}
