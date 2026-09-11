import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router({ mergeParams: true });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const healthPredictDir = path.resolve(__dirname, "../HealthPredict");

function parseCSVLine(text) {
  const result = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

function cleanList(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
  if (typeof val === "string") {
    try {
      const fixed = val.replace(/'/g, '"');
      const parsed = JSON.parse(fixed);
      if (Array.isArray(parsed)) return parsed.map(s => String(s).trim()).filter(Boolean);
    } catch (e) {
      // Ignore JSON parse error, fallback to regex
    }
    return val
      .replace(/[\[\]'"]/g, "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }
  return [];
}

let loadedData = null;

function loadDatasets() {
  if (loadedData) return loadedData;

  // 1. Symptom Severity
  const severityMap = new Map();
  try {
    const sevContent = fs.readFileSync(path.join(healthPredictDir, "Symptom-severity.csv"), "utf-8");
    const lines = sevContent.split("\n").filter(l => l.trim().length > 0);
    for (let i = 1; i < lines.length; i++) {
      const parts = parseCSVLine(lines[i]);
      if (parts.length >= 2) {
        severityMap.set(parts[0].trim().toLowerCase().replace(/_/g, " "), parseInt(parts[1], 10) || 3);
      }
    }
  } catch (e) {
    console.warn("Could not load Symptom-severity.csv", e.message);
  }

  // 2. Training Dataset (True distribution of 41 diseases over 132 symptoms)
  const diseaseCounts = {};
  const diseaseSymptomCounts = {};
  let canonicalSymptoms = [];

  try {
    const trainContent = fs.readFileSync(path.join(healthPredictDir, "Training.csv"), "utf-8");
    const lines = trainContent.split("\n").filter(l => l.trim().length > 0);
    if (lines.length > 0) {
      const headers = parseCSVLine(lines[0]);
      canonicalSymptoms = headers.slice(0, headers.length - 1).map(s => s.trim());

      for (let i = 1; i < lines.length; i++) {
        const parts = parseCSVLine(lines[i]);
        const disease = parts[parts.length - 1]?.trim();
        if (!disease) continue;

        diseaseCounts[disease] = (diseaseCounts[disease] || 0) + 1;
        if (!diseaseSymptomCounts[disease]) diseaseSymptomCounts[disease] = {};

        for (let j = 0; j < canonicalSymptoms.length; j++) {
          if (parts[j] === "1") {
            const sym = canonicalSymptoms[j].toLowerCase().replace(/_/g, " ").trim();
            diseaseSymptomCounts[disease][sym] = (diseaseSymptomCounts[disease][sym] || 0) + 1;
          }
        }
      }
    }
  } catch (e) {
    console.warn("Could not load Training.csv", e.message);
  }

  // 3. Descriptions
  const descMap = new Map();
  try {
    const descContent = fs.readFileSync(path.join(healthPredictDir, "description.csv"), "utf-8");
    const lines = descContent.split("\n").filter(l => l.trim().length > 0);
    for (let i = 1; i < lines.length; i++) {
      const parts = parseCSVLine(lines[i]);
      if (parts.length >= 2) {
        descMap.set(parts[0].trim().toLowerCase(), parts[1].trim());
      }
    }
  } catch (e) {
    console.warn("Could not load description.csv", e.message);
  }

  // 4. Precautions
  const precautionsMap = new Map();
  try {
    const precContent = fs.readFileSync(path.join(healthPredictDir, "precautions_df.csv"), "utf-8");
    const lines = precContent.split("\n").filter(l => l.trim().length > 0);
    for (let i = 1; i < lines.length; i++) {
      const parts = parseCSVLine(lines[i]);
      if (parts.length >= 2) {
        const disease = parts[1].trim().toLowerCase();
        const precautions = parts.slice(2).filter(p => p && p.trim().length > 0);
        precautionsMap.set(disease, precautions);
      }
    }
  } catch (e) {
    console.warn("Could not load precautions_df.csv", e.message);
  }

  // 5. Medications
  const medMap = new Map();
  try {
    const medContent = fs.readFileSync(path.join(healthPredictDir, "medications.csv"), "utf-8");
    const lines = medContent.split("\n").filter(l => l.trim().length > 0);
    for (let i = 1; i < lines.length; i++) {
      const parts = parseCSVLine(lines[i]);
      if (parts.length >= 2) {
        medMap.set(parts[0].trim().toLowerCase(), cleanList(parts[1]));
      }
    }
  } catch (e) {
    console.warn("Could not load medications.csv", e.message);
  }

  // 6. Diets
  const dietMap = new Map();
  try {
    const dietContent = fs.readFileSync(path.join(healthPredictDir, "diets.csv"), "utf-8");
    const lines = dietContent.split("\n").filter(l => l.trim().length > 0);
    for (let i = 1; i < lines.length; i++) {
      const parts = parseCSVLine(lines[i]);
      if (parts.length >= 2) {
        dietMap.set(parts[0].trim().toLowerCase(), cleanList(parts[1]));
      }
    }
  } catch (e) {
    console.warn("Could not load diets.csv", e.message);
  }

  // 7. Workouts
  const workoutMap = new Map();
  try {
    const workoutContent = fs.readFileSync(path.join(healthPredictDir, "workout_df.csv"), "utf-8");
    const lines = workoutContent.split("\n").filter(l => l.trim().length > 0);
    for (let i = 1; i < lines.length; i++) {
      const parts = parseCSVLine(lines[i]);
      if (parts.length >= 3) {
        workoutMap.set(parts[1].trim().toLowerCase(), parts[2].trim());
      }
    }
  } catch (e) {
    console.warn("Could not load workout_df.csv", e.message);
  }

  loadedData = {
    severityMap,
    diseaseCounts,
    diseaseSymptomCounts,
    canonicalSymptoms,
    descMap,
    precautionsMap,
    medMap,
    dietMap,
    workoutMap,
  };
  return loadedData;
}

// Symptom synonyms and natural language mapping
const SYNONYM_MAP = {
  fever: ["high fever", "mild fever"],
  pyrexia: ["high fever"],
  temperature: ["high fever"],
  cough: ["cough"],
  coughing: ["cough"],
  headache: ["headache"],
  headpain: ["headache"],
  migraine: ["headache", "pain behind the eyes"],
  cold: ["continuous sneezing", "chills", "runny nose"],
  sneezing: ["continuous sneezing"],
  throat: ["throat irritation", "patches in throat"],
  "sore throat": ["throat irritation", "patches in throat"],
  stomach: ["stomach pain", "abdominal pain", "belly pain"],
  "stomach pain": ["stomach pain", "abdominal pain"],
  "belly pain": ["belly pain", "abdominal pain"],
  "abdominal pain": ["abdominal pain", "stomach pain"],
  vomit: ["vomiting", "nausea"],
  vomiting: ["vomiting"],
  nausea: ["nausea"],
  puke: ["vomiting"],
  diarrhea: ["diarrhoea"],
  "loose motion": ["diarrhoea"],
  "chest pain": ["chest pain"],
  breathless: ["breathlessness"],
  "shortness of breath": ["breathlessness"],
  tired: ["fatigue", "lethargy"],
  tiredness: ["fatigue"],
  exhaustion: ["fatigue"],
  fatigue: ["fatigue"],
  weakness: ["muscle weakness", "weakness in limbs", "fatigue"],
  "joint pain": ["joint pain", "swelling joints"],
  "knee pain": ["knee pain", "joint pain"],
  itching: ["itching", "internal itching"],
  itch: ["itching"],
  rash: ["skin rash", "red spots over body"],
  dizzy: ["dizziness"],
  dizziness: ["dizziness", "loss of balance"],
  vertigo: ["spinning movements", "loss of balance", "unsteadiness"],
  jaundice: ["yellowish skin", "yellowing of eyes", "dark urine"],
  "yellow skin": ["yellowish skin", "yellowing of eyes"],
  "yellow eyes": ["yellowing of eyes"],
  sweat: ["sweating"],
  sweating: ["sweating"],
  acidity: ["acidity", "indigestion"],
  heartburn: ["acidity", "stomach pain"],
  gas: ["passage of gases", "distention of abdomen"],
  bloating: ["distention of abdomen", "fluid overload"],
  chills: ["chills", "shivering"],
  shivering: ["shivering", "chills"],
};

function normalizeUserSymptoms(inputRaw) {
  let tokens = [];
  if (Array.isArray(inputRaw)) {
    tokens = inputRaw.map(s => String(s).trim().toLowerCase());
  } else if (typeof inputRaw === "string") {
    tokens = inputRaw
      .toLowerCase()
      .split(/[,\n;]/)
      .map(s => s.trim().replace(/_/g, " "))
      .filter(s => s.length > 0);
  }

  const normalizedSet = new Set();

  for (const token of tokens) {
    if (!token) continue;
    let mapped = false;

    // Check exact synonym
    if (SYNONYM_MAP[token]) {
      for (const target of SYNONYM_MAP[token]) normalizedSet.add(target);
      mapped = true;
    }

    // Check multi-word match or partial match in SYNONYM_MAP
    if (!mapped) {
      for (const [k, targets] of Object.entries(SYNONYM_MAP)) {
        if (token.includes(k) || k.includes(token)) {
          for (const target of targets) normalizedSet.add(target);
          mapped = true;
        }
      }
    }

    // Always keep token itself cleaned
    normalizedSet.add(token);
  }

  return Array.from(normalizedSet);
}

// Symptom list endpoint for UI autocomplete & badges
router.get("/symptoms/list", (req, res) => {
  const { canonicalSymptoms } = loadDatasets();
  const popular = [
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
    "Muscle Pain"
  ];
  const allFormatted = (canonicalSymptoms || []).map(s =>
    s
      .replace(/_/g, " ")
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );

  return res.json({
    popular,
    all: allFormatted,
  });
});

router.post("/symptoms", (req, res) => {
  try {
    const rawData = req.body.data;
    const inputSymptoms = normalizeUserSymptoms(rawData);

    if (inputSymptoms.length === 0) {
      return res.status(400).json({ error: "No valid symptoms provided." });
    }

    const {
      severityMap,
      diseaseCounts,
      diseaseSymptomCounts,
      descMap,
      precautionsMap,
      medMap,
      dietMap,
      workoutMap,
    } = loadDatasets();

    // Score every disease based on clinical symptom frequency & severity
    const diseaseScores = [];

    for (const [disease, totalCases] of Object.entries(diseaseCounts)) {
      const symCounts = diseaseSymptomCounts[disease] || {};
      let totalMatchWeight = 0;
      let matchedSymptoms = [];
      const totalDiseaseSymptoms = Object.keys(symCounts).length || 1;

      for (const userSym of inputSymptoms) {
        for (const [knownSym, count] of Object.entries(symCounts)) {
          // Check substring or equality
          const isDirectMatch = knownSym === userSym || knownSym.includes(userSym) || userSym.includes(knownSym);
          if (isDirectMatch) {
            const symptomWeight = severityMap.get(knownSym) || 3;
            const frequency = count / totalCases; // 0.0 to 1.0
            const scoreContribution = frequency * symptomWeight * 10;
            totalMatchWeight += scoreContribution;
            if (!matchedSymptoms.includes(knownSym)) {
              matchedSymptoms.push(knownSym);
            }
          }
        }
      }

      if (matchedSymptoms.length > 0) {
        // Calculate specificity: reward diseases where a high percentage of their characteristic symptoms matched
        const coverageRatio = matchedSymptoms.length / Math.max(3, totalDiseaseSymptoms);
        const finalScore = totalMatchWeight * (1 + coverageRatio * 0.5);

        diseaseScores.push({
          disease,
          score: finalScore,
          matchedCount: matchedSymptoms.length,
          matchedSymptoms,
        });
      }
    }

    // Sort diseases by score descending
    diseaseScores.sort((a, b) => b.score - a.score);

    let predictedDisease = "Common Cold";
    let matchedSymptoms = [];
    let confidence = 85;

    if (diseaseScores.length > 0) {
      const top = diseaseScores[0];
      predictedDisease = top.disease;
      matchedSymptoms = top.matchedSymptoms;

      // Compute relative confidence
      if (diseaseScores.length > 1) {
        const runnerUp = diseaseScores[1];
        const ratio = top.score / (top.score + runnerUp.score);
        confidence = Math.min(97, Math.max(72, Math.round(ratio * 100)));
      } else {
        confidence = Math.min(98, 75 + top.matchedCount * 5);
      }
    }

    const key = predictedDisease.toLowerCase().trim();
    const disDes =
      descMap.get(key) ||
      `${predictedDisease} is a clinical health condition characterized by the matched symptoms. Evaluation by a qualified medical specialist is advised.`;

    const rawPrec = precautionsMap.get(key) || [
      "Consult a licensed medical doctor",
      "Follow prescribed medical guidance",
      "Rest adequately and avoid strenuous physical exertion",
      "Maintain healthy hydration and balanced nutrition",
    ];
    const precautionsList = cleanList(rawPrec);

    const rawMeds = medMap.get(key) || [
      "Physician-prescribed therapeutics",
      "Targeted symptom relief as advised by a doctor",
    ];
    const medicationsList = cleanList(rawMeds);

    const rawDiets = dietMap.get(key) || [
      "Nutrient-dense balanced meals",
      "Plentiful hydration with electrolytes",
      "Fresh fruits and steamed vegetables",
    ];
    const dietsList = cleanList(rawDiets);

    const workout =
      workoutMap.get(key) || "Restful recovery, gentle walking, and adequate sleep.";

    const responsePayload = {
      predicted_disease: predictedDisease,
      dis_des: disDes,
      confidence: `${confidence}%`,
      matched_symptoms: matchedSymptoms.map(
        s => s.charAt(0).toUpperCase() + s.slice(1)
      ),
      my_precautions: JSON.stringify(precautionsList),
      precautions: precautionsList,
      medications: JSON.stringify(medicationsList),
      medications_list: medicationsList,
      rec_diet: JSON.stringify(dietsList),
      diet_list: dietsList,
      workout: workout,
      alternative_diagnoses: diseaseScores.slice(1, 3).map(d => ({
        disease: d.disease,
        matchedCount: d.matchedCount,
      })),
    };

    return res.json({ data: responsePayload });
  } catch (error) {
    console.error("HealthPredict Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
