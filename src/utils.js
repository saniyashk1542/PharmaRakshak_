const { SUPPORTED_DRUGS } = require("./constants");

function normalizeDrugInput(raw) {
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((d) => d.trim().toUpperCase())
    .filter(Boolean);
}

function validateDrugs(drugs) {
  const unsupported = drugs.filter((d) => !SUPPORTED_DRUGS.includes(d));
  return {
    supported: drugs.filter((d) => SUPPORTED_DRUGS.includes(d)),
    unsupported
  };
}

function buildQualityMetrics(parsed, profiles) {
  const genes = Object.keys(profiles);
  const coveredGenes = genes.filter((g) => profiles[g].variants.length > 0).length;

  return {
    vcf_parsing_success: true,
    variants_parsed: parsed.variants.length,
    gene_coverage_ratio: Number((coveredGenes / genes.length).toFixed(2)),
    annotation_completeness: Number(
      (
        parsed.variants.filter((v) => v.gene && (v.rsid || v.id)).length /
        Math.max(parsed.variants.length, 1)
      ).toFixed(2)
    )
  };
}

module.exports = {
  normalizeDrugInput,
  validateDrugs,
  buildQualityMetrics
};
