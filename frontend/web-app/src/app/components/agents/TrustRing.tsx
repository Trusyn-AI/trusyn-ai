interface TrustRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  id: string;
}

export function TrustRing({ score, size = 100, strokeWidth = 7, id }: TrustRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;

  const color =
    score >= 85 ? '#10B981' : score >= 70 ? '#F59E0B' : '#EF4444';
  const gradId = `trust-grad-${id}`;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)', position: 'absolute' }}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B3CF7" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="rgba(139,60,247,0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={score >= 70 ? `url(#${gradId})` : '#EF4444'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      {/* Center label */}
      <div className="flex flex-col items-center z-10">
        <span style={{ color: '#1A1A2E', fontSize: size * 0.22, fontWeight: 700, lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ color: '#717182', fontSize: size * 0.11, lineHeight: 1.4 }}>
          TRUST
        </span>
      </div>
    </div>
  );
}
