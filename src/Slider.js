import React from "react";

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

export default Slider;