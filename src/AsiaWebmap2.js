import React, { useState, useEffect } from 'react';

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

const Button = ({ children, onClick, disabled, className }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 text-white rounded ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'} ${className}`}
  >
    {children}
  </button>
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

const cities = [
  { name: 'Tokyo', x: 800, y: 200 },
  { name: 'Shanghai', x: 700, y: 250 },
  { name: 'Hong Kong', x: 650, y: 300 },
  { name: 'Singapore', x: 600, y: 400 },
  { name: 'Mumbai', x: 400, y: 350 },
  { name: 'Dubai', x: 300, y: 300 },
];

const shippingLines = [
  { from: 'Tokyo', to: 'Shanghai', distance: 1766, modes: ['ship', 'plane'] },
  { from: 'Shanghai', to: 'Hong Kong', distance: 1255, modes: ['ship', 'plane', 'car'] },
  { from: 'Hong Kong', to: 'Singapore', distance: 2572, modes: ['ship', 'plane'] },
  { from: 'Singapore', to: 'Mumbai', distance: 3180, modes: ['ship', 'plane'] },
  { from: 'Mumbai', to: 'Dubai', distance: 1945, modes: ['ship', 'plane'] },
  { from: 'Dubai', to: 'Singapore', distance: 3707, modes: ['ship', 'plane'] },
  { from: 'Shanghai', to: 'Singapore', distance: 3780, modes: ['ship', 'plane'] },
];

const asiaPath = "M300,100 Q400,50 500,75 T700,100 T850,150 T900,250 T850,350 T750,400 T600,450 T450,475 T300,450 T200,400 T150,300 T200,200 T300,100 Z";

const transportModes = [
  { name: 'ship', color: 'blue', defaultSpeed: 20, icon: '🚢' },
  { name: 'car', color: 'green', defaultSpeed: 60, icon: '🚗' },
  { name: 'plane', color: 'red', defaultSpeed: 500, icon: '✈️' },
];

const AsiaWebmap = () => {
  const [selectedCities, setSelectedCities] = useState([]);
  const [vehiclePositions, setVehiclePositions] = useState([]);
  const [shippingTimes, setShippingTimes] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedModes, setSelectedModes] = useState([]);
  const [speeds, setSpeeds] = useState(
    Object.fromEntries(transportModes.map(mode => [mode.name, mode.defaultSpeed]))
  );

  useEffect(() => {
    if (selectedCities.length > 1 && selectedModes.length === selectedCities.length - 1 &&
        selectedModes.every(mode => mode !== undefined)) {
      setIsSimulating(true);
    } else {
      setIsSimulating(false);
      setVehiclePositions([]);
      setShippingTimes([]);
    }
  }, [selectedCities, selectedModes]);

  useEffect(() => {
    let intervals = [];
    if (isSimulating) {
      const simulateShipping = (fromIndex, toIndex, modeIndex) => {
        const fromCity = cities.find(city => city.name === selectedCities[fromIndex]);
        const toCity = cities.find(city => city.name === selectedCities[toIndex]);
        const shippingLine = shippingLines.find(
          line => (line.from === selectedCities[fromIndex] && line.to === selectedCities[toIndex]) ||
                  (line.from === selectedCities[toIndex] && line.to === selectedCities[fromIndex])
        );

        if (fromCity && toCity && shippingLine && selectedModes[modeIndex]) {
          const distance = shippingLine.distance;
          const speed = speeds[selectedModes[modeIndex]];
          const totalTime = distance / speed;
          let elapsedTime = 0;

          const interval = setInterval(() => {
            elapsedTime += 0.1;
            const progress = Math.min(elapsedTime / totalTime, 1);
            setVehiclePositions(prev => {
              const newPositions = [...prev];
              newPositions[modeIndex] = {
                x: fromCity.x + (toCity.x - fromCity.x) * progress,
                y: fromCity.y + (toCity.y - fromCity.y) * progress,
              };
              return newPositions;
            });
            setShippingTimes(prev => {
              const newTimes = [...prev];
              newTimes[modeIndex] = elapsedTime.toFixed(1);
              return newTimes;
            });

            if (progress === 1) {
              clearInterval(interval);
            }
          }, 100);

          intervals.push(interval);
        }
      };

      for (let i = 0; i < selectedCities.length - 1; i++) {
        simulateShipping(i, i + 1, i);
      }
    }
    return () => intervals.forEach(clearInterval);
  }, [isSimulating, selectedCities, selectedModes, speeds]);

  const handleCityClick = (cityName) => {
    setSelectedCities(prev => {
      if (prev.includes(cityName)) {
        const index = prev.indexOf(cityName);
        const newCities = prev.filter(city => city !== cityName);
        setSelectedModes(modes => modes.filter((_, i) => i !== index - 1));
        return newCities;
      } else {
        return [...prev, cityName];
      }
    });
  };

  const handleModeSelect = (index, mode) => {
    setSelectedModes(prev => {
      const newModes = [...prev];
      newModes[index] = mode;
      return newModes;
    });
  };

  const handleSpeedChange = (mode, value) => {
    setSpeeds(prev => ({ ...prev, [mode]: value[0] }));
  };

  const getTransportModeColor = (mode) => {
    return transportModes.find(m => m.name === mode)?.color || 'gray';
  };

  const getTransportModeIcon = (mode) => {
    return transportModes.find(m => m.name === mode)?.icon || '❓';
  };

  return (
    <div className="flex">
      <svg width="900" height="500" viewBox="0 0 900 500">
        <rect width="900" height="500" fill="#f0f0f0" />
        <path d={asiaPath} fill="#e0e0e0" stroke="#a0a0a0" strokeWidth="2" />
        {selectedCities.length > 1 && selectedCities.slice(0, -1).map((city, index) => {
          const fromCity = cities.find(c => c.name === city);
          const toCity = cities.find(c => c.name === selectedCities[index + 1]);
          return (
            <line
              key={index}
              x1={fromCity.x}
              y1={fromCity.y}
              x2={toCity.x}
              y2={toCity.y}
              stroke={getTransportModeColor(selectedModes[index])}
              strokeWidth="2"
              opacity="0.5"
            />
          );
        })}
        {cities.map((city, index) => (
          <g key={index}>
            <circle
              cx={city.x}
              cy={city.y}
              r="5"
              fill={selectedCities.includes(city.name) ? "red" : "gray"}
              onClick={() => handleCityClick(city.name)}
              style={{cursor: 'pointer'}}
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
        {vehiclePositions.map((position, index) => (
          position && (
            <g key={index}>
              <circle
                cx={position.x}
                cy={position.y}
                r="5"
                fill={getTransportModeColor(selectedModes[index])}
              />
              <text
                x={position.x + 10}
                y={position.y - 10}
                fontSize="20"
              >
                {getTransportModeIcon(selectedModes[index])}
              </text>
            </g>
          )
        ))}
      </svg>
      <Card className="w-80 ml-4">
        <CardHeader>Shipping Controls</CardHeader>
        <CardContent>
          <div className="mb-4">
            <div>Selected Route:</div>
            <div>{selectedCities.join(' -> ')}</div>
          </div>
          <div className="mb-4">
            {cities.map(city => (
              <Button
                key={city.name}
                onClick={() => handleCityClick(city.name)}
                className={`mr-2 mb-2 ${selectedCities.includes(city.name) ? 'bg-red-500' : 'bg-gray-500'}`}
              >
                {city.name}
              </Button>
            ))}
          </div>
          {selectedCities.length > 1 && selectedCities.slice(0, -1).map((city, index) => (
            <div key={index} className="mb-4">
              <div>{city} to {selectedCities[index + 1]}:</div>
              {shippingLines.find(line => 
                (line.from === city && line.to === selectedCities[index + 1]) ||
                (line.to === city && line.from === selectedCities[index + 1])
              ).modes.map(mode => (
                <Button
                  key={mode}
                  onClick={() => handleModeSelect(index, mode)}
                  className={`mr-2 mb-2 ${selectedModes[index] === mode ? 'ring-2 ring-white' : ''}`}
                  style={{backgroundColor: getTransportModeColor(mode)}}
                >
                  {getTransportModeIcon(mode)} {mode}
                </Button>
              ))}
              {selectedModes[index] && (
                <div>
                  Time: {shippingTimes[index] || '0'} hours
                </div>
              )}
            </div>
          ))}
          <div className="mb-4">
            {transportModes.map(mode => (
              <div key={mode.name} className="mb-2">
                <div>{mode.icon} {mode.name} Speed:</div>
                <Slider
                  min={1}
                  max={mode.name === 'plane' ? 1000 : 100}
                  step={1}
                  value={[speeds[mode.name]]}
                  onValueChange={(value) => handleSpeedChange(mode.name, value)}
                />
                <span>{speeds[mode.name]} km/h</span>
              </div>
            ))}
          </div>
          {isSimulating && shippingTimes.length > 0 && (
            <div className="mt-4 font-bold">
              Total Time: {shippingTimes.reduce((a, b) => parseFloat(a) + parseFloat(b), 0).toFixed(1)} hours
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AsiaWebmap;