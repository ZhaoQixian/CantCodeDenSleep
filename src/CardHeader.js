import React from "react";

const CardHeader = ({ children }) => (
    <div className="px-4 py-2 bg-gray-100 rounded-t-lg font-bold">
      {children}
    </div>
  );

export default CardHeader;