import React from "react";

interface ComparisonBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  icon?: string;
}

export const ComparisonBar: React.FC<ComparisonBarProps> = ({
  label,
  value,
  maxValue,
  color,
  icon,
}) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon && <i className={`fas ${icon} text-neutral-500 text-xs`}></i>}
          <span className="text-sm text-neutral-400">{label}</span>
        </div>
        <span className="text-sm font-mono text-white font-bold">{value}</span>
      </div>
      <div className="relative h-2 bg-neutral-900 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        ></div>
      </div>
    </div>
  );
};

interface RadarChartProps {
  data: {
    label: string;
    value: number;
  }[];
  maxValue: number;
  color: string;
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  maxValue,
  color,
  size = 200,
}) => {
  const center = size / 2;
  const radius = (size / 2) * 0.8;
  const angleStep = (2 * Math.PI) / data.length;

  const points = data.map((item, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const normalizedValue = Math.min(item.value / maxValue, 1);
    const x = center + radius * normalizedValue * Math.cos(angle);
    const y = center + radius * normalizedValue * Math.sin(angle);
    return { x, y, angle, label: item.label, value: item.value };
  });

  const pathData =
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ") +
    " Z";

  // Background grid circles
  const gridCircles = [0.25, 0.5, 0.75, 1].map((scale) => radius * scale);

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Grid circles */}
        {gridCircles.map((r, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="#262626"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {points.map((point, i) => (
          <line
            key={`axis-${i}`}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos(point.angle)}
            y2={center + radius * Math.sin(point.angle)}
            stroke="#262626"
            strokeWidth="1"
          />
        ))}

        {/* Data polygon */}
        <path
          d={pathData}
          fill={color}
          fillOpacity="0.2"
          stroke={color}
          strokeWidth="2"
        />

        {/* Data points */}
        {points.map((point, i) => (
          <circle
            key={`point-${i}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={color}
          />
        ))}

        {/* Labels */}
        {points.map((point, i) => {
          const labelRadius = radius + 25;
          const labelX = center + labelRadius * Math.cos(point.angle);
          const labelY = center + labelRadius * Math.sin(point.angle);

          return (
            <text
              key={`label-${i}`}
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px] fill-neutral-400 font-medium"
            >
              {point.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
