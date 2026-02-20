const { DRUG_GENE_MAP } = require("./constants");

function evaluateDrugRisk(drug, profiles) {
  const upperDrug = String(drug || "").trim().toUpperCase();
  const primaryGene = DRUG_GENE_MAP[upperDrug] || "Unknown";
  const profile = profiles[primaryGene] || {
    gene: primaryGene,
    diplotype: "*1/*1",
    phenotype: "Unknown",
    variants: []
  };

  let riskLabel = "Unknown";
  let severity = "low";
  let confidence = 0.45;
  let action = "Insufficient pharmacogenomic evidence from uploaded file. Consider confirmatory testing.";
  let mechanism = "No gene-drug-specific mechanism could be resolved from detected variants.";
  let cpic = "No direct CPIC rule could be applied with current genotype confidence.";
  let alternatives = [];

  const p = profile.phenotype;

  if (upperDrug === "CODEINE") {
    if (p === "PM" || p === "IM") {
      riskLabel = "Ineffective";
      severity = "high";
      confidence = 0.9;
      action = "Avoid codeine due to reduced conversion to morphine. Use a non-CYP2D6-dependent analgesic.";
      mechanism = "Reduced CYP2D6 activity decreases bioactivation of codeine to morphine, lowering analgesic response.";
      cpic = "CPIC opioid guidance supports alternative analgesics in CYP2D6 poor/intermediate metabolizers.";
      alternatives = ["morphine", "hydromorphone", "non-opioid options"]; }
    else if (p === "URM") {
      riskLabel = "Toxic";
      severity = "critical";
      confidence = 0.93;
      action = "Avoid codeine due to toxicity risk from rapid morphine formation.";
      mechanism = "Increased CYP2D6 activity elevates morphine exposure, raising risk of respiratory depression.";
      cpic = "CPIC opioid guidance recommends avoiding codeine in ultrarapid metabolizers.";
      alternatives = ["morphine", "non-CYP2D6 opioids"]; }
    else if (p === "NM" || p === "RM") {
      riskLabel = "Safe";
      severity = "none";
      confidence = 0.83;
      action = "Use standard codeine dosing with routine clinical monitoring.";
      mechanism = "Predicted CYP2D6 activity supports expected codeine-to-morphine conversion.";
      cpic = "CPIC opioid guidance allows standard dosing for normal metabolizers.";
    }
  }

  if (upperDrug === "CLOPIDOGREL") {
    if (p === "PM") {
      riskLabel = "Ineffective";
      severity = "critical";
      confidence = 0.94;
      action = "Avoid clopidogrel; use an alternative antiplatelet agent not dependent on CYP2C19 activation.";
      mechanism = "Loss-of-function CYP2C19 alleles reduce active metabolite formation and antiplatelet effect.";
      cpic = "CPIC antiplatelet guidance recommends alternatives for CYP2C19 poor metabolizers.";
      alternatives = ["prasugrel", "ticagrelor"]; }
    else if (p === "IM") {
      riskLabel = "Adjust Dosage";
      severity = "high";
      confidence = 0.9;
      action = "Prefer alternative antiplatelet therapy due to reduced clopidogrel response.";
      mechanism = "Partial CYP2C19 deficiency can reduce clopidogrel activation.";
      cpic = "CPIC guidance favors alternative therapy in intermediate metabolizers for high-risk indications.";
      alternatives = ["prasugrel", "ticagrelor"]; }
    else if (p === "NM" || p === "RM") {
      riskLabel = "Safe";
      severity = "none";
      confidence = 0.84;
      action = "Standard clopidogrel dosing is reasonable with routine monitoring.";
      mechanism = "CYP2C19 activity is likely adequate for clopidogrel activation.";
      cpic = "CPIC allows standard strategy for normal/rapid metabolizers.";
    }
  }

  if (upperDrug === "WARFARIN") {
    if (p === "PM") {
      riskLabel = "Toxic";
      severity = "high";
      confidence = 0.9;
      action = "Use reduced initial warfarin dose and intensive INR monitoring.";
      mechanism = "Reduced CYP2C9 clearance increases warfarin exposure and bleeding risk.";
      cpic = "CPIC warfarin guidance recommends genotype-informed dose reduction for reduced CYP2C9 function.";
    } else if (p === "IM") {
      riskLabel = "Adjust Dosage";
      severity = "moderate";
      confidence = 0.85;
      action = "Consider lower starting dose with closer INR monitoring during titration.";
      mechanism = "Partially reduced CYP2C9 activity may slow S-warfarin clearance.";
      cpic = "CPIC recommends incorporating CYP2C9 genotype in initial dosing.";
    } else if (p === "NM") {
      riskLabel = "Safe";
      severity = "low";
      confidence = 0.78;
      action = "Use standard dosing protocol with INR-guided adjustments.";
      mechanism = "CYP2C9 function appears within expected range for usual clearance.";
      cpic = "CPIC supports standard initiation when no major reduced-function variants are present.";
    }
  }

  if (upperDrug === "SIMVASTATIN") {
    if (p === "PM") {
      riskLabel = "Toxic";
      severity = "high";
      confidence = 0.91;
      action = "Avoid high-dose simvastatin; consider alternative statin or reduced dose.";
      mechanism = "Decreased SLCO1B1 transport increases systemic simvastatin exposure and myopathy risk.";
      cpic = "CPIC statin guidance recommends lower dose or alternative statin for low function phenotypes.";
      alternatives = ["pravastatin", "rosuvastatin"]; }
    else if (p === "IM") {
      riskLabel = "Adjust Dosage";
      severity = "moderate";
      confidence = 0.84;
      action = "Use lower simvastatin dose or alternate statin with reduced myopathy risk.";
      mechanism = "Intermediate SLCO1B1 function can increase simvastatin concentrations.";
      cpic = "CPIC suggests dose reduction or alternative statin for decreased function genotypes.";
      alternatives = ["pravastatin", "rosuvastatin"]; }
    else if (p === "NM") {
      riskLabel = "Safe";
      severity = "none";
      confidence = 0.8;
      action = "Standard simvastatin dosing is acceptable with routine symptom surveillance.";
      mechanism = "Normal SLCO1B1 transport predicts typical statin disposition.";
      cpic = "CPIC supports conventional dosing for normal transporter function.";
    }
  }

  if (upperDrug === "AZATHIOPRINE") {
    if (p === "PM") {
      riskLabel = "Toxic";
      severity = "critical";
      confidence = 0.95;
      action = "Substantially reduce starting dose or choose non-thiopurine therapy; intensive CBC monitoring required.";
      mechanism = "Low TPMT activity increases active thioguanine nucleotide accumulation and myelosuppression risk.";
      cpic = "CPIC thiopurine guidance recommends major dose reduction or alternatives in poor metabolizers.";
      alternatives = ["non-thiopurine immunosuppressant"]; }
    else if (p === "IM") {
      riskLabel = "Adjust Dosage";
      severity = "high";
      confidence = 0.9;
      action = "Reduce starting dose and increase interval with close hematologic monitoring.";
      mechanism = "Intermediate TPMT activity reduces thiopurine inactivation.";
      cpic = "CPIC recommends lower initial doses in intermediate metabolizers.";
    } else if (p === "NM") {
      riskLabel = "Safe";
      severity = "low";
      confidence = 0.82;
      action = "Standard starting dose is generally acceptable with routine CBC monitoring.";
      mechanism = "Normal TPMT activity supports expected thiopurine metabolism.";
      cpic = "CPIC allows standard starting strategy in normal metabolizers.";
    }
  }

  if (upperDrug === "FLUOROURACIL") {
    if (p === "PM") {
      riskLabel = "Toxic";
      severity = "critical";
      confidence = 0.96;
      action = "Avoid standard fluorouracil dosing. Consider major dose reduction or alternative therapy.";
      mechanism = "Marked DPYD deficiency causes reduced 5-FU catabolism and severe toxicity risk.";
      cpic = "CPIC/DPWG-informed guidance supports substantial reduction or alternative regimen in poor metabolizers.";
    } else if (p === "IM") {
      riskLabel = "Adjust Dosage";
      severity = "high";
      confidence = 0.91;
      action = "Start with reduced fluorouracil dose and titrate cautiously with close toxicity monitoring.";
      mechanism = "Partial DPYD deficiency decreases fluoropyrimidine clearance.";
      cpic = "Guidelines recommend reduced initial dose for intermediate metabolizers.";
    } else if (p === "NM") {
      riskLabel = "Safe";
      severity = "low";
      confidence = 0.81;
      action = "Standard dosing can be considered with routine oncology toxicity monitoring.";
      mechanism = "Normal DPYD activity predicts expected fluoropyrimidine metabolism.";
      cpic = "Standard approach is generally acceptable for normal metabolizers.";
    }
  }

  return {
    drug: upperDrug,
    risk_assessment: {
      risk_label: riskLabel,
      confidence_score: Number(confidence.toFixed(2)),
      severity
    },
    pharmacogenomic_profile: {
      primary_gene: primaryGene,
      diplotype: profile.diplotype,
      phenotype: profile.phenotype,
      detected_variants: profile.variants
    },
    clinical_recommendation: {
      action,
      dosing_recommendation: action,
      biological_mechanism: mechanism,
      cpic_alignment: cpic,
      alternative_options: alternatives
    }
  };
}

module.exports = { evaluateDrugRisk };
