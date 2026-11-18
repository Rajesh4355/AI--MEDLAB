import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router({ mergeParams: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../HealthPredict");

const parseCsvLine = (line) => {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
};

const readCsv = (fileName) => {
  const filePath = path.join(dataDir, fileName);
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseCsvLine);
  return { headers, rows };
};

const normalizeKey = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");

// Preload datasets once at startup
let symptomColumns = [];
const diseaseProfiles = new Map(); // disease -> array of Set(activeSymptomIndex)
const descriptionMap = new Map();
const precautionMap = new Map();
const medicationMap = new Map();
const dietMap = new Map();
const workoutMap = new Map();

const loadDatasets = () => {
  try {
    const training = readCsv("Training.csv");
    symptomColumns = training.headers.slice(0, -1).map((h) => h.trim());
    const seenSignatures = new Set();

    for (const row of training.rows) {
      if (row.length < symptomColumns.length + 1) continue;
      const prognosis = (row[symptomColumns.length] || "").trim();
      if (!prognosis) continue;
      const activeIndices = [];
      for (let i = 0; i < symptomColumns.length; i++) {
        if (row[i] === "1") activeIndices.push(i);
      }
      const sig = `${prognosis}:${activeIndices.join(",")}`;
      if (seenSignatures.has(sig)) continue;
      seenSignatures.add(sig);

      if (!diseaseProfiles.has(prognosis)) {
        diseaseProfiles.set(prognosis, []);
      }
      diseaseProfiles.get(prognosis).push(new Set(activeIndices));
    }

    const descCsv = readCsv("description.csv");
    for (const row of descCsv.rows) {
      if (row[0]) descriptionMap.set(normalizeKey(row[0]), row[1] || "");
    }

    const precCsv = readCsv("precautions_df.csv");
    for (const row of precCsv.rows) {
      if (row[1]) {
        const precs = row.slice(2, 6).filter((p) => p && p.length > 0);
        precautionMap.set(normalizeKey(row[1]), precs);
      }
    }

    const medCsv = readCsv("medications.csv");
    for (const row of medCsv.rows) {
      if (row[0]) medicationMap.set(normalizeKey(row[0]), row[1] || "");
    }

    const dietCsv = readCsv("diets.csv");
    for (const row of dietCsv.rows) {
      if (row[0]) dietMap.set(normalizeKey(row[0]), row[1] || "");
    }

    const workCsv = readCsv("workout_df.csv");
    for (const row of workCsv.rows) {
      const dis = normalizeKey(row[2]);
      const wk = row[3];
      if (dis && wk) {
        if (!workoutMap.has(dis)) workoutMap.set(dis, []);
        workoutMap.get(dis).push(wk);
      }
    }
  } catch (err) {
    console.error("Failed to load HealthPredict CSV datasets:", err.message);
  }
};

loadDatasets();

const lookupMap = (map, disease) => {
  const key = normalizeKey(disease);
  if (map.has(key)) return map.get(key);
  // Handle minor dataset spelling variations like "peptic ulcer diseae" vs "peptic ulcer disease"
  for (const [k, v] of map.entries()) {
    if (k.startsWith(key.slice(0, 8)) || key.startsWith(k.slice(0, 8))) {
      return v;
    }
  }
  return null;
};

const matchSymptoms = (rawInput) => {
  const text = Array.isArray(rawInput)
    ? rawInput.join(",")
    : String(rawInput || "");
  const normalizedText = text.toLowerCase().replace(/_/g, " ");
  const tokens = text
    .split(/[,;\n]+/)
    .map((t) => t.trim().toLowerCase().replace(/\s+/g, "_"))
    .filter(Boolean);

  const matchedIndices = new Set();

  symptomColumns.forEach((col, idx) => {
    const colNorm = col.trim().toLowerCase();
    const colSpaced = colNorm.replace(/_/g, " ");
    if (
      tokens.includes(colNorm) ||
      normalizedText.includes(colSpaced) ||
      tokens.some((t) => t.length > 3 && (colNorm.includes(t) || t.includes(colNorm)))
    ) {
      matchedIndices.add(idx);
    }
  });

  return matchedIndices;
};

const predictDiseaseFromSymptoms = (matchedIndices) => {
  if (matchedIndices.size === 0 || diseaseProfiles.size === 0) {
    return "Common Cold";
  }

  let bestDisease = "Common Cold";
  let bestScore = -1;

  for (const [disease, profiles] of diseaseProfiles.entries()) {
    for (const profile of profiles) {
      let intersection = 0;
      for (const idx of matchedIndices) {
        if (profile.has(idx)) intersection++;
      }
      if (intersection === 0) continue;
      const union = profile.size + matchedIndices.size - intersection;
      const jaccard = intersection / (union || 1);
      const score = intersection * 2 + jaccard;
      if (score > bestScore) {
        bestScore = score;
        bestDisease = disease;
      }
    }
  }

  return bestDisease;
};

router.post("/symptoms", (req, res) => {
  try {
    const rawData = req.body.data;
    const matchedIndices = matchSymptoms(rawData);
    const predictedDisease = predictDiseaseFromSymptoms(matchedIndices);

    const disDes =
      lookupMap(descriptionMap, predictedDisease) ||
      `${predictedDisease} requires clinical evaluation by a qualified physician.`;
    const precautions = lookupMap(precautionMap, predictedDisease) || [
      "Consult a doctor",
      "Stay hydrated",
      "Get adequate rest",
    ];
    const medications =
      lookupMap(medicationMap, predictedDisease) ||
      "Consult your physician for targeted medication.";
    const diets =
      lookupMap(dietMap, predictedDisease) ||
      "Balanced nutritious diet with plenty of fluids.";
    const workouts = lookupMap(workoutMap, predictedDisease) || [
      "Light walking",
      "Adequate rest",
    ];

    res.json({
      data: {
        predicted_disease: String(predictedDisease),
        dis_des: String(disDes),
        my_precautions: precautions.join(", "),
        medications: String(medications),
        rec_diet: String(diets),
        workout: Array.isArray(workouts) ? workouts.join(", ") : String(workouts),
      },
    });
  } catch (error) {
    console.error("Symptom prediction error:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
