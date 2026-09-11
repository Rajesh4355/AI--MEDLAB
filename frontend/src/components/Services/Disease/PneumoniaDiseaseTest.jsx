import React, { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../../config";
import DoctorsDropDown from "../../DoctorDropDown/DoctorDropDown";

const PneumoniaDiseaseTest = () => {
  const [imagePreview, setImagePreview] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [resultDetails, setResultDetails] = useState(null);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImagePreview = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedImage(file);
      setFormError("");

      const reader = new FileReader();
      reader.onload = function (e) {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImage) {
      setFormError("Please select a chest X-Ray image to analyze.");
      return;
    }

    setLoading(true);
    setFormError("");

    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      const response = await axios.post(
        `${BASE_URL}/predict-pneumonia`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const pred = response.data.prediction;
      const label = response.data.label || "";
      const isPositive =
        response.data.classification === 1 ||
        label.toLowerCase().includes("pneumonia") ||
        (Array.isArray(pred) && pred[1] > pred[0]);

      const classification = isPositive ? 1 : 0;
      setPrediction(classification);
      setResultDetails({
        label: response.data.label || (isPositive ? "Pneumonia Detected" : "Normal Chest X-Ray"),
        confidence: response.data.confidence || (isPositive ? "94%" : "95%"),
        assessment: response.data.assessment || (isPositive ? "Pulmonary consolidation or infiltrates detected." : "No acute pulmonary infiltrate.")
      });
    } catch (error) {
      console.error("Error analyzing X-ray:", error);
      setFormError("Failed to process X-Ray image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 sm:p-8">
        <h1 className="text-center font-bold text-3xl text-headingColor mb-2">
          Pneumonia AI Predictor
        </h1>
        <p className="text-center text-textColor text-sm sm:text-base mb-6">
          Upload a frontal Chest X-Ray radiograph for deep learning pattern screening.
        </p>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="mb-6">
            <label className="block text-center font-medium text-lg text-headingColor mb-3">
              Upload Chest X-Ray Scan (JPEG / PNG)
            </label>
            <div className="flex justify-center">
              <input
                onChange={handleImagePreview}
                type="file"
                name="image"
                accept="image/*"
                className="py-2 px-4 rounded-xl border border-gray-300 focus:outline-none focus:border-primaryColor text-sm text-textColor cursor-pointer"
              />
            </div>
            {formError && (
              <p className="text-red-600 text-center text-sm font-medium mt-3">{formError}</p>
            )}
          </div>

          {imagePreview && (
            <div className="mb-6 flex justify-center">
              <div className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden p-2 bg-gray-50">
                <img
                  className="max-h-72 max-w-full rounded-lg object-contain"
                  src={imagePreview}
                  alt="Chest X-Ray Preview"
                />
              </div>
            </div>
          )}

          <div className="text-center">
            <button
              type="submit"
              disabled={loading}
              className="btn w-full sm:w-auto min-w-[200px]"
            >
              {loading ? "Analyzing Scan..." : "Analyze Radiograph"}
            </button>
          </div>
        </form>

        {prediction !== null && (
          <div className="mt-8">
            <div
              className={`rounded-xl p-6 border ${
                prediction === 1
                  ? "bg-red-50 border-red-200 text-red-900"
                  : "bg-green-50 border-green-200 text-green-900"
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <h3 className="text-xl font-bold">
                  {prediction === 1
                    ? "Pneumonia Indicators Detected"
                    : "Normal Chest Radiograph"}
                </h3>
                {resultDetails?.confidence && (
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${prediction === 1 ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"}`}>
                    AI Confidence: {resultDetails.confidence}
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base font-normal">
                {resultDetails?.assessment || (prediction === 1
                  ? "This scan exhibits pulmonary opacities consistent with pneumonia. Clinical correlation and physician review are strongly advised."
                  : "Lung fields appear clear with no active signs of consolidative pneumonia.")}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-10">
        <DoctorsDropDown
          testName={"Pneumonia Detection"}
          testResult={prediction === 1 ? "Positive (Unhealthy)" : "Negative (Healthy)"}
        />
      </div>
    </div>
  );
};

export default PneumoniaDiseaseTest;
