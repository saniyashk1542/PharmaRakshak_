const form = document.getElementById("analyze-form");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const copyBtn = document.getElementById("copy-json");
const downloadBtn = document.getElementById("download-json");
const submitBtn = document.getElementById("submit-btn");
const resetBtn = document.getElementById("reset-btn");
const fileInput = document.getElementById("vcf");
const drugsInput = document.getElementById("drugs");
const dropzone = document.getElementById("dropzone");
const fileNameEl = document.getElementById("file-name");
const vcfErrorEl = document.getElementById("vcf-error");

let lastJson = null;

function normalizeDrugList(value) {
  return value
    .split(",")
    .map((d) => d.trim().toUpperCase())
    .filter(Boolean);
}

function syncChipStateFromInput() {
  const selected = new Set(normalizeDrugList(drugsInput.value));
  document.querySelectorAll(".chip").forEach((chip) => {
    const active = selected.has(chip.dataset.drug);
    chip.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function updateFileVisual(file) {
  if (!file) {
    fileNameEl.textContent = "No file selected";
    dropzone.classList.remove("file-ready");
    return;
  }
  fileNameEl.textContent = `${file.name} (${Math.ceil(file.size / 1024)} KB)`;
  dropzone.classList.add("file-ready");
}

function badgeClass(risk) {
  if (risk === "Safe") return "safe";
  if (risk === "Adjust Dosage") return "adjust";
  if (risk === "Toxic") return "toxic";
  if (risk === "Ineffective") return "ineffective";
  return "unknown";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toVariantList(variants) {
  if (!Array.isArray(variants) || variants.length === 0) return "None detected in provided annotations";
  return variants
    .slice(0, 5)
    .map((v) => v.rsid || "unknown")
    .join(", ");
}

function renderResults(payload) {
  if (!payload.results || !payload.results.length) {
    resultsEl.innerHTML = '<p class="empty-state">No results returned.</p>';
    return;
  }

  const cards = payload.results
    .map((r) => {
      const risk = r.risk_assessment.risk_label;
      const explanation = r.llm_generated_explanation || {};
      return `
        <article class="result-card">
          <div class="result-head">
            <h3>${escapeHtml(r.drug)}</h3>
            <span class="badge ${badgeClass(risk)}">${escapeHtml(risk)}</span>
          </div>

          <table class="metrics">
            <tr><th>Severity</th><td>${escapeHtml(r.risk_assessment.severity)}</td></tr>
            <tr><th>Confidence</th><td>${escapeHtml(r.risk_assessment.confidence_score)}</td></tr>
            <tr><th>Primary Gene</th><td>${escapeHtml(r.pharmacogenomic_profile.primary_gene)}</td></tr>
            <tr><th>Diplotype</th><td>${escapeHtml(r.pharmacogenomic_profile.diplotype)}</td></tr>
            <tr><th>Phenotype</th><td>${escapeHtml(r.pharmacogenomic_profile.phenotype)}</td></tr>
            <tr><th>Variants</th><td>${escapeHtml(toVariantList(r.pharmacogenomic_profile.detected_variants))}</td></tr>
          </table>

          <details>
            <summary>Clinical Recommendation</summary>
            <p>${escapeHtml(r.clinical_recommendation.action || "")}</p>
            <p><strong>Mechanism:</strong> ${escapeHtml(r.clinical_recommendation.biological_mechanism || "")}</p>
            <p><strong>CPIC Alignment:</strong> ${escapeHtml(r.clinical_recommendation.cpic_alignment || "")}</p>
          </details>

          <details>
            <summary>AI Clinical Explanation</summary>
            <p><strong>Summary:</strong> ${escapeHtml(explanation.summary || "")}</p>
            <p><strong>Mechanism:</strong> ${escapeHtml(explanation.mechanism || "")}</p>
            <p><strong>Variant Citations:</strong> ${escapeHtml(explanation.variant_citations || "")}</p>
            <p><strong>Rationale:</strong> ${escapeHtml(explanation.rationale || "")}</p>
          </details>
        </article>
      `;
    })
    .join("");

  const raw = `<details><summary>Raw JSON Output</summary><pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre></details>`;
  resultsEl.innerHTML = cards + raw;
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitBtn.textContent = loading ? "Analyzing..." : "Run Pharmacogenomic Analysis";
}

function setStatus(message) {
  statusEl.textContent = message;
}

function validateFile(file) {
  if (!file) {
    vcfErrorEl.textContent = "Please upload a .vcf file.";
    fileInput.setAttribute("aria-invalid", "true");
    return false;
  }

  if (!file.name.toLowerCase().endsWith(".vcf")) {
    vcfErrorEl.textContent = "Unsupported file type. Please upload a .vcf file.";
    fileInput.setAttribute("aria-invalid", "true");
    return false;
  }

  if (file.size > 5 * 1024 * 1024) {
    vcfErrorEl.textContent = "File exceeds 5 MB limit. Please upload a smaller VCF.";
    fileInput.setAttribute("aria-invalid", "true");
    return false;
  }

  vcfErrorEl.textContent = "";
  fileInput.setAttribute("aria-invalid", "false");
  return true;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = fileInput.files[0];
  const drugs = drugsInput.value.trim();

  if (!validateFile(file)) {
    setStatus("Please fix file validation errors.");
    return;
  }

  if (!drugs) {
    setStatus("Please select at least one supported drug.");
    drugsInput.focus();
    return;
  }

  setLoading(true);
  setStatus("Analyzing genomic variants and generating recommendations...");
  resultsEl.innerHTML = "";

  const data = new FormData();
  data.append("vcf", file);
  data.append("drugs", drugs);

  try {
    const response = await fetch("/api/analyze", { method: "POST", body: data });
    const json = await response.json();

    if (!response.ok) {
      setStatus(json.error || "Analysis failed. Please verify your inputs.");
      setLoading(false);
      return;
    }

    lastJson = json;
    renderResults(json);
    setStatus("Analysis complete. Review risk-stratified recommendations below.");
  } catch (error) {
    setStatus(`Error: ${error.message}`);
  }

  setLoading(false);
});

copyBtn.addEventListener("click", async () => {
  if (!lastJson) {
    setStatus("No JSON to copy yet.");
    return;
  }

  await navigator.clipboard.writeText(JSON.stringify(lastJson, null, 2));
  setStatus("JSON copied to clipboard.");
});

downloadBtn.addEventListener("click", () => {
  if (!lastJson) {
    setStatus("No JSON to download yet.");
    return;
  }

  const blob = new Blob([JSON.stringify(lastJson, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pharmarakshak-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus("JSON downloaded.");
});

resetBtn.addEventListener("click", () => {
  form.reset();
  drugsInput.value = "CODEINE, WARFARIN, CLOPIDOGREL";
  syncChipStateFromInput();
  updateFileVisual(null);
  vcfErrorEl.textContent = "";
  setStatus("Inputs reset.");
  resultsEl.innerHTML = '<p class="empty-state">No results yet. Upload a VCF file and select at least one drug.</p>';
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0] || null;
  updateFileVisual(file);
  validateFile(file);
});

dropzone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    fileInput.click();
  }
});

dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("drag-active");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("drag-active");
});

dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("drag-active");
  const file = event.dataTransfer.files && event.dataTransfer.files[0];
  if (!file) return;

  const dt = new DataTransfer();
  dt.items.add(file);
  fileInput.files = dt.files;
  updateFileVisual(file);
  validateFile(file);
});

Array.from(document.querySelectorAll(".chip")).forEach((chip) => {
  chip.addEventListener("click", () => {
    const selected = new Set(normalizeDrugList(drugsInput.value));
    const drug = chip.dataset.drug;

    if (selected.has(drug)) {
      selected.delete(drug);
    } else {
      selected.add(drug);
    }

    drugsInput.value = Array.from(selected).join(", ");
    syncChipStateFromInput();
  });
});

drugsInput.addEventListener("input", syncChipStateFromInput);

syncChipStateFromInput();
updateFileVisual(fileInput.files[0] || null);
