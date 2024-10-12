import React, { useState, useEffect } from "react";
import * as d3 from "d3";
import "./App.css";

const gridRows = 3;  // Number of block rows
const gridCols = 4;  // Number of block columns
const truckCount = 3;

function App() {
  // Initialize truck positions on the horizontal or vertical roads (between blocks)
  const [trucks, setTrucks] = useState(
    Array.from({ length: truckCount }, (_, i) => ({
      x: 0,  // Starting on the road (horizontal road between blocks)
      y: i   // Distribute trucks vertically between blocks on the road
    }))
  );

  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    // Initialize the grid and simulation
    const svg = d3.select("#simulation-svg")
      .attr("width", 1000)
      .attr("height", 700);

    // Draw the grid blocks (with 3 stacks in each block)
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        svg.append("rect")
          .attr("x", col * 200 + 50)  // Block spacing to create roads
          .attr("y", row * 200 + 50)
          .attr("width", 100)
          .attr("height", 100)
          .attr("fill", "#95a5a6")
          .attr("stroke", "#2c3e50")
          .attr("stroke-width", 2);

        // Add stacks in the block
        for (let stack = 0; stack < 3; stack++) {
          svg.append("rect")
            .attr("x", col * 200 + 60 + stack * 20)
            .attr("y", row * 200 + 60)
            .attr("width", 15)
            .attr("height", 80)
            .attr("fill", "#bdc3c7");
        }
      }
    }

    // Add ships on random edges
    svg.append("text")
      .attr("x", 30)
      .attr("y", 20)
      .text("🚢")
      .attr("font-size", "40px");

    // Add trucks to the grid (on roads)
    trucks.forEach((truck, i) => {
      svg.append("text")
        .attr("id", `truck-${i}`)
        .attr("x", truck.x * 200 + 125)  // On the road between blocks
        .attr("y", truck.y * 200 + 125)  // On the road between blocks
        .text("🚚")
        .attr("font-size", "40px");
    });

    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Function to move trucks along the roads
  const moveTrucks = () => {
    setTrucks((prevTrucks) =>
      prevTrucks.map((truck) => {
        const isHorizontalRoad = truck.y % 2 === 0;
        const isVerticalRoad = truck.x % 2 === 0;

        let newX = truck.x;
        let newY = truck.y;

        if (isHorizontalRoad) {
          // Horizontal roads: only move along the x-axis
          newX = (truck.x + (Math.random() < 0.5 ? -1 : 1)) % gridCols;
          newX = (newX + gridCols) % gridCols;  // Ensure position is within grid
        } else if (isVerticalRoad) {
          // Vertical roads: only move along the y-axis
          newY = (truck.y + (Math.random() < 0.5 ? -1 : 1)) % gridRows;
          newY = (newY + gridRows) % gridRows;  // Ensure position is within grid
        }

        return {
          x: newX,
          y: newY,
        };
      })
    );
  };

  // Start truck movement every 5 seconds
  const startSimulation = () => {
    if (!intervalId) {
      const id = setInterval(() => {
        moveTrucks();
      }, 5000);
      setIntervalId(id);
    }
  };

  // Stop truck movement
  const stopSimulation = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  // Update truck positions in the SVG on each render
  useEffect(() => {
    trucks.forEach((truck, i) => {
      d3.select(`#truck-${i}`)
        .transition()
        .duration(500)
        .attr("x", truck.x * 200 + 125)  // Position on road between blocks
        .attr("y", truck.y * 200 + 125);  // Position on road between blocks
    });
  }, [trucks]);

  return (
    <div className="App">
      <h1>PSA Port and Warehouse Simulation (Trucks on Roads)</h1>
      <button onClick={startSimulation}>Start Truck Movement</button>
      <button onClick={stopSimulation}>Stop Truck Movement</button>
      <svg id="simulation-svg"></svg>
    </div>
  );
}

export default App;
