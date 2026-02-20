const SUPPORTED_DRUGS = [
  "CODEINE",
  "WARFARIN",
  "CLOPIDOGREL",
  "SIMVASTATIN",
  "AZATHIOPRINE",
  "FLUOROURACIL"
];

const DRUG_GENE_MAP = {
  CODEINE: "CYP2D6",
  WARFARIN: "CYP2C9",
  CLOPIDOGREL: "CYP2C19",
  SIMVASTATIN: "SLCO1B1",
  AZATHIOPRINE: "TPMT",
  FLUOROURACIL: "DPYD"
};

const GENE_DEFAULT_DIPLOTYPE = {
  CYP2D6: "*1/*1",
  CYP2C19: "*1/*1",
  CYP2C9: "*1/*1",
  SLCO1B1: "*1/*1",
  TPMT: "*1/*1",
  DPYD: "*1/*1"
};

const DIPLOTYPE_TO_PHENOTYPE = {
  CYP2D6: {
    "*1/*1": "NM",
    "*1/*2": "NM",
    "*1/*4": "IM",
    "*1/*5": "IM",
    "*2/*2": "NM",
    "*2/*4": "IM",
    "*4/*4": "PM",
    "*1/*10": "IM",
    "*1/*41": "IM",
    "*1/*1xN": "URM",
    "*2/*2xN": "URM"
  },
  CYP2C19: {
    "*1/*1": "NM",
    "*1/*2": "IM",
    "*1/*3": "IM",
    "*2/*2": "PM",
    "*2/*3": "PM",
    "*17/*17": "RM",
    "*1/*17": "RM",
    "*2/*17": "IM"
  },
  CYP2C9: {
    "*1/*1": "NM",
    "*1/*2": "IM",
    "*1/*3": "IM",
    "*2/*2": "IM",
    "*2/*3": "PM",
    "*3/*3": "PM"
  },
  SLCO1B1: {
    "*1/*1": "NM",
    "*1/*5": "IM",
    "*1/*15": "IM",
    "*5/*5": "PM",
    "*5/*15": "PM",
    "*15/*15": "PM"
  },
  TPMT: {
    "*1/*1": "NM",
    "*1/*3A": "IM",
    "*1/*3C": "IM",
    "*1/*2": "IM",
    "*3A/*3A": "PM",
    "*3C/*3C": "PM",
    "*2/*3A": "PM"
  },
  DPYD: {
    "*1/*1": "NM",
    "*1/*2A": "IM",
    "*1/*13": "IM",
    "*1/HapB3": "IM",
    "*2A/*2A": "PM",
    "*2A/*13": "PM",
    "*13/*13": "PM"
  }
};

const RSID_GENE_HINTS = {
  rs1065852: { gene: "CYP2D6", star: "*10" },
  rs3892097: { gene: "CYP2D6", star: "*4" },
  rs4244285: { gene: "CYP2C19", star: "*2" },
  rs12248560: { gene: "CYP2C19", star: "*17" },
  rs1057910: { gene: "CYP2C9", star: "*3" },
  rs1799853: { gene: "CYP2C9", star: "*2" },
  rs4149056: { gene: "SLCO1B1", star: "*5" },
  rs1142345: { gene: "TPMT", star: "*3C" },
  rs1800460: { gene: "TPMT", star: "*3A" },
  rs3918290: { gene: "DPYD", star: "*2A" }
};

module.exports = {
  SUPPORTED_DRUGS,
  DRUG_GENE_MAP,
  GENE_DEFAULT_DIPLOTYPE,
  DIPLOTYPE_TO_PHENOTYPE,
  RSID_GENE_HINTS
};
