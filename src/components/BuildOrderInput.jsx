import React, { useState } from 'react';
import './BuildOrderInput.css';

const BuildOrderInput = ({ onBuildOrderChange }) => {
  const [buildOrderText, setBuildOrderText] = useState('');
  const [isValid, setIsValid] = useState(true);

  const exampleBuildOrder = `14 0:18 Pylon
16 0:32 Gateway
17 0:38 Assimilator
19 0:46 Nexus
20 1:00 Cybernetics Core
22 1:16 Pylon
22 1:20 Assimilator
24 1:32 Stalker
26 1:45 Warpgate
27 1:52 Stalker
29 2:05 Pylon
30 2:10 Robotics Facility
32 2:25 Stalker
34 2:38 Observer
36 2:52 Immortal`;

  const handleInputChange = (event) => {
    const text = event.target.value;
    setBuildOrderText(text);
    
    try {
      onBuildOrderChange(text);
      setIsValid(true);
    } catch (error) {
      console.error('Error parsing build order:', error);
      setIsValid(false);
    }
  };

  const handleExampleLoad = () => {
    setBuildOrderText(exampleBuildOrder);
    onBuildOrderChange(exampleBuildOrder);
    setIsValid(true);
  };

  const handleClear = () => {
    setBuildOrderText('');
    onBuildOrderChange('');
    setIsValid(true);
  };

  return (
    <div className="build-order-input">
      <div className="input-header">
        <h2>StarCraft 2 Build Order Visualizer</h2>
        <p>Paste your Spawning Tool build order below to generate a Gantt chart visualization</p>
      </div>

      <div className="input-controls">
        <button 
          onClick={handleExampleLoad}
          className="example-btn"
        >
          Load Example (Protoss 2-Gate)
        </button>
        <button 
          onClick={handleClear}
          className="clear-btn"
        >
          Clear
        </button>
      </div>

      <div className="textarea-container">
        <textarea
          value={buildOrderText}
          onChange={handleInputChange}
          className={`build-order-textarea ${!isValid ? 'invalid' : ''}`}
          placeholder={`Paste your build order here...

Supported formats:
• 14 0:18 Pylon
• 16 Gateway @0:32
• Cybernetics Core
• 22 Stalker

Each line should contain one build order item.`}
          rows={12}
        />
        {!isValid && (
          <div className="error-message">
            Invalid build order format. Please check your input.
          </div>
        )}
      </div>

      <div className="format-help">
        <h3>Supported Formats:</h3>
        <ul>
          <li><code>14 0:18 Pylon</code> - Supply count, time, and unit/building name</li>
          <li><code>16 Gateway @0:32</code> - Supply count, unit name, and time</li>
          <li><code>Cybernetics Core @1:00</code> - Unit name and time</li>
          <li><code>22 Stalker</code> - Supply count and unit name (sequential timing)</li>
          <li><code>Probe</code> - Just unit name (sequential timing)</li>
        </ul>
        <p>
          <strong>Note:</strong> Build times are automatically calculated based on StarCraft 2 game data. 
          Times are displayed in game seconds (normal speed).
        </p>
      </div>
    </div>
  );
};

export default BuildOrderInput;
