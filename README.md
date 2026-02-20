# PharmaRakshak - Pharmacogenomic Risk Predictor

## Live Demo
- Live Web App URL: `https://pharmarakshak.onrender.com`
- LinkedIn Demo Video: `https://www.linkedin.com/posts/tamanna-m-meera-78311b315_rift2026-pharmaguard-pharmacogenomics-activity-7430445552137355264-CRMs?utm_source=share&utm_medium=member_android&rcm=ACoAAE_t-5MBE09fUTEkIcfnePh1ReW363iEOWA`

## Problem Statement
Adverse drug reactions cause major preventable morbidity and mortality. This project analyzes patient VCF genetic data and predicts drug-specific pharmacogenomic risks for six high-impact gene-drug pairs, then provides structured recommendations and explainability.

## Architecture Overview
- Frontend: Static web UI (`public/index.html`) for VCF upload, drug input, and result visualization.
- Backend API: Express server (`src/server.js`) for validation, parsing, interpretation, and JSON responses.
- VCF Parser: `src/vcfParser.js` parses VCF v4.2 lines and INFO annotations (`GENE`, `STAR`, `RS`).
- Pharmacogenomic Engine: `src/riskEngine.js` maps diplotype/phenotype to drug risk labels and CPIC-aligned recommendations.
- LLM Explainability Layer: `src/llmService.js` generates explanation JSON using OpenAI when configured, with a deterministic fallback.

## Tech Stack
- Node.js
- Express
- Multer
- OpenAI SDK (optional, with fallback)
- HTML/CSS/JavaScript

## Supported Drugs
- CODEINE
- WARFARIN
- CLOPIDOGREL
- SIMVASTATIN
- AZATHIOPRINE
- FLUOROURACIL

## Supported Genes
- CYP2D6
- CYP2C19
- CYP2C9
- SLCO1B1
- TPMT
- DPYD

## Output Schema
Each result item follows this structure:

```json
{
  "patient_id": "PATIENT_XXX",
  "drug": "DRUG_NAME",
  "timestamp": "ISO8601_timestamp",
  "risk_assessment": {
    "risk_label": "Safe|Adjust Dosage|Toxic|Ineffective|Unknown",
    "confidence_score": 0.0,
    "severity": "none|low|moderate|high|critical"
  },
  "pharmacogenomic_profile": {
    "primary_gene": "GENE_SYMBOL",
    "diplotype": "*X/*Y",
    "phenotype": "PM|IM|NM|RM|URM|Unknown",
    "detected_variants": []
  },
  "clinical_recommendation": {
    "action": "...",
    "dosing_recommendation": "...",
    "biological_mechanism": "...",
    "cpic_alignment": "...",
    "alternative_options": []
  },
  "llm_generated_explanation": {
    "summary": "...",
    "mechanism": "...",
    "variant_citations": "...",
    "rationale": "...",
    "disclaimer": "..."
  },
  "quality_metrics": {
    "vcf_parsing_success": true,
    "variants_parsed": 10,
    "gene_coverage_ratio": 0.67,
    "annotation_completeness": 0.90
  }
}
```

## Installation Instructions
1. Clone repository.
2. Install dependencies:

```bash
npm install
```

3. Configure environment:

```bash
cp .env.example .env
```

4. Optional: set `OPENAI_API_KEY` in `.env` for live LLM explanations.
5. Start server:

```bash
npm run start
```

6. Open `http://localhost:3000`.

## API Documentation
### `GET /api/health`
Returns service status.

### `POST /api/analyze`
Accepts multipart form data:
- `vcf`: `.vcf` file (max 5 MB)
- `drugs`: comma-separated drug names

Example curl:

```bash
curl -X POST http://localhost:3000/api/analyze \
  -F "vcf=@samples/sample_high_risk.vcf" \
  -F "drugs=CODEINE,CLOPIDOGREL"
```

## Usage Example
- Upload `samples/reallifevcf.vcf`
- Input: `CODEINE,CLOPIDOGREL,SIMVASTATIN`
- Review color-coded risks and downloadable JSON report

## Error Handling
- Invalid/missing VCF: clear 400 error message
- Wrong extension: `.vcf` required
- Oversize file: 5 MB limit enforced
- Missing drug list or unsupported drugs: explicit validation responses

## Deployment Instructions
### Vercel (Recommended)
1. Push repository to GitHub.
2. Import project in Vercel.
3. Set environment variables (`OPENAI_API_KEY`, `OPENAI_MODEL` optional).
4. Deploy.

### Render / Netlify / AWS / Azure / GCP
- Deploy as a Node.js web service using `npm install && npm start`.


## Team Members
- Tamanna Md Meera
- Saniya Kousar
-Sohana Parveen 
-Nazneen Pathan 

