import React, { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../../config";
import DoctorsDropDown from "../../DoctorDropDown/DoctorDropDown";

const BreastCancerDiseaseTest = () => {
  const [inputData, setInputData] = useState({
    radius_mean: "",
    texture_mean: "",
    perimeter_mean: "",
    area_mean: "",
    smoothness_mean: "",
    compactness_mean: "",
    concavity_mean: "",
    concave_points_mean: "",
    symmetry_mean: "",
    fractal_dimension_mean: "",
    radius_se: "",
    texture_se: "",
    perimeter_se: "",
    area_se: "",
    smoothness_se: "",
    compactness_se: "",
    concavity_se: "",
    concave_points_se: "",
    symmetry_se: "",
    fractal_dimension_se: "",
    radius_worst: "",
    texture_worst: "",
    perimeter_worst: "",
    area_worst: "",
    smoothness_worst: "",
    compactness_worst: "",
    concavity_worst: "",
    concave_points_worst: "",
    symmetry_worst: "",
    fractal_dimension_worst: "",
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
      setFormError("Please fill out all biometric feature fields.");
      return;
    }

    setLoading(true);
    setFormError("");

    try {
      const response = await axios.post(`${BASE_URL}/breast-cancer`, {
        data: inputData,
      });
      setPrediction(response.data.prediction);
      setResultDetails(response.data);
    } catch (error) {
      console.error("Error predicting breast cancer:", error);
      setFormError("Failed to calculate breast cancer risk. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isPositive = prediction?.includes("[1]");

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 sm:p-8">
        <h1 className="text-center font-bold text-3xl text-headingColor mb-2">
          Breast Cancer Risk Predictor
        </h1>
        <p className="text-center text-textColor text-sm sm:text-base mb-6">
          Input FNA fine needle aspirate biopsy features to classify cellular morphology.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {Object.entries(inputData).map(([name, value]) => (
              <div key={name} className="col-span-1">
                <label className="block text-xs font-medium text-textColor mb-1 truncate" title={name}>
                  {name.replace(/_/g, " ")}
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs text-headingColor focus:outline-none focus:border-primaryColor"
                  type="text"
                  name={name}
                  placeholder={`e.g. 14.5`}
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
              {loading ? "Analyzing Morphometry..." : "Classify Biopsy Data"}
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
                    ? "Malignant / High-Risk Patterns Detected"
                    : "Benign Morphological Characteristics"}
                </h3>
                {resultDetails?.riskScore !== undefined && (
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${isPositive ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"}`}>
                    Risk Index: {resultDetails.riskScore}/100
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base font-normal">
                {resultDetails?.details?.assessment || (isPositive
                  ? "Cellular dimensional patterns show attributes consistent with malignancy. An oncologist or mammography follow-up is urged."
                  : "Biopsy features fall within typical non-malignant tissue thresholds.")}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-10">
        <DoctorsDropDown
          testName={"Breast Cancer Predictor"}
          testResult={isPositive ? "Malignant / High Risk (Unhealthy)" : "Benign / Low Risk (Healthy)"}
        />
      </div>
    </div>
  );
};

export default BreastCancerDiseaseTest;
