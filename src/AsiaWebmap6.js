// AsiaWebmap.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import initialRoutesData from './routesData';
import './styles.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import asiaMap from './AsiaMap1.jpg';

// Components
const Button = ({ children, onClick, disabled, className }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 bg-blue-500 text-white rounded ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
    } ${className}`}
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
  <div className={`bg-white shadow-md rounded-lg ${className}`}>{children}</div>
);

const CardHeader = ({ children }) => (
  <div className="px-4 py-2 bg-gray-100 rounded-t-lg font-bold">{children}</div>
);

const CardContent = ({ children }) => <div className="p-4">{children}</div>;

// Constants
const transportModes = [
  { name: 'Sea', icon: '🚢', color: 'blue', defaultSpeed: 30 },
  { name: 'Air', icon: '✈️', color: 'green', defaultSpeed: 800 },
  { name: 'Land', icon: '🚛', color: 'orange', defaultSpeed: 60 },
];

const initialCities = [
  { name: 'Tokyo', x: 820, y: 130 },
  { name: 'Shanghai', x: 670, y: 210 },
  { name: 'Hong Kong', x: 620, y: 290 },
  { name: 'Singapore', x: 545, y: 520 },
  { name: 'Mumbai', x: 240, y: 350 },
  { name: 'Dubai', x: 50, y: 270 },
];

// Main Component
const AsiaWebmap = () => {
  // State variables
  const [cities, setCities] = useState(initialCities);
  const [routes, setRoutes] = useState(initialRoutesData);
  const [vehiclePositions, setVehiclePositions] = useState({});
  const [shippingTimes, setShippingTimes] = useState({});
  const [isSimulating, setIsSimulating] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [isCrisisMode, setIsCrisisMode] = useState(false);
  const [destroyType, setDestroyType] = useState(null);
  const [speeds, setSpeeds] = useState(
    Object.fromEntries(transportModes.map((mode) => [mode.name, mode.defaultSpeed]))
  );
  const [intervals, setIntervals] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [destroyedItems, setDestroyedItems] = useState([]);
  const [gptAnalysis, setGptAnalysis] = useState(null);
  const [destructionMessage, setDestructionMessage] = useState('');
  const [solutions, setSolutions] = useState([]);
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState(0);

  // Functions
  const simulateAllRoutes = () => {
    setIsSimulating(true);
    setIsStopped(false);
    setVehiclePositions({});
    setShippingTimes({});

    const currentRoutes = [...routes];

    const newIntervals = currentRoutes.map((route) => {
      const fromCity = cities.find((city) => city.name === route.Start);
      const toCity = cities.find((city) => city.name === route.End);
      const distance = route.Cost;
      const speed = speeds[route.Mode];
      const totalTime = distance / speed;
      let elapsedTime = 0;

      const intervalId = setInterval(() => {
        if (!isStopped) {
          elapsedTime += 0.1;
          const progress = Math.min(elapsedTime / totalTime, 1);

          setVehiclePositions((prev) => ({
            ...prev,
            [`${route.Start}-${route.End}-${route.Mode}`]: {
              x: fromCity.x + (toCity.x - fromCity.x) * progress,
              y: fromCity.y + (toCity.y - fromCity.y) * progress,
              mode: route.Mode,
            },
          }));

          setShippingTimes((prev) => ({
            ...prev,
            [`${route.Start}-${route.End}-${route.Mode}`]: elapsedTime.toFixed(1),
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

  const startCrisisSimulation = () => {
    setIsCrisisMode(true);
    setDestroyType(null);
    setSelectedCities([]);
  };

  const selectCity = (cityName) => {
    if (selectedCities.length < 2 && !selectedCities.includes(cityName)) {
      setSelectedCities([...selectedCities, cityName]);
    }
  };

  const destroyItem = (item) => {
    if (destroyType === 'city' && !selectedCities.includes(item)) {
      setCities((prevCities) => prevCities.filter((city) => city.name !== item));
      setRoutes((prevRoutes) =>
        prevRoutes.filter((route) => route.Start !== item && route.End !== item)
      );
      setDestroyedItems((prevDestroyedItems) => [
        ...prevDestroyedItems,
        { type: 'city', name: item },
      ]);
      setDestructionMessage(
        `Simulation of transport involving the city of ${item} is destroyed.`
      );
    } else if (destroyType === 'route') {
      setRoutes((prevRoutes) =>
        prevRoutes.filter(
          (route) =>
            !(
              route.Start === item.Start &&
              route.End === item.End &&
              route.Mode === item.Mode
            )
        )
      );
      setDestroyedItems((prevDestroyedItems) => [
        ...prevDestroyedItems,
        { type: 'route', ...item },
      ]);
      setDestructionMessage(
        `Simulation of the ${item.Mode} transport between ${item.Start} and ${item.End} is destroyed.`
      );
    }
    setIsCrisisMode(false);
    setDestroyType(null);
  };

  useEffect(() => {
    if (destroyedItems.length > 0 && selectedCities.length === 2) {
      analyzeRoutes();
    }
  }, [destroyedItems, routes, selectedCities]);

  const restoreAll = () => {
    setCities(initialCities);
    setRoutes(initialRoutesData);
    setDestroyedItems([]);
    setGptAnalysis(null);
    setDestructionMessage('');
    setSelectedCities([]);
    setSolutions([]);
  };

  const handleSpeedChange = (mode, value) => {
    setSpeeds((prev) => ({ ...prev, [mode]: value }));
  };

  const getTransportModeColor = (mode) => {
    return transportModes.find((m) => m.name === mode)?.color || 'gray';
  };

  const getTransportModeIcon = (mode) => {
    return transportModes.find((m) => m.name === mode)?.icon || '❓';
  };

  const nextSolution = () => {
    setCurrentSolutionIndex((prevIndex) =>
      prevIndex < solutions.length - 1 ? prevIndex + 1 : prevIndex
    );
  };

  const prevSolution = () => {
    setCurrentSolutionIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : prevIndex
    );
  };

  useEffect(() => {
    return () => intervals.forEach(clearInterval);
  }, [intervals]);

  const analyzeRoutes = async () => {
    if (selectedCities.length !== 2) {
      console.error('You must select exactly two cities to protect.');
      return;
    }

    const [startCity, endCity] = selectedCities;

    // Filter routes to exclude destroyed cities or routes
    const filteredRoutes = routes.filter((route) => {
      const routeInvolvesDestroyedCity = destroyedItems.some(
        (item) =>
          item.type === 'city' &&
          (route.Start === item.name || route.End === item.name)
      );
      const routeIsDestroyed = destroyedItems.some(
        (item) =>
          item.type === 'route' &&
          route.Start === item.Start &&
          route.End === item.End &&
          route.Mode === item.Mode
      );
      return !routeInvolvesDestroyedCity && !routeIsDestroyed;
    });

    // Find all possible paths from start to end city
    const findAllPaths = (start, end, routes, path = [], visited = new Set()) => {
      if (start === end) {
        return [path];
      }

      visited.add(start);
      let paths = [];

      for (const route of routes) {
        if (route.Start === start && !visited.has(route.End)) {
          const newPaths = findAllPaths(
            route.End,
            end,
            routes,
            [...path, route],
            new Set(visited)
          );
          paths.push(...newPaths);
        }
      }

      return paths;
    };

    const allPaths = findAllPaths(startCity, endCity, filteredRoutes);

    if (allPaths.length === 0) {
      console.log('No valid routes between the protected cities.');
      setSolutions([]);
      return;
    }

    
    const apiKey = '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';
    const prompt = `
