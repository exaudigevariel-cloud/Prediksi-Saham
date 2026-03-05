import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

interface ChartProps {
  data: any[];
}

export default function Chart({ data }: ChartProps) {
  if (!data || data.length === 0) return <div className="text-zinc-500 text-center mt-20">No data available</div>;

  const isPositive = data[data.length - 1]?.close >= data[0]?.close;
  const color = isPositive ? '#10b981' : '#f43f5e';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
        <XAxis 
          dataKey="date" 
          tickFormatter={(tick) => format(new Date(tick), 'MMM dd')}
          stroke="#52525b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          minTickGap={30}
        />
        <YAxis 
          domain={['auto', 'auto']} 
          stroke="#52525b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(tick) => `$${tick.toFixed(2)}`}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
          itemStyle={{ color: '#fff' }}
          labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
        />
        <Area 
          type="monotone" 
          dataKey="close" 
          stroke={color} 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorClose)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
