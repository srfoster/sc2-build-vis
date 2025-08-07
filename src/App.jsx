import React, { useState } from 'react';
import BuildOrderInput from './components/BuildOrderInput.jsx';
import GanttChart from './components/GanttChart.jsx';
import { parseSpawningToolBuildOrder, calculateBuildOrderTiming } from './utils/buildOrderParser.js';
import './App.css';

function App() {
  const [buildOrder, setBuildOrder] = useState([]);
  const [rawBuildOrderText, setRawBuildOrderText] = useState('');

  const handleBuildOrderChange = (buildOrderText) => {
    setRawBuildOrderText(buildOrderText);
    
    if (!buildOrderText.trim()) {
      setBuildOrder([]);
      return;
    }

    try {
      const parsed = parseSpawningToolBuildOrder(buildOrderText);
      const calculated = calculateBuildOrderTiming(parsed);
      setBuildOrder(calculated);
    } catch (error) {
      console.error('Error processing build order:', error);
      setBuildOrder([]);
    }
  };

  // Calculate max time for chart scaling
  const maxTime = buildOrder.length > 0 
    ? Math.max(...buildOrder.map(item => item.endTime)) + 30 
    : 600;

  return (
    <div className="App">
      <div className="app-container">
        <BuildOrderInput onBuildOrderChange={handleBuildOrderChange} />
        <GanttChart buildOrder={buildOrder} maxTime={maxTime} />
        
        {buildOrder.length > 0 && (
          <div className="build-order-summary">
            <h3>Build Order Summary</h3>
            <div className="summary-table">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Supply</th>
                    <th>Time</th>
                    <th>Unit/Building</th>
                    <th>Category</th>
                    <th>Duration</th>
                    <th>Completes</th>
                  </tr>
                </thead>
                <tbody>
                  {buildOrder.map((item, index) => (
                    <tr key={item.id} className={`category-${item.category}`}>
                      <td>{index + 1}</td>
                      <td>{item.supply || '-'}</td>
                      <td>{item.calculatedTime}</td>
                      <td className="unit-name">{item.unitName}</td>
                      <td className="category">{item.category}</td>
                      <td>{item.duration}s</td>
                      <td>{Math.floor(item.endTime / 60)}:{(item.endTime % 60).toString().padStart(2, '0')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
