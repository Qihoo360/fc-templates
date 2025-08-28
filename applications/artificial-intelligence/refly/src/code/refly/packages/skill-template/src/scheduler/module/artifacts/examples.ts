// Examples of reactive artifacts
export const reactiveArtifactExamples = `## Examples

<example index="1">
<query>
Create a React mindmap component that visualizes hierarchical data
</query>
<response>
I'll create a React mindmap component for visualizing hierarchical data.

<reflyThinking>
1. Requirement Analysis: Need a React component to visualize hierarchical data as a mindmap
2. Component Architecture: Create a recursive component structure to handle nodes at different levels
3. Data Flow: Use props for data input, internal state for interactive elements
4. Visual Design: Nodes with connecting lines, different colors for hierarchy levels
5. Implementation Strategy: Use SVG for rendering, React hooks for state management, memoization for performance
</reflyThinking>

<reflyArtifact identifier="react-mindmap" type="react-component" title="MindMapComponent" language="typescript">
import React, { useState, useMemo, useCallback } from 'react';

// Define the data structure for mind map nodes
type MindMapNode = {
  id: string;
  label: string;
  children?: MindMapNode[];
  color?: string;
};

type MindMapProps = {
  data: MindMapNode;
  width?: number;
  height?: number;
  nodePadding?: number;
  lineColor?: string;
  fontSize?: number;
  initialScale?: number;
};

// Calculate positions for nodes in the mind map
const calculatePositions = (node: MindMapNode, x: number, y: number, level: number, parentAngle = 0): any => {
  const nodeWithPosition = {
    ...node,
    x,
    y,
    level,
  };
  
  if (!node.children?.length) return nodeWithPosition;
  
  const childAngleStep = Math.PI / (node.children.length + 1);
  const radius = 100 + level * 50;
  const childNodes = node.children.map((child, index) => {
    const angle = parentAngle + (index + 1) * childAngleStep;
    const childX = x + Math.cos(angle) * radius;
    const childY = y + Math.sin(angle) * radius;
    return calculatePositions(child, childX, childY, level + 1, angle);
  });
  
  return {
    ...nodeWithPosition,
    children: childNodes,
  };
};

// Node component
const Node: React.FC<{
  node: any;
  onNodeClick: (node: any) => void;
  fontSize: number;
}> = React.memo(({ node, onNodeClick, fontSize }) => {
  const nodeColor = node.color || 'hsl(' + (node.level * 30) % 360 + ', 70%, 60%)';
  
  return (
    <g>
      {node.children?.map((child: any) => (
        <line
          key={'line-' + node.id + '-' + child.id}
          x1={node.x}
          y1={node.y}
          x2={child.x}
          y2={child.y}
          stroke="#999"
          strokeWidth={1.5}
          strokeOpacity={0.6}
        />
      ))}
      <circle
        cx={node.x}
        cy={node.y}
        r={30}
        fill={nodeColor}
        stroke="#666"
        strokeWidth={1}
        onClick={() => onNodeClick(node)}
        style={{ cursor: 'pointer' }}
      />
      <text
        x={node.x}
        y={node.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fill="#fff"
        style={{ pointerEvents: 'none' }}
      >
        {node.label}
      </text>
      {node.children?.map((child: any) => (
        <Node key={child.id} node={child} onNodeClick={onNodeClick} fontSize={fontSize} />
      ))}
    </g>
  );
});

const MindMap: React.FC<MindMapProps> = React.memo(({
  data,
  width = 800,
  height = 600,
  nodePadding = 10,
  lineColor = '#999',
  fontSize = 12,
  initialScale = 1,
}) => {
  const [transform, setTransform] = useState({ x: width / 2, y: height / 2, scale: initialScale });
  const [selectedNode, setSelectedNode] = useState<any>(null);
  
  // Calculate node positions
  const positionedData = useMemo(() => {
    return calculatePositions(data, 0, 0, 0);
  }, [data]);
  
  // Handle node click
  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
  }, []);
  
  // Handle zoom and pan
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleChange = e.deltaY * -0.001;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(2, prev.scale + scaleChange)),
    }));
  }, []);
  
  // Handle mouse drag for panning
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setTransform(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, dragStart]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  return (
    <div className="mindmap-container" style={{ width, height, overflow: 'hidden' }}>
      <svg
        width={width}
        height={height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <g transform={'translate(' + transform.x + ', ' + transform.y + ') scale(' + transform.scale + ')'}>
          <Node node={positionedData} onNodeClick={handleNodeClick} fontSize={fontSize} />
        </g>
      </svg>
      {selectedNode && (
        <div className="node-details" style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          padding: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '5px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
        }}>
          <h3>{selectedNode.label}</h3>
          <p>ID: {selectedNode.id}</p>
          <p>Level: {selectedNode.level}</p>
          <p>Children: {selectedNode.children?.length || 0}</p>
        </div>
      )}
    </div>
  );
});

export default MindMap;
</reflyArtifact>

<example index="2">
<query>
Create a React dashboard component that displays stock market data with charts
</query>
<response>
I'll create a React dashboard for visualizing stock market data with interactive charts.

<reflyThinking>
1. Requirement Analysis: Need a React dashboard to display stock market data with charts
2. Component Architecture: Create a dashboard layout with multiple chart components
3. Data Flow: Mock data structure for stocks, state management for filtering and time ranges
4. Visual Design: Line charts for price history, bar charts for volume, cards for key metrics
5. Implementation Strategy: Use React hooks for state, CSS Grid for layout, performance optimization with memoization
</reflyThinking>

<reflyArtifact identifier="stock-dashboard" type="react-component" title="StockDashboard" language="typescript">
import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Types for our stock data
type StockData = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  history: {
    date: string;
    price: number;
    volume: number;
  }[];
  metrics: {
    marketCap: number;
    peRatio: number;
    dividend: number;
    avgVolume: number;
  };
};

type StockDashboardProps = {
  stocks?: StockData[];
  defaultSymbol?: string;
  refreshInterval?: number;
  theme?: 'light' | 'dark';
};

// Mock data generator (in a real app, this would be API data)
const generateMockStockData = (): StockData[] => {
  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META'];
  const names = ['Apple Inc.', 'Alphabet Inc.', 'Microsoft Corp.', 'Amazon.com Inc.', 'Meta Platforms Inc.'];
  
  return symbols.map((symbol, index) => {
    const basePrice = Math.random() * 500 + 100;
    const change = (Math.random() * 20) - 10;
    const changePercent = (change / basePrice) * 100;
    
    // Generate 30 days of history
    const history = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dailyVariation = (Math.random() * 20) - 10;
      const historyPrice = basePrice + dailyVariation;
      return {
        date: date.toISOString().split('T')[0],
        price: parseFloat(historyPrice.toFixed(2)),
        volume: Math.floor(Math.random() * 10000000) + 1000000,
      };
    });
    
    return {
      symbol,
      name: names[index],
      price: parseFloat(basePrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      history,
      metrics: {
        marketCap: parseFloat((basePrice * (Math.random() * 10 + 5) * 1000000000).toFixed(2)),
        peRatio: parseFloat((Math.random() * 50 + 10).toFixed(2)),
        dividend: parseFloat((Math.random() * 3).toFixed(2)),
        avgVolume: Math.floor(Math.random() * 20000000) + 5000000,
      }
    };
  });
};

// Helper to format large numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return '$' + (num / 1000000000).toFixed(2) + 'B';
  } else if (num >= 1000000) {
    return '$' + (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return '$' + (num / 1000).toFixed(2) + 'K';
  }
  return '$' + num.toFixed(2);
};

// Price Chart Component
const PriceChart: React.FC<{ data: StockData['history'], theme: 'light' | 'dark' }> = React.memo(({ data, theme }) => {
  if (!data?.length) return null;
  
  const chartHeight = 200;
  const chartWidth = 600;
  const padding = { top: 20, right: 30, bottom: 30, left: 50 };
  
  // Calculate min and max for scaling
  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices) * 0.95;
  const maxPrice = Math.max(...prices) * 1.05;
  
  // Create path data for price line
  const pathData = data.map((d, i) => {
    const x = padding.left + (i * (chartWidth - padding.left - padding.right) / (data.length - 1));
    const y = chartHeight - padding.bottom - ((d.price - minPrice) / (maxPrice - minPrice)) * (chartHeight - padding.top - padding.bottom);
    return (i === 0 ? 'M' : 'L') + x + ',' + y;
  }).join(' ');
  
  // Create gradient for area under curve
  const areaPathData = pathData + ' L' + (padding.left + (chartWidth - padding.left - padding.right)) + ',' + (chartHeight - padding.bottom) + ' L' + padding.left + ',' + (chartHeight - padding.bottom) + ' Z';
  
  const textColor = theme === 'dark' ? '#e0e0e0' : '#333';
  const gridColor = theme === 'dark' ? '#444' : '#eee';
  
  return (
    <svg width={chartWidth} height={chartHeight} className="price-chart">
      {/* Grid lines */}
      {Array.from({ length: 5 }, (_, i) => {
        const y = chartHeight - padding.bottom - (i * (chartHeight - padding.top - padding.bottom) / 4);
        const price = minPrice + (i * (maxPrice - minPrice) / 4);
        return (
          <g key={'grid-' + i}>
            <line
              x1={padding.left}
              y1={y}
              x2={chartWidth - padding.right}
              y2={y}
              stroke={gridColor}
              strokeWidth={1}
              strokeDasharray="5,5"
            />
            <text
              x={padding.left - 10}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
              fill={textColor}
            >
              {price.toFixed(2)}
            </text>
          </g>
        );
      })}
      
      {/* X-axis labels */}
      {data.filter((_, i) => i % 5 === 0).map((d, i) => (
        <text
          key={'x-label-' + i}
          x={padding.left + (i * 5 * (chartWidth - padding.left - padding.right) / (data.length - 1))}
          y={chartHeight - padding.bottom + 15}
          textAnchor="middle"
          fontSize={10}
          fill={textColor}
        >
          {d.date.substring(5)}
        </text>
      ))}
      
      {/* Area under curve with gradient */}
      <defs>
        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={data[data.length - 1].price >= data[0].price ? 'rgba(0, 128, 0, 0.3)' : 'rgba(220, 0, 0, 0.3)'} />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
        </linearGradient>
      </defs>
      <path d={areaPathData} fill="url(#areaGradient)" />
      
      {/* Price line */}
      <path
        d={pathData}
        fill="none"
        stroke={data[data.length - 1].price >= data[0].price ? '#00a000' : '#d00000'}
        strokeWidth={2}
      />
      
      {/* Data points */}
      {data.map((d, i) => {
        const x = padding.left + (i * (chartWidth - padding.left - padding.right) / (data.length - 1));
        const y = chartHeight - padding.bottom - ((d.price - minPrice) / (maxPrice - minPrice)) * (chartHeight - padding.top - padding.bottom);
        return (
          <circle
            key={'point-' + i}
            cx={x}
            cy={y}
            r={i % 5 === 0 ? 3 : 0}
            fill={data[data.length - 1].price >= data[0].price ? '#00a000' : '#d00000'}
          />
        );
      })}
    </svg>
  );
});

// Volume Chart Component
const VolumeChart: React.FC<{ data: StockData['history'], theme: 'light' | 'dark' }> = React.memo(({ data, theme }) => {
  if (!data?.length) return null;
  
  const chartHeight = 100;
  const chartWidth = 600;
  const padding = { top: 10, right: 30, bottom: 30, left: 50 };
  
  // Calculate max for scaling
  const volumes = data.map(d => d.volume);
  const maxVolume = Math.max(...volumes) * 1.1;
  
  const barWidth = (chartWidth - padding.left - padding.right) / data.length - 2;
  
  const textColor = theme === 'dark' ? '#e0e0e0' : '#333';
  const gridColor = theme === 'dark' ? '#444' : '#eee';
  
  return (
    <svg width={chartWidth} height={chartHeight} className="volume-chart">
      {/* Grid lines */}
      {Array.from({ length: 3 }, (_, i) => {
        const y = chartHeight - padding.bottom - (i * (chartHeight - padding.top - padding.bottom) / 2);
        const volume = (i * maxVolume / 2);
        return (
          <g key={'grid-' + i}>
            <line
              x1={padding.left}
              y1={y}
              x2={chartWidth - padding.right}
              y2={y}
              stroke={gridColor}
              strokeWidth={1}
              strokeDasharray="5,5"
            />
            <text
              x={padding.left - 10}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
              fill={textColor}
            >
              {formatNumber(volume).replace('$', '')}
            </text>
          </g>
        );
      })}
      
      {/* Volume bars */}
      {data.map((d, i) => {
        const x = padding.left + (i * (chartWidth - padding.left - padding.right) / data.length) + 1;
        const height = ((d.volume / maxVolume) * (chartHeight - padding.top - padding.bottom));
        const y = chartHeight - padding.bottom - height;
        
        return (
          <rect
            key={'volume-' + i}
            x={x}
            y={y}
            width={barWidth}
            height={height}
            fill="rgba(100, 100, 255, 0.6)"
            stroke="rgba(100, 100, 255, 0.8)"
            strokeWidth={1}
          />
        );
      })}
    </svg>
  );
});

// Stock Info Card
const StockInfoCard: React.FC<{ stock: StockData, theme: 'light' | 'dark' }> = React.memo(({ stock, theme }) => {
  const backgroundColor = theme === 'dark' ? '#333' : '#fff';
  const textColor = theme === 'dark' ? '#e0e0e0' : '#333';
  const borderColor = theme === 'dark' ? '#555' : '#ddd';
  
  return (
    <div className="stock-info-card" style={{
      backgroundColor,
      color: textColor,
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      border: '1px solid ' + borderColor,
      marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{stock.symbol}</h2>
          <p style={{ margin: '4px 0 0 0', color: theme === 'dark' ? '#aaa' : '#666' }}>{stock.name}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{stock.price}</div>
          <div style={{ 
            color: stock.change >= 0 ? '#00a000' : '#d00000',
            fontSize: '1rem',
          }}>
            {stock.change >= 0 ? '▲' : '▼'} {Math.abs(stock.change).toFixed(2)} ({Math.abs(stock.changePercent).toFixed(2)}%)
          </div>
        </div>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px',
        padding: '12px 0',
        borderTop: '1px solid ' + borderColor,
        borderBottom: '1px solid ' + borderColor,
      }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: theme === 'dark' ? '#aaa' : '#666' }}>Market Cap</div>
          <div style={{ fontWeight: 'bold' }}>{formatNumber(stock.metrics.marketCap)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', color: theme === 'dark' ? '#aaa' : '#666' }}>P/E Ratio</div>
          <div style={{ fontWeight: 'bold' }}>{stock.metrics.peRatio}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', color: theme === 'dark' ? '#aaa' : '#666' }}>Dividend</div>
          <div style={{ fontWeight: 'bold' }}>{stock.metrics.dividend}%</div>
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', color: theme === 'dark' ? '#aaa' : '#666' }}>Avg Volume</div>
          <div style={{ fontWeight: 'bold' }}>{formatNumber(stock.metrics.avgVolume).replace('$', '')}</div>
        </div>
      </div>
    </div>
  );
});

// Main Dashboard Component
const StockDashboard: React.FC<StockDashboardProps> = React.memo(({
  stocks: initialStocks,
  defaultSymbol = 'AAPL',
  refreshInterval = 60000,
  theme = 'light',
}) => {
  // Use provided stocks or generate mock data
  const [stocks, setStocks] = useState<StockData[]>(initialStocks || []);
  const [selectedSymbol, setSelectedSymbol] = useState(defaultSymbol);
  const [timeRange, setTimeRange] = useState<'1W' | '2W' | '1M' | '3M'>('1M');
  
  // Generate initial stock data if none provided
  useEffect(() => {
    if (!initialStocks || initialStocks.length === 0) {
      setStocks(generateMockStockData());
    }
  }, [initialStocks]);
  
  // Simulate refresh on interval
  useEffect(() => {
    const timer = setInterval(() => {
      setStocks(prevStocks => 
        prevStocks.map(stock => ({
          ...stock,
          price: parseFloat((stock.price + (Math.random() * 2 - 1)).toFixed(2)),
          change: parseFloat((Math.random() * 4 - 2).toFixed(2)),
          changePercent: parseFloat(((Math.random() * 4 - 2) / stock.price * 100).toFixed(2)),
        }))
      );
    }, refreshInterval);
    
    return () => clearInterval(timer);
  }, [refreshInterval]);
  
  // Get selected stock
  const selectedStock = useMemo(() => 
    stocks.find(s => s.symbol === selectedSymbol) || stocks[0],
    [stocks, selectedSymbol]
  );
  
  // Filter history data based on time range
  const filteredHistory = useMemo(() => {
    if (!selectedStock) return [];
    
    const days = {
      '1W': 7,
      '2W': 14,
      '1M': 30,
      '3M': 90
    }[timeRange];
    
    return selectedStock.history.slice(-days);
  }, [selectedStock, timeRange]);
  
  // Handle stock selection
  const handleStockSelect = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
  }, []);
  
  // Background and text colors based on theme
  const backgroundColor = theme === 'dark' ? '#222' : '#f5f5f5';
  const textColor = theme === 'dark' ? '#e0e0e0' : '#333';
  
  if (!selectedStock) return <div>Loading...</div>;
  
  return (
    <div className="stock-dashboard" style={{
      padding: '24px',
      backgroundColor,
      color: textColor,
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderRadius: '12px',
      maxWidth: '1000px',
      margin: '0 auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0 }}>Stock Market Dashboard</h1>
        <div>
          <select
            value={theme}
            onChange={(e) => {/* Theme would be controlled by parent in real implementation */}}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid ' + (theme === 'dark' ? '#555' : '#ddd'),
              backgroundColor: theme === 'dark' ? '#444' : '#fff',
              color: textColor,
              marginLeft: '12px',
            }}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        {stocks.map(stock => (
          <button
            key={stock.symbol}
            onClick={() => handleStockSelect(stock.symbol)}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: selectedSymbol === stock.symbol 
                ? (theme === 'dark' ? '#555' : '#ddd') 
                : (theme === 'dark' ? '#333' : '#f0f0f0'),
              color: textColor,
              cursor: 'pointer',
              fontWeight: selectedSymbol === stock.symbol ? 'bold' : 'normal',
            }}
          >
            {stock.symbol}
          </button>
        ))}
      </div>
      
      <StockInfoCard stock={selectedStock} theme={theme} />
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <h2 style={{ margin: 0 }}>Price History</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['1W', '2W', '1M', '3M'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: timeRange === range 
                  ? (theme === 'dark' ? '#555' : '#ddd') 
                  : (theme === 'dark' ? '#333' : '#f0f0f0'),
                color: textColor,
                cursor: 'pointer',
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{
        backgroundColor: theme === 'dark' ? '#333' : '#fff',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}>
        <PriceChart data={filteredHistory} theme={theme} />
      </div>
      
      <h2 style={{ margin: '0 0 16px 0' }}>Trading Volume</h2>
      <div style={{
        backgroundColor: theme === 'dark' ? '#333' : '#fff',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}>
        <VolumeChart data={filteredHistory} theme={theme} />
      </div>
    </div>
  );
});

export default StockDashboard;
</reflyArtifact>

I've created a comprehensive Stock Dashboard React component with interactive charts and real-time data visualization. The dashboard includes a price history chart, volume chart, and key metrics display. It features theme support, time range selection, and stock switching functionality. The component is optimized with React.memo, useMemo, and useCallback for performance.
</response>
</example>

Remember:
1. Always generate fully functional React components in reflyArtifact
2. Show your thinking process in reflyThinking
3. Optimize components for performance
4. Provide TypeScript type definitions
5. Include clear documentation and comments
6. Focus on visual, interactive components that render data
7. Ensure all code is valid and can be executed in a sandbox environment`;
