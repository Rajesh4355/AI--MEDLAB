import React, { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../../config";
import DoctorsDropDown from "../../DoctorDropDown/DoctorDropDown";

const KidneyDiseaseTest = () => {
  const [inputData, setInputData] = useState({
    Age: "",
    BP: "",
    AL: "",
    SU: "",
    RBC: "",
    PC: "",
    PCC: "",
    BA: "",
    BGR: "",
    BU: "",
    SC: "",
    POT: "",
    WC: "",
    HTN: "",
    DM: "",
    CAD: "",
    PE: "",
    ANE: "",
  });
  const [prediction, setPrediction] = useState(null);
  const [resultDetails, setResultDetails] = useState(null);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputData({ ...inputData, [name]: value });
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isFormFilled = Object.values(inputData).every(
      (value) => String(value).trim() !== ""
    );
    if (!isFormFilled) {
      setFormError("Please fill out all renal indicator fields.");
      return;
    }

    setLoading(true);
    setFormError("");

    try {
      const response = await axios.post(`${BASE_URL}/kidney`, {
        data: inputData,
      });
      setPrediction(response.data.prediction);
      setResultDetails(response.data);
    } catch (error) {
      console.error("Error predicting kidney disease:", error);
      setFormError("Failed to calculate kidney risk. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isPositive = prediction?.includes("[1]");

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 sm:p-8">
        <h1 className="text-center font-bold text-3xl text-headingColor mb-2">
          Chronic Kidney Disease Predictor
        </h1>
        <p className="text-center text-textColor text-sm sm:text-base mb-6">
          Enter renal biomarkers and clinical records for nephrology risk evaluation.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {Object.entries(inputData).map(([name, value]) => (
              <div key={name} className="col-span-1">
                <label className="block text-xs font-semibold text-textColor mb-1">
                  {name}
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-headingColor focus:outline-none focus:border-primaryColor"
                  type="text"
                  name={name}
                  placeholder={`Enter ${name}`}
                  value={value}
                  onChange={handleInputChange}
                />
              </div>
            ))}
          </div>

          {formError && (
            <div className="text-red-600 text-sm font-medium mb-4 text-center">
              {formError}
            </div>
          )}

          <div className="text-center">
            <button
              type="submit"
              disabled={loading}
              className="btn w-full sm:w-auto min-w-[200px]"
            >
              {loading ? "Analyzing Biomarkers..." : "Predict Kidney Health"}
            </button>
          </div>
        </form>

        {prediction !== null && (
          <div className="mt-8">
            <div
              className={`rounded-xl p-6 border ${
                isPositive
                  ? "bg-red-50 border-red-200 text-red-900"
                  : "bg-green-50 border-green-200 text-green-900"
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <h3 className="text-xl font-bold">
                  {isPositive
                    ? "Renal Impairment Indicators Detected"
                    : "Normal Kidney Function Indicators"}
                </h3>
                {resultDetails?.riskScore !== undefined && (
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${isPositive ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"}`}>
                    Risk Index: {resultDetails.riskScore}/100
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base font-normal">
                {resultDetails?.details?.assessment || (isPositive
                  ? "Screening values indicate potential risk of chronic kidney disease. A nephrologist consultation is strongly advised."
                  : "Renal filtration and electrolyte parameters are within typical healthy bounds.")}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-10">
        <DoctorsDropDown
          testName={"Kidney Disease Predictor"}
          testResult={isPositive ? "Elevated Risk (Unhealthy)" : "Low Risk (Healthy)"}
        />
      </div>
    </div>
  );
};

export default KidneyDiseaseTest;
