import React from "react";
import { useNavigate } from "react-router-dom";

const ResultComponent = ({ prediction }) => {
  const navigate = useNavigate();

  const handleNavigateHome = () => {
    navigate("/"); // Navigate to the home page
  };

  const isPositive = prediction === 1 || prediction === "1" || (typeof prediction === "string" && prediction.includes("[1]"));

  return (
    <div className="max-w-2xl mx-auto my-12 px-4">
      {isPositive ? (
        <div className="bg-red-50 border border-red-300 text-red-800 rounded-xl p-6 text-center shadow-sm">
          <p className="text-xl font-bold mb-1">Pneumonia Indicators Detected</p>
          <p className="text-base">This scan indicates patterns consistent with pneumonia. Please consult a specialist.</p>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-300 text-green-800 rounded-xl p-6 text-center shadow-sm">
          <p className="text-xl font-bold mb-1">No Pneumonia Detected</p>
          <p className="text-base">This scan indicates clear lung fields with no acute consolidation.</p>
        </div>
      )}
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleNavigateHome}
          className="btn"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default ResultComponent;
