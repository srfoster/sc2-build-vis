import React from 'react';
import { formatGameTime } from '../utils/buildOrderParser.js';
import './GanttChart.css';

const GanttChart = ({ buildOrder, maxTime = 600 }) => {
  if (!buildOrder || buildOrder.length === 0) {
    return (
      <div className="gantt-chart-empty">
        <p>No build order to display. Paste a build order above to see the visualization.</p>
      </div>
    );
  }

  // Calculate the time scale
  const timeScale = 800 / maxTime; // 800px width for the chart
  const rowHeight = 24;
  const chartHeight = buildOrder.length * rowHeight;

  // Generate time markers every 15 seconds for better precision
  const timeMarkers = [];
  for (let time = 0; time <= maxTime; time += 15) {
    timeMarkers.push(time);
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'worker': return '#4CAF50';
      case 'military': return '#F44336';
      case 'building': return '#2196F3';
      case 'tech': return '#FF9800';
      case 'upgrade': return '#9C27B0';
      default: return '#757575';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'worker': return '👷';
      case 'military': return '⚔️';
      case 'building': return '🏗️';
      case 'tech': return '🔬';
      case 'upgrade': return '⬆️';
      default: return '❓';
    }
  };

  return (
    <div className="gantt-chart">
      <div className="gantt-header">
        <h3>Build Order Timeline</h3>
        <div className="gantt-legend">
          <div className="legend-item">
            <span className="legend-color worker"></span>
            <span>Workers</span>
          </div>
          <div className="legend-item">
            <span className="legend-color military"></span>
            <span>Military</span>
          </div>
          <div className="legend-item">
            <span className="legend-color building"></span>
            <span>Buildings</span>
          </div>
          <div className="legend-item">
            <span className="legend-color tech"></span>
            <span>Tech</span>
          </div>
        </div>
      </div>

      <div className="gantt-container">
        {/* Time axis */}
        <div className="time-axis">
          {timeMarkers.map(time => (
            <div 
              key={time}
              className="time-marker"
              style={{ left: `${time * timeScale}px` }}
            >
              <span className="time-label">{formatGameTime(time)}</span>
              <div className="time-line"></div>
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div 
          className="chart-area"
          style={{ height: `${chartHeight}px` }}
        >
          {/* Grid lines */}
          {timeMarkers.map(time => (
            <div 
              key={`grid-${time}`}
              className="grid-line"
              style={{ 
                left: `${time * timeScale}px`,
                height: `${chartHeight}px`
              }}
            ></div>
          ))}

          {/* Build items */}
          {buildOrder.map((item, index) => {
            const leftPos = Math.round(item.startTime * timeScale);
            const width = Math.max(1, Math.round(item.duration * timeScale) - 1); // Subtract 1px for visual gap
            const topPos = index * rowHeight + 1;
            
            return (
              <React.Fragment key={item.id}>
                {/* Item label */}
                <div 
                  className="item-label"
                  style={{
                    top: `${topPos}px`,
                    height: `${rowHeight}px`
                  }}
                >
                  <span className="item-icon">{getCategoryIcon(item.category)}</span>
                  <span className="item-name">{item.unitName}</span>
                  <span className="item-supply">{item.supply ? `${item.supply}` : ''}</span>
                  <span className="item-time">{formatGameTime(item.startTime)}</span>
                </div>

                {/* Gantt bar */}
                <div 
                  className={`gantt-bar ${item.category}`}
                  style={{
                    left: `${leftPos}px`,
                    width: `${width}px`,
                    top: `${topPos}px`,
                    backgroundColor: getCategoryColor(item.category)
                  }}
                  title={`${item.unitName} - Start: ${formatGameTime(item.startTime)} | End: ${formatGameTime(item.endTime)} | Duration: ${item.duration}s | Order: ${item.order}`}
                >
                  <span className="bar-label">{item.unitName}</span>
                  <span className="bar-duration">{item.duration}s</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="gantt-stats">
        <div className="stat">
          <strong>Total Items:</strong> {buildOrder.length}
        </div>
        <div className="stat">
          <strong>Total Time:</strong> {formatGameTime(Math.max(...buildOrder.map(item => item.endTime)))}
        </div>
        <div className="stat">
          <strong>Workers:</strong> {buildOrder.filter(item => item.category === 'worker').length}
        </div>
        <div className="stat">
          <strong>Military:</strong> {buildOrder.filter(item => item.category === 'military').length}
        </div>
        <div className="stat">
          <strong>Buildings:</strong> {buildOrder.filter(item => item.category === 'building').length}
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