We need to transport goods from ${startCity} to ${endCity}. Based on the remaining valid routes, provide 4 structured solutions strictly following this format, and separate each solution with '---':

1. Consideration: [Optimal solution / Cost-efficient / Time-saving / Environmentally friendly]

2. Route: [City 1 -> City 2 -> ... -> Final City] by [Mode1, Mode2, ...]

3. Cost: $X

4. Time: X hours

5. Carbon Footprint: X kg

6. Evaluation: [One-line comment without mentioning ratios or percentages]

Consider both direct routes (if available) and multi-step routes. For multi-step routes, list all modes used.

The first output must be the optimal solution, balancing cost, time, and environmental impact. The next solution is cost-efficient, the next is time-saving, and the last is environmentally friendly.

**Please do not mention any ratios or percentages in the evaluation.**

**Here is an example of the desired format:**

1. Consideration: Optimal solution

2. Route: [Shanghai -> Singapore] by [Sea]

3. Cost: $550

4. Time: 336 hours

5. Carbon Footprint: 650.2 kg

6. Evaluation: This is the most optimal solution, offering the best balance of cost, time, and carbon footprint.

Please ensure each solution strictly follows the format and uses the data provided. Do not include extra information or deviate from the structure.

Valid paths: ${JSON.stringify(
      allPaths.map((path) => ({
        route: path.map((r) => r.Start).concat(path[path.length - 1].End).join(' -> '),
        modes: path.map((r) => r.Mode).join(', '),
        totalCost: path.reduce((sum, r) => sum + r.Cost, 0),
        totalTime: path.reduce((sum, r) => sum + r.Time, 0),
        totalEnvironment: path.reduce((sum, r) => sum + r.Environment, 0),
      }))
    )}`;

    // Call OpenAI API to get solutions
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 1000,
          n: 1,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const gptSolutions = response.data.choices[0].message.content
        .split('---')
        .map((solution) => solution.trim())
        .filter(Boolean);

        setSolutions(gptSolutions);
        setCurrentSolutionIndex(0); // Reset to the first solution
      } else {
        setGptAnalysis('No analysis received from the API. Please try again.');
      }
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      setGptAnalysis('Error analyzing routes. Please try again.');
    }
  };

  const SolutionBox = ({ solution }) => (
    <div className="solution-box">
      {solution.split('\n').map((line, index) => (
        <p key={index}>{line}</p>
      ))}
    </div>
  );

  return (
    <div className="container">
      <div
        className="map-container"
        style={{ position: 'relative', width: '100%', height: '600px' }}
      >
        <img
          src={asiaMap}
          alt="Map of Asia"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1000 600"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {routes.map((route) => {
            const fromCity = cities.find((city) => city.name === route.Start);
            const toCity = cities.find((city) => city.name === route.End);
            if (fromCity && toCity) {
              const controlPointOffset = {
                Sea: { x: 0, y: -30 },
                Air: { x: 30, y: 0 },
                Land: { x: -30, y: 30 },
              };
              const offset = controlPointOffset[route.Mode];
              const key = `${route.Start}-${route.End}-${route.Mode}`;
              return (
                <path
                  key={key}
                  d={`M${fromCity.x},${fromCity.y} Q${
                    (fromCity.x + toCity.x) / 2 + offset.x
                  },${(fromCity.y + toCity.y) / 2 + offset.y} ${toCity.x},${
                    toCity.y
                  }`}
                  stroke={getTransportModeColor(route.Mode)}
                  strokeWidth="2"
                  fill="none"
                  onClick={() =>
                    isCrisisMode &&
                    destroyType === 'route' &&
                    destroyItem(route)
                  }
                  style={{
                    cursor:
                      isCrisisMode && destroyType === 'route'
                        ? 'pointer'
                        : 'default',
                  }}
                />
              );
            }
            return null;
          })}

          {cities.map((city) => (
            <g
              key={city.name}
              onClick={() =>
                isCrisisMode
                  ? destroyType === 'city' &&
                    !selectedCities.includes(city.name)
                    ? destroyItem(city.name)
                    : selectCity(city.name)
                  : null
              }
              style={{ cursor: isCrisisMode ? 'pointer' : 'default' }}
            >
              <circle
                cx={city.x}
                cy={city.y}
                r="5"
                fill={selectedCities.includes(city.name) ? 'red' : 'black'}
              />
              <text
                x={city.x + 10}
                y={city.y - 10}
                fontSize="12"
                fill="black"
                stroke="black"
                strokeWidth="0.5"
              >
                {city.name}
              </text>
            </g>
          ))}

          {Object.entries(vehiclePositions).map(([key, position]) => (
            <g key={key}>
              <circle
                cx={position.x}
                cy={position.y}
                r="5"
                fill={getTransportModeColor(position.mode)}
              />
              <text x={position.x + 10} y={position.y - 10} fontSize="20">
                {getTransportModeIcon(position.mode)}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="controls-container">
        <Card className="mb-4">
          <CardHeader>Shipping Controllers</CardHeader>
          <CardContent>
            <div className="button-group">
              <Button
                onClick={simulateAllRoutes}
                disabled={isSimulating || isCrisisMode}
              >
                Start
              </Button>
              <Button
                onClick={stopSimulation}
                disabled={!isSimulating || isStopped || isCrisisMode}
              >
                Stop
              </Button>
              <Button
                onClick={restartSimulation}
                disabled={(isSimulating && !isStopped) || isCrisisMode}
              >
                Restart
              </Button>
              <Button
                onClick={startCrisisSimulation}
                disabled={isSimulating || isCrisisMode}
              >
                Crisis Simulation
              </Button>
              <Button
                onClick={restoreAll}
                disabled={isSimulating || isCrisisMode}
              >
                Restore All
              </Button>
            </div>

            {isCrisisMode && !destroyType && (
              <div className="mb-4">
                <p>Select start point and end point:</p>
                <p>{selectedCities.join(', ')}</p>
                {selectedCities.length === 2 && (
                  <>
                    <p>
                      Selected cities for protection: {selectedCities[0]} and{' '}
                      {selectedCities[1]}
                    </p>
                    <Button
                      onClick={() => setDestroyType('city')}
                      className="mr-2"
                    >
                      Destroy City
                    </Button>
                    <Button onClick={() => setDestroyType('route')}>
                      Destroy Route
                    </Button>
                  </>
                )}
              </div>
            )}

            {isCrisisMode && destroyType && (
              <div className="mb-4">
                <p>Click on a {destroyType} to destroy it</p>
                <Button onClick={() => setIsCrisisMode(false)}>Cancel</Button>
              </div>
            )}

            {transportModes.map((mode) => (
              <div key={mode.name} className="mb-2">
                <div>
                  {mode.icon} {mode.name} Speed:
                </div>
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
                  <div key={key}>
                    {key}: {time} hours
                  </div>
                ))}
              </div>
            )}

            {gptAnalysis && (
              <div className="mt-4">
                <h3 className="font-bold">GPT Analysis:</h3>
                <p>{gptAnalysis}</p>
              </div>
            )}

            {destructionMessage && (
              <div className="mt-4 p-4 bg-red-100 text-red-600 rounded-lg">
                <p>{destructionMessage}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Solutions Display */}
        {solutions.length > 0 && (
          <div className="solutions-container">
            <SolutionBox solution={solutions[currentSolutionIndex]} />
            <div className="navigation-buttons">
              <Button onClick={prevSolution} disabled={currentSolutionIndex === 0}>
                <ChevronLeft />
              </Button>
              <Button
                onClick={nextSolution}
                disabled={currentSolutionIndex === solutions.length - 1}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AsiaWebmap;
