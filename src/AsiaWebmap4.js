import React, { useState, useEffect } from 'react';

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
    value={value}
    onChange={(e) => onValueChange(parseInt(e.target.value))}
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

const initialCities = [
  { name: 'Tokyo', x: 750, y: 150 },
  { name: 'Shanghai', x: 750, y: 300 },
  { name: 'Hong Kong', x: 600, y: 350 },
  { name: 'Singapore', x: 500, y: 450 },
  { name: 'Mumbai', x: 300, y: 350 },
  { name: 'Dubai', x: 200, y: 300 },
];

const initialRoutesData = [
  {"Start":"Shanghai","End":"Hong Kong","Mode":"Sea","Cost":358,"Time":72,"Environment":50},
  {"Start":"Shanghai","End":"Hong Kong","Mode":"Air","Cost":645,"Time":8,"Environment":80},
  {"Start":"Shanghai","End":"Hong Kong","Mode":"Land","Cost":300,"Time":48,"Environment":40},
  {"Start":"Shanghai","End":"Singapore","Mode":"Sea","Cost":550,"Time":336,"Environment":60},
  {"Start":"Shanghai","End":"Singapore","Mode":"Air","Cost":990,"Time":10,"Environment":85},
  {"Start":"Hong Kong","End":"Singapore","Mode":"Sea","Cost":2038,"Time":312,"Environment":55},
  {"Start":"Hong Kong","End":"Singapore","Mode":"Air","Cost":3669,"Time":7,"Environment":88},
  {"Start":"Shanghai","End":"Tokyo","Mode":"Sea","Cost":700,"Time":240,"Environment":65},
  {"Start":"Shanghai","End":"Tokyo","Mode":"Air","Cost":1100,"Time":12,"Environment":90},
  {"Start":"Tokyo","End":"Singapore","Mode":"Sea","Cost":2100,"Time":320,"Environment":60},
  {"Start":"Tokyo","End":"Singapore","Mode":"Air","Cost":3800,"Time":9,"Environment":92},
  {"Start":"Tokyo","End":"Hong Kong","Mode":"Sea","Cost":1500,"Time":180,"Environment":70},
  {"Start":"Tokyo","End":"Hong Kong","Mode":"Air","Cost":2000,"Time":6,"Environment":85},
  {"Start":"Singapore","End":"Mumbai","Mode":"Sea","Cost":2500,"Time":400,"Environment":70},
  {"Start":"Mumbai","End":"Dubai","Mode":"Air","Cost":3000,"Time":800,"Environment":75}
];

const transportModes = [
  { name: 'Sea', icon: '🚢', color: 'blue', defaultSpeed: 30 },
  { name: 'Air', icon: '✈️', color: 'green', defaultSpeed: 800 },
  { name: 'Land', icon: '🚛', color: 'orange', defaultSpeed: 60 },
];

const asiaPath = "M300,100 Q400,50 500,75 T700,100 T850,150 T900,250 T850,350 T750,400 T600,450 T450,475 T300,450 T200,400 T150,300 T200,200 T300,100 Z";

