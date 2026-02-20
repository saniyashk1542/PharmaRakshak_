const { OpenAI } = require("openai");

function localExplanation(result) {
  const variantList = result.pharmacogenomic_profile.detected_variants
    .slice(0, 5)
    .map((v) => v.rsid)
    .join(", ");

  return {
    summary: `${result.drug}: ${result.risk_assessment.risk_label} (${result.risk_assessment.severity} severity).`,
    mechanism: result.clinical_recommendation.biological_mechanism,
    variant_citations: variantList || "No high-confidence rsID provided in uploaded VCF annotations.",
    rationale: result.clinical_recommendation.cpic_alignment,
    disclaimer: "Educational decision support only. Final treatment decisions require clinician judgment and guideline verification."
  };
}

async function generateExplanation(result) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return localExplanation(result);

  try {
    const client = new OpenAI({ apiKey: key });
    const prompt = `You are a pharmacogenomics clinical assistant. Return strict JSON with keys summary, mechanism, variant_citations, rationale, disclaimer.\nDrug: ${result.drug}\nRisk: ${result.risk_assessment.risk_label}\nPrimary gene: ${result.pharmacogenomic_profile.primary_gene}\nDiplotype: ${result.pharmacogenomic_profile.diplotype}\nPhenotype: ${result.pharmacogenomic_profile.phenotype}\nVariants: ${JSON.stringify(result.pharmacogenomic_profile.detected_variants)}\nRecommendation: ${JSON.stringify(result.clinical_recommendation)}`;

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Provide concise, clinically neutral explanation text with no fabricated citations." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) return localExplanation(result);
    return JSON.parse(content);
  } catch (_) {
    return localExplanation(result);
  }
}

module.exports = {
  generateExplanation
};
