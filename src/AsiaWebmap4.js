import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button'
import Slider from './Slider'
import CardHeader from './CardHeader'
import CardContent from './CardContent'
import cities from './cities'
import shippingLines from './shippingLines'
import transportModes from './transportModes';

const asiaPath = "M300,100 Q400,50 500,75 T700,100 T850,150 T900,250 T850,350 T750,400 T600,450 T450,475 T300,450 T200,400 T150,300 T200,200 T300,100 Z";

const AsiaWebmap = () => {
  const [selectedCities, setSelectedCities] = useState([]);
  const [vehiclePositions, setVehiclePositions] = useState([]);
  const [shippingTimes, setShippingTimes] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedModes, setSelectedModes] = useState([]);
  const [speeds, setSpeeds] = useState(
    Object.fromEntries(transportModes.map(mode => [mode.name, mode.defaultSpeed]))
  );

  // ... (keep the existing useEffect hooks and other functions)
  useEffect(() => {
    if (selectedCities.length > 1 && selectedModes.every(modes => modes && modes.length > 0)) {
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
          selectedModes[modeIndex].forEach((mode, subIndex) => {
            const distance = shippingLine.distance;
            const speed = speeds[mode];
            const totalTime = distance / speed;
            let elapsedTime = 0;

            const interval = setInterval(() => {
              elapsedTime += 0.1;
              const progress = Math.min(elapsedTime / totalTime, 1);

              setVehiclePositions(prev => {
                const newPositions = [...prev];
                if (!newPositions[modeIndex]) newPositions[modeIndex] = [];
                newPositions[modeIndex][subIndex] = {
                  x: fromCity.x + (toCity.x - fromCity.x) * progress,
                  y: fromCity.y + (toCity.y - fromCity.y) * progress,
                  mode: mode
                };
                return newPositions;
              });

              setShippingTimes(prev => {
                const newTimes = [...prev];
                if (!newTimes[modeIndex]) newTimes[modeIndex] = [];
                newTimes[modeIndex][subIndex] = elapsedTime.toFixed(1);
                return newTimes;
              });

              if (progress === 1) {
                clearInterval(interval);
              }
            }, 100);

            intervals.push(interval);
          });
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
      if (!newModes[index]) newModes[index] = [];
      if (newModes[index].includes(mode)) {
        newModes[index] = newModes[index].filter(m => m !== mode);
      } else {
        newModes[index].push(mode);
      }
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

  const getRouteDistance = (fromCity, toCity) => {
    const route = shippingLines.find(
      line => (line.from === fromCity && line.to === toCity) ||
              (line.from === toCity && line.to === fromCity)
    );
    return route ? route.distance : 0;
  };

  return (
    <div className="flex">
      <svg width="900" height="500" viewBox="0 0 900 500">
        <rect width="900" height="500" fill="#f0f0f0" />
        <path d={asiaPath} fill="#e0e0e0" stroke="#a0a0a0" strokeWidth="2" />
        {cities.map((cityFrom, indexFrom) => 
          cities.map((cityTo, indexTo) => {
            if (indexFrom < indexTo) {
              return (
                <line
                  key={`${cityFrom.name}-${cityTo.name}`}
                  x1={cityFrom.x}
                  y1={cityFrom.y}
                  x2={cityTo.x}
                  y2={cityTo.y}
                  stroke="gray"
                  strokeWidth="1"
                  opacity="0.3"
                />
              );
            }
            return null;
          })
        )}
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
        {vehiclePositions.map((positions, index) => 
          positions?.map((position, subIndex) => (
            position && (
              <g key={`${index}-${subIndex}`}>
                <circle
                  cx={position.x}
                  cy={position.y}
                  r="5"
                  fill={getTransportModeColor(position.mode)}
                />
                <text
                  x={position.x + 10}
                  y={position.y - 10}
                  fontSize="20"
                >
                  {getTransportModeIcon(position.mode)}
                </text>
              </g>
            )
          ))
        )}
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
                variant={selectedCities.includes(city.name) ? "destructive" : "secondary"}
                className="mr-2 mb-2"
              >
                {city.name}
              </Button>
            ))}
          </div>
          {selectedCities.length > 1 && selectedCities.slice(0, -1).map((city, index) => (
            <div key={index} className="mb-4">
              <div>{city} to {selectedCities[index + 1]}:</div>
              <div>Distance: {getRouteDistance(city, selectedCities[index + 1])} km</div>
              {transportModes.map(mode => (
                <Button
                  key={mode.name}
                  onClick={() => handleModeSelect(index, mode.name)}
                  variant={selectedModes[index]?.includes(mode.name) ? "default" : "outline"}
                  className="mr-2 mb-2"
                  style={{backgroundColor: selectedModes[index]?.includes(mode.name) ? getTransportModeColor(mode.name) : ''}}
                >
                  {getTransportModeIcon(mode.name)} {mode.name}
                </Button>
              ))}
              {selectedModes[index]?.map((mode, subIndex) => (
                <div key={`${index}-${mode}-${subIndex}`}>
                  {mode} Time: {shippingTimes[index]?.[subIndex] || '0'} hours
                </div>
              ))}
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
              Total Time: {shippingTimes.flat().reduce((a, b) => parseFloat(a) + parseFloat(b), 0).toFixed(1)} hours
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AsiaWebmap;