const AsiaWebmap = () => {
  const [cities, setCities] = useState(initialCities);
  const [routes, setRoutes] = useState(initialRoutesData);
  const [vehiclePositions, setVehiclePositions] = useState({});
  const [shippingTimes, setShippingTimes] = useState({});
  const [isSimulating, setIsSimulating] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [isDestroying, setIsDestroying] = useState(false);
  const [destroyType, setDestroyType] = useState(null);
  const [speeds, setSpeeds] = useState(
    Object.fromEntries(transportModes.map(mode => [mode.name, mode.defaultSpeed]))
  );
  const [intervals, setIntervals] = useState([]);

  const simulateAllRoutes = () => {
    setIsSimulating(true);
    setIsStopped(false);
    setVehiclePositions({});
    setShippingTimes({});

    const newIntervals = routes.map((route, index) => {
      const fromCity = cities.find(city => city.name === route.Start);
      const toCity = cities.find(city => city.name === route.End);
      const distance = route.Cost; // Using Cost as distance for simplicity
      const speed = speeds[route.Mode];
      const totalTime = distance / speed;
      let elapsedTime = 0;

      const intervalId = setInterval(() => {
        if (!isStopped) {
          elapsedTime += 0.1;
          const progress = Math.min(elapsedTime / totalTime, 1);

          setVehiclePositions(prev => ({
            ...prev,
            [`${route.Start}-${route.End}-${route.Mode}`]: {
              x: fromCity.x + (toCity.x - fromCity.x) * progress,
              y: fromCity.y + (toCity.y - fromCity.y) * progress,
              mode: route.Mode
            }
          }));

          setShippingTimes(prev => ({
            ...prev,
            [`${route.Start}-${route.End}-${route.Mode}`]: elapsedTime.toFixed(1)
          }));

          if (progress === 1) {
            clearInterval(intervalId);
          }
        }
      }, 100);

      return intervalId;
    });

    setIntervals(newIntervals);
  };

  const stopSimulation = () => {
    setIsStopped(true);
    setIsSimulating(false);
    intervals.forEach(clearInterval);
  };

  const restartSimulation = () => {
    intervals.forEach(clearInterval);
    setVehiclePositions({});
    setShippingTimes({});
    setIsSimulating(false);
    setIsStopped(false);
  };

  const startDestroy = () => {
    setIsDestroying(true);
    setDestroyType(null);
  };

  const selectDestroyType = (type) => {
    setDestroyType(type);
  };

  const destroyItem = (item) => {
    if (destroyType === 'city') {
      setCities(cities.filter(city => city.name !== item));
      setRoutes(routes.filter(route => route.Start !== item && route.End !== item));
    } else if (destroyType === 'route') {
      setRoutes(routes.filter(route => 
        !(route.Start === item.Start && route.End === item.End && route.Mode === item.Mode)
      ));
    }
    setIsDestroying(false);
    setDestroyType(null);
  };

  const handleSpeedChange = (mode, value) => {
    setSpeeds(prev => ({ ...prev, [mode]: value }));
  };

  const getTransportModeColor = (mode) => {
    return transportModes.find(m => m.name === mode)?.color || 'gray';
  };

  const getTransportModeIcon = (mode) => {
    return transportModes.find(m => m.name === mode)?.icon || '❓';
  };

  useEffect(() => {
    return () => intervals.forEach(clearInterval);
  }, [intervals]);

  return (
    <div className="flex">
      <svg width="900" height="500" viewBox="0 0 900 500">
        <rect width="900" height="500" fill="#f0f0f0" />
        <path d={asiaPath} fill="#e0e0e0" stroke="#a0a0a0" strokeWidth="2" />

        {routes.map((route, index) => {
          const fromCity = cities.find(city => city.name === route.Start);
          const toCity = cities.find(city => city.name === route.End);
          if (fromCity && toCity) {
            const controlPointOffset = {
              Sea: { x: 0, y: -30 },
              Air: { x: 30, y: 0 },
              Land: { x: -30, y: 30 }
            };
            const offset = controlPointOffset[route.Mode];
            return (
              <path
                key={index}
                d={`M${fromCity.x},${fromCity.y} Q${(fromCity.x + toCity.x) / 2 + offset.x},${(fromCity.y + toCity.y) / 2 + offset.y} ${toCity.x},${toCity.y}`}
                stroke={getTransportModeColor(route.Mode)}
                strokeWidth="2"
                fill="none"
                onClick={() => isDestroying && destroyType === 'route' && destroyItem(route)}
                style={{ cursor: isDestroying && destroyType === 'route' ? 'pointer' : 'default' }}
              />
            );
          }
          return null;
        })}

        {cities.map((city, index) => (
          <g key={index} onClick={() => isDestroying && destroyType === 'city' && destroyItem(city.name)}
             style={{ cursor: isDestroying && destroyType === 'city' ? 'pointer' : 'default' }}>
            <circle cx={city.x} cy={city.y} r="5" fill="gray" />
            <text x={city.x + 10} y={city.y - 10} fontSize="12" fill="black">
              {city.name}
            </text>
          </g>
        ))}

        {Object.entries(vehiclePositions).map(([key, position]) => (
          <g key={key}>
            <circle cx={position.x} cy={position.y} r="5" fill={getTransportModeColor(position.mode)} />
            <text x={position.x + 10} y={position.y - 10} fontSize="20">
              {getTransportModeIcon(position.mode)}
            </text>
          </g>
        ))}
      </svg>

      <Card className="w-80 ml-4">
        <CardHeader>Shipping Controls</CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            <Button onClick={simulateAllRoutes} disabled={isSimulating || isDestroying}>
              Start
            </Button>
            <Button onClick={stopSimulation} disabled={!isSimulating || isStopped || isDestroying}>
              Stop
            </Button>
            <Button onClick={restartSimulation} disabled={(isSimulating && !isStopped) || isDestroying}>
              Restart
            </Button>
            <Button onClick={startDestroy} disabled={isSimulating || isDestroying}>
              Destroy
            </Button>
          </div>

          {isDestroying && !destroyType && (
            <div className="mb-4">
              <Button onClick={() => selectDestroyType('city')} className="mr-2">Destroy City</Button>
              <Button onClick={() => selectDestroyType('route')}>Destroy Route</Button>
            </div>
          )}

          {isDestroying && destroyType && (
            <div className="mb-4">
              <p>Click on a {destroyType} to destroy it</p>
              <Button onClick={() => setIsDestroying(false)}>Cancel</Button>
            </div>
          )}

          {transportModes.map(mode => (
            <div key={mode.name} className="mb-2">
              <div>{mode.icon} {mode.name} Speed:</div>
              <Slider
                min={1}
                max={mode.name === 'Air' ? 1000 : 100}
                step={1}
                value={speeds[mode.name]}
                onValueChange={(value) => handleSpeedChange(mode.name, value)}
              />
              <span>{speeds[mode.name]} km/h</span>
            </div>
          ))}

          {(isSimulating || isStopped) && (
            <div className="mt-4">
              <h3 className="font-bold">Shipping Times:</h3>
              {Object.entries(shippingTimes).map(([key, time]) => (
                <div key={key}>{key}: {time} hours</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AsiaWebmap;