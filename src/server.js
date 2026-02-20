require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const { parseVcfText, deriveGeneProfiles } = require("./vcfParser");
const { evaluateDrugRisk } = require("./riskEngine");
const { generateExplanation } = require("./llmService");
const { normalizeDrugInput, validateDrugs, buildQualityMetrics } = require("./utils");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

app.get("/api/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/analyze", upload.single("vcf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "VCF file is required." });
    }

    const ext = path.extname(req.file.originalname || "").toLowerCase();
    if (ext !== ".vcf") {
      return res.status(400).json({ error: "Invalid file format. Upload a .vcf file." });
    }

    const drugInput = req.body.drugs;
    const normalized = normalizeDrugInput(drugInput);
    if (!normalized.length) {
      return res.status(400).json({ error: "Provide at least one drug name." });
    }

    const { supported, unsupported } = validateDrugs(normalized);
    if (!supported.length) {
      return res.status(400).json({
        error: "No supported drugs provided.",
        supported_drugs: ["CODEINE", "WARFARIN", "CLOPIDOGREL", "SIMVASTATIN", "AZATHIOPRINE", "FLUOROURACIL"]
      });
    }

    const vcfText = req.file.buffer.toString("utf8");
    if (!vcfText.includes("#CHROM")) {
      return res.status(400).json({ error: "Malformed VCF: missing #CHROM header." });
    }

    const parsed = parseVcfText(vcfText);
    const profiles = deriveGeneProfiles(parsed.variants);
    const quality = buildQualityMetrics(parsed, profiles);

    const timestamp = new Date().toISOString();
    const results = [];

    for (const drug of supported) {
      const result = evaluateDrugRisk(drug, profiles);
      const llmExplanation = await generateExplanation(result);

      results.push({
        patient_id: parsed.sampleId,
        drug,
        timestamp,
        risk_assessment: result.risk_assessment,
        pharmacogenomic_profile: result.pharmacogenomic_profile,
        clinical_recommendation: result.clinical_recommendation,
        llm_generated_explanation: llmExplanation,
        quality_metrics: quality
      });
    }

    return res.json({
      patient_id: parsed.sampleId,
      timestamp,
      unsupported_drugs: unsupported,
      results
    });
  } catch (error) {
    const isSizeError = error && error.code === "LIMIT_FILE_SIZE";
    if (isSizeError) {
      return res.status(400).json({ error: "File exceeds 5 MB limit." });
    }

    return res.status(500).json({
      error: "Analysis failed. Please verify VCF formatting and annotations.",
      detail: error.message
    });
  }
});

app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`PharmaRakshak running at http://localhost:${port}`);
});

