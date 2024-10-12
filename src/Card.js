import React from 'react';

  const Card = ({ children, className }) => (
    <div className={`bg-white shadow-md rounded-lg ${className}`}>
      {children}
    </div>
  );
export default Card;