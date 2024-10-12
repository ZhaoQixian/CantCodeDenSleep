import React, { useState, useEffect } from 'react';
// import { Button } from "@/components/ui/button"
// import { Slider } from "@/components/ui/slider"
// import { Card, CardHeader, CardContent } from "@/components/ui/card"


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

const cities = [
  { name: 'Tokyo', x: 800, y: 200 },
  { name: 'Shanghai', x: 700, y: 250 },
  { name: 'Hong Kong', x: 650, y: 300 },
  { name: 'Singapore', x: 600, y: 400 },
  { name: 'Mumbai', x: 400, y: 350 },
  { name: 'Dubai', x: 300, y: 300 },
];

const shippingLines = [
  { from: 'Tokyo', to: 'Shanghai', distance: 1766 },
  { from: 'Shanghai', to: 'Hong Kong', distance: 1255 },
  { from: 'Hong Kong', to: 'Singapore', distance: 2572 },
  { from: 'Singapore', to: 'Mumbai', distance: 3180 },
  { from: 'Mumbai', to: 'Dubai', distance: 1945 },
  { from: 'Dubai', to: 'Singapore', distance: 3707 },
];

const asiaPath = "M300,100 Q400,50 500,75 T700,100 T850,150 T900,250 T850,350 T750,400 T600,450 T450,475 T300,450 T200,400 T150,300 T200,200 T300,100 Z";

const transportModes = [
  { name: 'ship', color: 'blue', speed: 20 },
  { name: 'car', color: 'green', speed: 60 },
  { name: 'air', color: 'red', speed: 500 },
];

const AsiaWebmap = () => {
  const [selectedCities, setSelectedCities] = useState([]);
  const [shipPosition, setShipPosition] = useState(null);
  const [currentShippingTime, setCurrentShippingTime] = useState(0);
  const [finalShippingTime, setFinalShippingTime] = useState(null);
  const [velocity, setVelocity] = useState(20); // knots
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    let interval;
    if (isSimulating && selectedCities.length > 1) {
      const fromCity = cities.find(city => city.name === selectedCities[0]);
      const toCity = cities.find(city => city.name === selectedCities[1]);
      const shippingLine = shippingLines.find(
        line => (line.from === selectedCities[0] && line.to === selectedCities[1]) ||
                (line.from === selectedCities[1] && line.to === selectedCities[0])
      );

      if (fromCity && toCity && shippingLine) {
        const distance = shippingLine.distance;
        const totalTime = distance / velocity;
        let elapsedTime = 0;

        interval = setInterval(() => {
          elapsedTime += 1;
          const progress = Math.min(elapsedTime / totalTime, 1);
          setShipPosition({
            x: fromCity.x + (toCity.x - fromCity.x) * progress,
            y: fromCity.y + (toCity.y - fromCity.y) * progress
          });
          setCurrentShippingTime(elapsedTime);

          if (progress === 1) {
            setIsSimulating(false);
            setFinalShippingTime(elapsedTime);
            clearInterval(interval);
          }
        }, 1000);
      }
    }
    return () => clearInterval(interval);
  }, [isSimulating, selectedCities, velocity]);

  const handleCityClick = (cityName) => {
    setSelectedCities(prev => {
      if (prev.includes(cityName)) {
        return prev.filter(city => city !== cityName);
      } else if (prev.length < 2) {
        return [...prev, cityName];
      }
      return prev;
    });
  };

  const startSimulation = () => {
    if (selectedCities.length === 2) {
      setIsSimulating(true);
      setCurrentShippingTime(0);
      setFinalShippingTime(null);
    }
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    setFinalShippingTime(currentShippingTime);
  };

  return (
    <div className="flex">
      <svg width="900" height="500" viewBox="0 0 900 500">
        <rect width="900" height="500" fill="#f0f0f0" />
        <path d={asiaPath} fill="#e0e0e0" stroke="#a0a0a0" strokeWidth="2" />
        
        {shippingLines.map((line, index) => {
          const fromCity = cities.find(city => city.name === line.from);
          const toCity = cities.find(city => city.name === line.to);
          return (
            <line
              key={index}
              x1={fromCity.x}
              y1={fromCity.y}
              x2={toCity.x}
              y2={toCity.y}
              stroke="blue"
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

        {shipPosition && (
          <circle
            cx={shipPosition.x}
            cy={shipPosition.y}
            r="5"
            fill="green"
          />
        )}
      </svg>

      <Card className="w-80 ml-4">
        <CardHeader>Shipping Controls</CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block mb-2">Ship Velocity (knots)</label>
            <Slider
              min={10}
              max={40}
              step={1}
              value={[velocity]}
              onValueChange={(value) => setVelocity(value[0])}
            />
            <div className="text-sm text-gray-500 mt-1">{velocity} knots</div>
          </div>
          <div className="mb-4">
            <div>Selected Cities:</div>
            <div>{selectedCities.join(' -> ')}</div>
          </div>
          <Button 
            onClick={startSimulation}
            disabled={selectedCities.length !== 2 || isSimulating}
            className="mr-2"
          >
            Start Shipping
          </Button>
          <Button 
            onClick={stopSimulation}
            disabled={!isSimulating}
            variant="destructive"
          >
            Stop Shipping
          </Button>
          {isSimulating && (
            <div className="mt-4">
              <div>Current Shipping Time: {Math.floor(currentShippingTime)} hours</div>
            </div>
          )}
          {finalShippingTime !== null && (
            <div className="mt-4">
              <div>Final Shipping Time: {Math.floor(finalShippingTime)} hours</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AsiaWebmap;