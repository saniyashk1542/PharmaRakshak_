const {
  GENE_DEFAULT_DIPLOTYPE,
  DIPLOTYPE_TO_PHENOTYPE,
  RSID_GENE_HINTS
} = require("./constants");

function parseInfoField(infoRaw) {
  const info = {};
  if (!infoRaw || infoRaw === ".") return info;

  for (const entry of infoRaw.split(";")) {
    if (!entry) continue;
    const [key, value] = entry.split("=");
    info[key] = value ?? true;
  }
  return info;
}

function canonicalDiplotype(a, b) {
  const s1 = (a || "*1").trim();
  const s2 = (b || "*1").trim();
  return [s1, s2].sort((x, y) => x.localeCompare(y)).join("/");
}

function inferStarFromInfo(starInfo) {
  if (!starInfo) return [];
  const cleaned = String(starInfo).replace(/\s+/g, "");
  if (cleaned.includes("/")) {
    return cleaned.split("/").filter(Boolean);
  }
  if (cleaned.includes(",")) {
    return cleaned.split(",").filter(Boolean);
  }
  return [cleaned];
}

function parseVcfText(vcfText) {
  const lines = vcfText.split(/\r?\n/);
  const variants = [];
  let sampleId = "PATIENT_001";

  for (const line of lines) {
    if (!line || line.startsWith("##")) continue;

    if (line.startsWith("#CHROM")) {
      const headerCols = line.split("\t");
      if (headerCols.length >= 10 && headerCols[9]) {
        sampleId = headerCols[9].trim();
      }
      continue;
    }

    const cols = line.split("\t");
    if (cols.length < 8) continue;

    const [chrom, pos, id, ref, alt, qual, filter, infoRaw, formatRaw, sampleRaw] = cols;
    const info = parseInfoField(infoRaw);
    const rsid = info.RS || (id && id.startsWith("rs") ? id : null);
    const rsHint = rsid ? RSID_GENE_HINTS[rsid] : null;
    const gene = info.GENE || rsHint?.gene || null;

    const starsFromInfo = inferStarFromInfo(info.STAR);
    const starFallback = rsHint?.star ? [rsHint.star] : [];
    const stars = starsFromInfo.length ? starsFromInfo : starFallback;

    let genotype = null;
    if (formatRaw && sampleRaw) {
      const formatKeys = formatRaw.split(":");
      const sampleValues = sampleRaw.split(":");
      const fmt = Object.fromEntries(formatKeys.map((k, i) => [k, sampleValues[i]]));
      genotype = fmt.GT || sampleValues[0] || null;
    }

    variants.push({
      chrom,
      position: Number(pos),
      rsid,
      id,
      ref,
      alt,
      qual,
      filter,
      gene,
      star: stars,
      genotype,
      info
    });
  }

  return { sampleId, variants };
}

function deriveGeneProfiles(variants) {
  const genes = ["CYP2D6", "CYP2C19", "CYP2C9", "SLCO1B1", "TPMT", "DPYD"];
  const profiles = {};

  for (const gene of genes) {
    const geneVariants = variants.filter((v) => v.gene === gene);
    const starPool = geneVariants.flatMap((v) => v.star || []).filter(Boolean);

    let diplotype = GENE_DEFAULT_DIPLOTYPE[gene] || "*1/*1";
    if (starPool.length >= 2) {
      diplotype = canonicalDiplotype(starPool[0], starPool[1]);
    } else if (starPool.length === 1) {
      diplotype = canonicalDiplotype(starPool[0], "*1");
    }

    const phenotypeMap = DIPLOTYPE_TO_PHENOTYPE[gene] || {};
    const phenotype = phenotypeMap[diplotype] || "Unknown";

    profiles[gene] = {
      gene,
      diplotype,
      phenotype,
      variants: geneVariants.map((v) => ({
        rsid: v.rsid || "unknown",
        chrom: v.chrom,
        position: v.position,
        ref: v.ref,
        alt: v.alt,
        genotype: v.genotype,
        star_alleles: v.star
      }))
    };
  }

  return profiles;
}

module.exports = {
  parseVcfText,
  deriveGeneProfiles
};
