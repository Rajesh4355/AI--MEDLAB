import React, { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../config";
import DoctorsDropDown from "../components/DoctorDropDown/DoctorDropDown";

const POPULAR_SYMPTOMS = [
  "High Fever",
  "Headache",
  "Cough",
  "Fatigue",
  "Chills",
  "Nausea",
  "Vomiting",
  "Stomach Pain",
  "Breathlessness",
  "Chest Pain",
  "Skin Rash",
  "Joint Pain",
  "Continuous Sneezing",
  "Runny Nose",
  "Loss of Appetite",
  "Diarrhoea",
  "Dizziness",
  "Acidity",
  "Sweating",
  "Muscle Pain",
];

function formatList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(s => String(s).trim()).filter(Boolean);
  if (typeof raw === "string") {
    try {
      const fixed = raw.replace(/'/g, '"');
      const parsed = JSON.parse(fixed);
      if (Array.isArray(parsed)) return parsed.map(s => String(s).trim()).filter(Boolean);
    } catch (_err) {
      // Fall through to manual regex parsing
    }
    return raw
      .replace(/[[\]'"]/g, "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }
  return [];
}

const Symptomchk = () => {
  const [symptomInput, setSymptomInput] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [activeTab, setActiveTab] = useState("overview");

  // Result state
  const [result, setResult] = useState(null);

  const toggleSymptom = (sym) => {
    const formatted = sym.trim();
    if (selectedSymptoms.some((s) => s.toLowerCase() === formatted.toLowerCase())) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s.toLowerCase() !== formatted.toLowerCase()));
    } else {
      setSelectedSymptoms([...selectedSymptoms, formatted]);
    }
  };

  const handleAddCustomSymptom = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      e.preventDefault();
      if (!symptomInput.trim()) return;

      const split = symptomInput
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const toAdd = split.filter(
        (newItem) => !selectedSymptoms.some((existing) => existing.toLowerCase() === newItem.toLowerCase())
      );

      if (toAdd.length > 0) {
        setSelectedSymptoms([...selectedSymptoms, ...toAdd]);
      }
      setSymptomInput("");
    }
  };

  const handlePrediction = async (e) => {
    e?.preventDefault();

    let allSymptoms = [...selectedSymptoms];
    if (symptomInput.trim()) {
      const extra = symptomInput
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
      allSymptoms = Array.from(new Set([...allSymptoms, ...extra]));
    }

    if (allSymptoms.length === 0) {
      setErrorMessage("Please select or enter at least one symptom.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.post(`${BASE_URL}/symptoms`, {
        data: allSymptoms,
      });

      const data = response.data?.data || {};

      setResult({
        disease: data.predicted_disease || "Undetermined Health Pattern",
        description: data.dis_des || "",
        confidence: data.confidence || "85%",
        matchedSymptoms: data.matched_symptoms || allSymptoms,
        precautions: formatList(data.precautions || data.my_precautions),
        medications: formatList(data.medications_list || data.medications),
        diets: formatList(data.diet_list || data.rec_diet),
        workout: data.workout || "Adequate bed rest, hydration, and light mobility as tolerated.",
        alternatives: data.alternative_diagnoses || [],
      });
      setActiveTab("overview");
    } catch (error) {
      console.error("Prediction error:", error);
      setErrorMessage(
        error.response?.data?.error || "Failed to analyze symptoms. Please check connectivity and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = () => {
    setSelectedSymptoms([]);
    setSymptomInput("");
    setResult(null);
    setErrorMessage("");
  };

  return (
    <section className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="bg-blue-100 text-primaryColor text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            AI Diagnostic Engine
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-headingColor mt-3">
            Symptom-Based Disease Checker
          </h1>
          <p className="text-textColor text-sm sm:text-base mt-2 max-w-2xl mx-auto">
            Select your symptoms or describe how you feel. Our AI cross-references 40+ clinical conditions,
            pharmacotherapy guidelines, and dietary precautions.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8 mb-8">
          {/* Quick Selection Tags */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-headingColor mb-2">
              Common Symptoms (Click to toggle):
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SYMPTOMS.map((sym) => {
                const isSelected = selectedSymptoms.some(
                  (s) => s.toLowerCase() === sym.toLowerCase()
                );
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    className={`text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-full transition-colors ${
                      isSelected
                        ? "bg-primaryColor text-white shadow-sm"
                        : "bg-gray-100 text-textColor hover:bg-gray-200"
                    }`}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Input */}
          <div className="mb-4">
            <label htmlFor="symptom-input" className="block text-sm font-semibold text-headingColor mb-2">
              Add More Symptoms (comma-separated or press Enter):
            </label>
            <div className="flex gap-2">
              <input
                id="symptom-input"
                type="text"
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm text-headingColor focus:outline-none focus:border-primaryColor shadow-inner"
                placeholder="e.g. skin rash, joint swelling, acid reflux"
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                onKeyDown={handleAddCustomSymptom}
              />
              <button
                type="button"
                onClick={handleAddCustomSymptom}
                className="bg-gray-100 hover:bg-gray-200 text-headingColor font-medium px-5 py-3 rounded-xl text-sm transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Selected Symptoms Pill Display */}
          {selectedSymptoms.length > 0 && (
            <div className="mb-6 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-primaryColor uppercase">
                  Selected Symptoms ({selectedSymptoms.length})
                </span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedSymptoms.map((sym) => (
                  <span
                    key={sym}
                    className="inline-flex items-center gap-1.5 bg-white border border-blue-200 text-blue-900 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-2xs"
                  >
                    {sym}
                    <button
                      type="button"
                      onClick={() => toggleSymptom(sym)}
                      className="text-blue-500 hover:text-red-600 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {errorMessage}
            </div>
          )}

          {/* Submit Action */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end items-center">
            <button
              type="button"
              onClick={handlePrediction}
              disabled={isLoading || (selectedSymptoms.length === 0 && !symptomInput.trim())}
              className="btn w-full sm:w-auto min-w-[200px]"
            >
              {isLoading ? "Running AI Diagnosis..." : "Analyze Symptoms"}
            </button>
          </div>
        </div>

        {/* Diagnostic Results Section */}
        {result && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
            {/* Primary Diagnosis Hero */}
            <div className="border-b border-gray-100 pb-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div>
                  <span className="text-xs uppercase font-bold text-textColor">
                    Primary Predicted Condition
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-headingColor text-primaryColor">
                    {result.disease}
                  </h2>
                </div>
                <div className="inline-flex items-center gap-2 self-start sm:self-auto bg-green-50 border border-green-200 px-4 py-2 rounded-xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-sm font-bold text-green-800">
                    Confidence: {result.confidence}
                  </span>
                </div>
              </div>

              {result.matchedSymptoms?.length > 0 && (
                <div className="mt-3 flex items-center flex-wrap gap-1.5">
                  <span className="text-xs font-semibold text-textColor mr-1">
                    Matched Symptoms:
                  </span>
                  {result.matchedSymptoms.map((sym) => (
                    <span
                      key={sym}
                      className="bg-gray-100 text-gray-700 text-xs px-2.5 py-0.5 rounded-md font-medium"
                    >
                      {sym}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4 mb-6">
              {[
                { id: "overview", label: "Overview & Causes" },
                { id: "precautions", label: "Precautions & Steps" },
                { id: "medications", label: "Medications" },
                { id: "diet", label: "Dietary Guide" },
                { id: "workout", label: "Physical Activity & Rest" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-primaryColor text-white shadow-xs"
                      : "bg-gray-100 text-textColor hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="mb-8">
              {activeTab === "overview" && (
                <div>
                  <h3 className="text-lg font-bold text-headingColor mb-2">
                    Condition Description
                  </h3>
                  <p className="text-textColor leading-relaxed text-sm sm:text-base bg-blue-50/40 p-4 rounded-xl border border-blue-100">
                    {result.description}
                  </p>

                  {result.alternatives?.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-bold text-headingColor mb-2">
                        Differential Diagnoses to Discuss with Doctor:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {result.alternatives.map((alt) => (
                          <div
                            key={alt.disease}
                            className="border border-gray-200 rounded-xl p-3 bg-gray-50 flex justify-between items-center"
                          >
                            <span className="font-semibold text-sm text-headingColor">
                              {alt.disease}
                            </span>
                            <span className="text-xs text-textColor">
                              {alt.matchedCount} symptoms matched
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "precautions" && (
                <div>
                  <h3 className="text-lg font-bold text-headingColor mb-3">
                    Recommended Precautions & Care Measures
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.precautions.map((prec, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3.5 bg-yellow-50/60 border border-yellow-200 rounded-xl"
                      >
                        <span className="text-yellow-600 font-bold text-base mt-0.5">
                          ✓
                        </span>
                        <span className="text-sm font-medium text-headingColor">
                          {prec}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "medications" && (
                <div>
                  <h3 className="text-lg font-bold text-headingColor mb-2">
                    Commonly Prescribed Medications
                  </h3>
                  <p className="text-xs text-textColor mb-4">
                    Note: Always consult a licensed physician before starting any prescription medication.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.medications.map((med, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 border border-red-200 text-red-900 rounded-xl text-sm font-semibold"
                      >
                        💊 {med}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "diet" && (
                <div>
                  <h3 className="text-lg font-bold text-headingColor mb-3">
                    Dietary & Nutritional Recommendations
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.diets.map((diet, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl"
                      >
                        <span className="text-emerald-600 font-bold text-base mt-0.5">
                          🥗
                        </span>
                        <span className="text-sm font-medium text-headingColor">
                          {diet}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "workout" && (
                <div>
                  <h3 className="text-lg font-bold text-headingColor mb-2">
                    Activity & Rest Guidelines
                  </h3>
                  <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl text-sm sm:text-base text-headingColor font-medium leading-relaxed">
                    🏃 {result.workout}
                  </div>
                </div>
              )}
            </div>

            {/* Doctor Booking Consultation Dropdown */}
            <div className="border-t border-gray-100 pt-8 mt-8">
              <h3 className="text-xl font-bold text-headingColor text-center mb-2">
                Need Further Assessment?
              </h3>
              <p className="text-textColor text-sm text-center mb-6 max-w-lg mx-auto">
                Connect directly with a licensed physician to review your AI symptom report and confirm diagnosis.
              </p>
              <DoctorsDropDown
                testName={`Symptom Checker: ${result.disease}`}
                testResult={result.disease}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Symptomchk;
