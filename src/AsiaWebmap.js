import React, { useState, useEffect } from 'react';

// Temporary fix for module resolution
const Button = ({ children, onClick, disabled, className }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 bg-blue-500 text-white rounded ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'} ${className}`}
  >
    {children}
  </button>
);

const Slider = ({ min, max, step, value, onValueChange }) => (
  <input
    type="range"
    min={min}
    max={max}
    step={step}
    value={value[0]}
    onChange={(e) => onValueChange([parseInt(e.target.value)])}
    className="w-full"
  />
);

const Card = ({ children, className }) => (
  <div className={`bg-white shadow-md rounded-lg ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="px-4 py-2 bg-gray-100 rounded-t-lg font-bold">
    {children}
  </div>
);

const CardContent = ({ children }) => (
  <div className="p-4">
    {children}
  </div>
);

// const cities = [
//   { name: 'Shanghai', x: 700, y: 250 },
//   { name: 'Singapore', x: 600, y: 400 },
// ];

const cities = [
    { name: 'Tokyo', x: 800, y: 200 },
    { name: 'Shanghai', x: 700, y: 250 },
    { name: 'Hong Kong', x: 650, y: 300 },
    { name: 'Singapore', x: 600, y: 400 },
    { name: 'Mumbai', x: 400, y: 350 },
    { name: 'Dubai', x: 300, y: 300 },
  ];

const transportModes = [
  { name: 'ship', color: 'blue', speed: 20 },
  { name: 'car', color: 'green', speed: 60 },
  { name: 'air', color: 'red', speed: 500 },
];

const asiaPath = "M300,100 Q400,50 500,75 T700,100 T850,150 T900,250 T850,350 T750,400 T600,450 T450,475 T300,450 T200,400 T150,300 T200,200 T300,100 Z";

const AsiaWebmap = () => {
  const [selectedMode, setSelectedMode] = useState(null);
  const [vehiclePosition, setVehiclePosition] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [finalTime, setFinalTime] = useState(null);
  const [velocity, setVelocity] = useState(20);
  const [isSimulating, setIsSimulating] = useState(false);

  const distance = 3450; // Approximate distance from Shanghai to Singapore in km

  useEffect(() => {
    let interval;
    if (isSimulating && selectedMode) {
      const fromCity = cities[0];
      const toCity = cities[1];
      const totalTime = distance / velocity;
      let elapsedTime = 0;

      interval = setInterval(() => {
        elapsedTime += 1;
        const progress = Math.min(elapsedTime / totalTime, 1);
        setVehiclePosition({
          x: fromCity.x + (toCity.x - fromCity.x) * progress,
          y: fromCity.y + (toCity.y - fromCity.y) * progress
        });
        setCurrentTime(elapsedTime);

        if (progress === 1) {
          setIsSimulating(false);
          setFinalTime(elapsedTime);
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSimulating, selectedMode, velocity]);

  const startSimulation = (mode) => {
    setSelectedMode(mode);
    setIsSimulating(true);
    setCurrentTime(0);
    setFinalTime(null);
    setVelocity(transportModes.find(m => m.name === mode).speed);
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    setFinalTime(currentTime);
  };

  return (
    <div className="flex">
      <svg width="900" height="500" viewBox="0 0 900 500">
        <rect width="900" height="500" fill="#f0f0f0" />
        <path d={asiaPath} fill="#e0e0e0" stroke="#a0a0a0" strokeWidth="2" />
        
        <line
          x1={cities[0].x}
          y1={cities[0].y}
          x2={cities[1].x}
          y2={cities[1].y}
          stroke="gray"
          strokeWidth="2"
          strokeDasharray="5,5"
        />

        {cities.map((city, index) => (
          <g key={index}>
            <circle
              cx={city.x}
              cy={city.y}
              r="5"
              fill="black"
            />
            <text
              x={city.x + 10}
              y={city.y - 10}
              fontSize="12"
              fill="black"
            >
              {city.name}
            </text>
          </g>
        ))}

        {vehiclePosition && (
          <circle
            cx={vehiclePosition.x}
            cy={vehiclePosition.y}
            r="5"
            fill={transportModes.find(m => m.name === selectedMode).color}
          />
        )}
      </svg>

      <Card className="w-80 ml-4">
        <CardHeader>Transportation Controls</CardHeader>
        <CardContent>
          <div className="mb-4">
            <div>Shanghai to Singapore</div>
            <div>Distance: {distance} km</div>
          </div>
          <div className="mb-4">
            {transportModes.map(mode => (
              <Button
                key={mode.name}
                onClick={() => startSimulation(mode.name)}
                disabled={isSimulating}
                className="mr-2 mb-2"
                style={{backgroundColor: mode.color}}
              >
                Start {mode.name}
              </Button>
            ))}
          </div>
          <Button 
            onClick={stopSimulation}
            disabled={!isSimulating}
            className="bg-red-500 hover:bg-red-600"
          >
            Stop
          </Button>
          {selectedMode && (
            <div className="mt-4">
              <label className="block mb-2">Speed ({transportModes.find(m => m.name === selectedMode).name})</label>
              <Slider
                min={1}
                max={1000}
                step={1}
                value={[velocity]}
                onValueChange={(value) => setVelocity(value[0])}
              />
              <div className="text-sm text-gray-500 mt-1">{velocity} km/h</div>
            </div>
          )}
          {isSimulating && (
            <div className="mt-4">
              <div>Current Time: {Math.floor(currentTime)} hours</div>
            </div>
          )}
          {finalTime !== null && (
            <div className="mt-4">
              <div>Final Time: {Math.floor(finalTime)} hours</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AsiaWebmap;