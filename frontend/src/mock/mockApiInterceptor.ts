import allCharacteristicsData from "./all_characteristics.json";

// Customer Master list (from production database)
const INITIAL_CUSTOMERS: any[] = [
  { id: 1, name: "Navneet Youva", country: "India" },
  { id: 2, name: "ITC Classmate", country: "India" },
  { id: 3, name: "Staples,The Office Superstore, LLC", country: "USA" },
  { id: 4, name: "Camlin Kokuyo", country: "India" },
  { id: 5, name: "Navneet HQ", country: "India" },
  { id: 6, name: "Asda Stores Ltd", country: "United Kingdom" },
  { id: 7, name: "Target Global Sourcing Limited", country: "Hong Kong" },
  { id: 8, name: "Sundaram Multi-pap", country: "India" },
  { id: 9, name: "Walmart, Inc", country: "USA" },
  { id: 10, name: "Dollar General Corporation", country: "USA" },
  { id: 11, name: "Family Dollar Services, LLC.", country: "USA" },
  { id: 12, name: "Tedi GmbH & Co. KG", country: "Germany" },
  { id: 13, name: "Woolworth Gmbh", country: "Germany" },
];

const INITIAL_PLANTS: any[] = [
  { id: 1, code: "1503- Silvasa", name: "1503- Silvasa", location: "Dadra & Nagar Haveli", is_active: true },
  { id: 2, code: "1505- Khaniwade", name: "1505- Khaniwade", location: "Maharashtra", is_active: true },
  { id: 3, code: "1003- Pariya", name: "1003- Pariya", location: "Gujarat", is_active: true },
  { id: 4, code: "Daman Facility", name: "Daman Facility", location: "Daman", is_active: true },
];

const INITIAL_SAMPLE_REQUESTS: any[] = [
  {
    id: 101,
    sr_number: "SR-26-00101",
    material_code: "NB-CB-A5-0801",
    barcode: "8901234567801",
    source_sample_code: "PREV-2025-412",
    product_description: "Youva Neon Geometry Hardbound Notebook 192P Dot Grid",
    product_type: "Case Bound Journal",
    customer: "Navneet Youva",
    target_plant: "1505- Khaniwade",
    year: "2026-2027",
    program_year: "BTS 2026-2027",
    program_name: "Youva Neon Geometry Series BTS",
    date_request_created: "2026-09-15",
    sample_required_date: "2026-10-15",
    created_by: "Balachander (Admin)",
    brand_name: "Youva",
    customer_product_code: "YOU-NB-7821",
    unit_pc_pack: "Single Book Shrink",
    qty_for_sampling: "6",
    qty_design_costing: "50000",
    mockup_required: "Yes",
    designs_customer_creative: "4 Design Variants",
    creation_mode: "material_code",
    request_types: ["design", "mockup", "sample", "costing"],
    status: "Draft (Pre-SMT)",
    created_at: "2026-09-15T10:00:00Z",
    updated_at: "2026-09-15T10:00:00Z",
  },
  {
    id: 102,
    sr_number: "SR-26-00102",
    material_code: "BX-RG-L1-0422",
    barcode: "8901234567822",
    source_sample_code: "SAMP-2025-883",
    product_description: "Classmate Pulse Luxury Rigid Gift Box w/ Magnet",
    product_type: "Rigid Box",
    customer: "ITC Classmate",
    target_plant: "1505- Khaniwade",
    year: "2026-2027",
    program_year: "Festive 2026",
    program_name: "Classmate Pulse Luxury Gifting",
    date_request_created: "2026-09-16",
    sample_required_date: "2026-10-12",
    created_by: "Sarah Jenkins",
    brand_name: "Classmate Pulse",
    customer_product_code: "ITC-PLS-1104",
    unit_pc_pack: "Individual Box Packaging",
    qty_for_sampling: "12",
    qty_design_costing: "25000",
    mockup_required: "Yes",
    creation_mode: "binding",
    request_types: ["design", "mockup", "sample", "costing"],
    status: "In Plant Work",
    created_at: "2026-09-16T11:20:00Z",
    updated_at: "2026-09-16T11:20:00Z",
  },
  {
    id: 103,
    sr_number: "SR-26-00103",
    material_code: "NB-PB-A4-0994",
    barcode: "8901234567894",
    source_sample_code: null,
    product_description: "A4 Perfect Bound Project Planner 160P Perforated with Elastic",
    product_type: "Perfect Bound Pad",
    customer: "Staples,The Office Superstore, LLC",
    target_plant: "1505- Khaniwade",
    year: "2026-2027",
    program_year: "Annual 2026",
    program_name: "Staples Pro Business Catalog",
    date_request_created: "2026-09-17",
    sample_required_date: "2026-10-18",
    created_by: "Balachander (Admin)",
    brand_name: "TRU RED",
    customer_product_code: "STP-TR-992",
    unit_pc_pack: "Single Book Polyolefin",
    qty_for_sampling: "4",
    qty_design_costing: "80000",
    mockup_required: "Yes",
    creation_mode: "material_code",
    request_types: ["design", "mockup", "sample", "costing"],
    status: "Studio",
    created_at: "2026-09-17T09:45:00Z",
    updated_at: "2026-09-17T09:45:00Z",
  },
  {
    id: 104,
    sr_number: "SR-26-00104",
    material_code: "TN-SL-L1-0311",
    barcode: "8901234567311",
    source_sample_code: null,
    product_description: "Kokuyo Camlin Artist Brush Tin Lid Metal Container & Sleeve",
    product_type: "Tin Container / Sleeve",
    customer: "Camlin Kokuyo",
    target_plant: "1503- Silvasa",
    year: "2026-2027",
    program_year: "BTS 2026-2027",
    program_name: "Camel Artist Professional Series",
    date_request_created: "2026-09-18",
    sample_required_date: "2026-10-22",
    created_by: "Sarah Jenkins",
    brand_name: "Camel Artist",
    customer_product_code: "KOK-ART-501",
    unit_pc_pack: "Metal Outer with Paper Sleeve",
    qty_for_sampling: "6",
    qty_design_costing: "100000",
    mockup_required: "Yes",
    creation_mode: "binding",
    request_types: ["design", "mockup", "sample", "costing"],
    status: "Draft (Pre-SMT)",
    created_at: "2026-09-18T14:10:00Z",
    updated_at: "2026-09-18T14:10:00Z",
  },
  {
    id: 105,
    sr_number: "SR-26-00105",
    material_code: "BX-TL-A5-1200",
    barcode: "8901234567200",
    source_sample_code: null,
    product_description: "HQ Royal Flora Hardbound Journal with Two-Piece Telescopic Box",
    product_type: "Rigid Box & Notebook",
    customer: "Navneet HQ",
    target_plant: "1503- Silvasa",
    year: "2026-2027",
    program_year: "Prestige 2026-2027",
    program_name: "HQ Royal Flora Luxury Line",
    date_request_created: "2026-09-12",
    sample_required_date: "2026-10-09",
    created_by: "Balachander (Admin)",
    brand_name: "HQ Royal",
    customer_product_code: "NAV-HQ-091",
    unit_pc_pack: "Two-Piece Gift Box",
    qty_for_sampling: "8",
    qty_design_costing: "35000",
    mockup_required: "Yes",
    creation_mode: "material_code",
    request_types: ["design", "mockup", "sample", "costing"],
    status: "In Plant Work",
    created_at: "2026-09-12T08:30:00Z",
    updated_at: "2026-09-12T08:30:00Z",
  },
  {
    id: 106,
    sr_number: "SR-26-00106",
    material_code: "NB-DC-A6-7782",
    barcode: "8901234567782",
    source_sample_code: null,
    product_description: "A6 Pocket Double Pasted Edge Painted Notebook 120P Blank",
    product_type: "Pocket Notebook",
    customer: "Asda Stores Ltd",
    target_plant: "1003- Pariya",
    year: "2026-2027",
    program_year: "Spring 2027",
    program_name: "High Street Prestige",
    date_request_created: "2026-09-10",
    sample_required_date: "2026-09-28",
    created_by: "Sarah Jenkins",
    brand_name: "George Home",
    customer_product_code: "WHS-LUX-442",
    unit_pc_pack: "Belly Band Sleeve",
    qty_for_sampling: "5",
    qty_design_costing: "45000",
    mockup_required: "Yes",
    creation_mode: "material_code",
    request_types: ["design", "mockup", "sample"],
    status: "Dispatched / Closed",
    created_at: "2026-09-10T15:00:00Z",
    updated_at: "2026-09-10T15:00:00Z",
  },
  {
    id: 107,
    sr_number: "SR-26-00107",
    material_code: "FC-CK-9104",
    barcode: "8901234567910",
    source_sample_code: null,
    product_description: "[New Finish] Custom 3D Embossed Thermal PU Leatherette Journal with Magnetic Closure\n\nTechnical Notes:\nCover wrapping with 1.2mm thermal PU leatherette, heat debossing on front & spine with gold foil underlay. Hidden neodymium magnet closure.\n\nMarketing Remarks:\nSample required for preview in Autumn European line presentation.",
    product_type: "Custom Prototype",
    customer: "Target Global Sourcing Limited",
    target_plant: "1505- Khaniwade",
    year: "2026-2027",
    program_year: "BTS 2026-2027",
    program_name: "Target Global Sourcing Limited · Feasibility Check",
    date_request_created: "2026-09-19",
    sample_required_date: "2026-10-10",
    created_by: "Rohit Verma (Marketing Lead)",
    brand_name: "Room Essentials",
    customer_product_code: "TGT-FS-910",
    unit_pc_pack: "Individual Box",
    qty_for_sampling: "1",
    qty_design_costing: "0",
    mockup_required: "Yes",
    creation_mode: "feasibility_check",
    request_types: ["sample", "mockup"],
    status: "Completed",
    plant_feasibility_response: "Yes",
    plant_feasibility_remark: "Tooling and magnetic closure validated on Line 3.",
    sampling_feasibility_response: "Yes",
    sampling_feasibility_remark: "Sample prototype ready and verified on Kolbus wrapper.",
    feasibility_closed_by: "sampling",
    feasibility_closed_at: "20 Sep 2026, 03:30 PM IST",
    created_at: "2026-09-19T10:00:00Z",
    updated_at: "2026-09-19T10:00:00Z",
  },
  {
    id: 108,
    sr_number: "SR-26-00108",
    material_code: "FC-SC-75-0081",
    barcode: "8901234567440",
    source_sample_code: null,
    product_description: "Sundaram Scholar Geometry Box Reverse Tuck Carton",
    product_type: "Folding Carton",
    customer: "Sundaram Multi-pap",
    target_plant: "1503- Silvasa",
    year: "2026-2027",
    program_year: "BTS 2026-2027",
    program_name: "Sundaram Scholar Stationery",
    date_request_created: "2026-09-20",
    sample_required_date: "2026-10-18",
    created_by: "Balachander (Admin)",
    brand_name: "Scholar",
    customer_product_code: "SUN-SCH-081",
    unit_pc_pack: "Shrink of 10 Cartons",
    qty_for_sampling: "25",
    qty_design_costing: "150000",
    mockup_required: "Yes",
    creation_mode: "material_code",
    request_types: ["design", "mockup", "sample", "costing"],
    status: "Draft (Pre-SMT)",
    created_at: "2026-09-20T14:30:00Z",
    updated_at: "2026-09-20T14:30:00Z",
  },
  {
    id: 109,
    sr_number: "SR-26-00109",
    material_code: "FC-CK-5088",
    barcode: "8901234567919",
    source_sample_code: null,
    product_description: "[New Format] Target Global Study Kit 3-Ply E-Flute Shipper Box w/ High-Density Foam\n\nTechnical Notes:\nCustom 3-ply E-flute corrugated shipper with laser cut high-density EVA foam insert for luxury stationery set. Die-cutting with tight tolerance ±0.5mm.\n\nMarketing Remarks:\nTarget requires 2 finished physical mockups for client buyer review before season sign-off.",
    product_type: "Flute Corrugated Shipper",
    customer: "Target Global Sourcing Limited",
    target_plant: "1505- Khaniwade",
    year: "2026-2027",
    program_year: "BTS 2026-2027",
    program_name: "Target Global Sourcing Limited · Feasibility Check",
    date_request_created: "2026-09-26",
    sample_required_date: "2026-10-18",
    created_by: "Priya Sharma (Corporate Marketing)",
    brand_name: "Target Global",
    customer_product_code: "TGT-FS-5348",
    unit_pc_pack: "Master Shipper",
    qty_for_sampling: "2",
    qty_design_costing: "75000",
    mockup_required: "Yes",
    creation_mode: "feasibility_check",
    request_types: ["sample", "mockup", "costing"],
    status: "Pending Feasibility",
    plant_feasibility_response: null,
    plant_feasibility_remark: null,
    sampling_feasibility_response: null,
    sampling_feasibility_remark: null,
    feasibility_closed_by: null,
    feasibility_closed_at: null,
    created_at: "2026-09-26T15:00:00Z",
    updated_at: "2026-09-26T15:00:00Z",
  },
];

// Downstream Studio CAD Dielines - directly tied to Sample Requests
const INITIAL_STUDIO_DIELINES: any[] = [
  {
    id: "dl-101",
    dielineCode: "DL-26-041",
    srNumber: "SR-26-00101",
    boxFormat: "Rigid Box",
    title: "Youva Neon Flare Hardbound Cover & Slipcase",
    client: "Navneet Youva",
    dimensions: "185 × 245 × 22 mm",
    substrate: "1200 GSM Kappa Board + 150 GSM Art Wrap",
    caliperMicrons: 1850,
    machineCompatibility: "Kolbus Casemaker & Rigid Wrapper",
    status: "3D Simulation",
    dueDate: "2026-10-15",
    targetPlant: "1505- Khaniwade",
    grainDirection: "Parallel to Spine",
    fileFormats: [".DXF", ".ARD", ".PDF"],
  },
  {
    id: "dl-102",
    dielineCode: "DL-26-042",
    srNumber: "SR-26-00102",
    boxFormat: "Rigid Box",
    title: "Classmate Pulse Luxury Hinged Box w/ Magnet",
    client: "ITC Classmate",
    dimensions: "260 × 190 × 45 mm",
    substrate: "1200 GSM Grey Board + 150 GSM Art Wrap",
    caliperMicrons: 1850,
    machineCompatibility: "Emmeci Automatic Rigid Box Line",
    status: "Laser Die Cleared",
    dueDate: "2026-10-12",
    targetPlant: "1505- Khaniwade",
    grainDirection: "Parallel to Spine",
    fileFormats: [".DXF", ".ARD", ".PDF"],
  },
  {
    id: "dl-103",
    dielineCode: "DL-26-053",
    srNumber: "SR-26-00103",
    boxFormat: "Folding Carton",
    title: "TRU RED A4 Planner Belly Band & Fold-Over Flap",
    client: "Staples,The Office Superstore, LLC",
    dimensions: "215 × 302 × 18 mm",
    substrate: "350 GSM Cyber Xpack FBB",
    caliperMicrons: 480,
    machineCompatibility: "Bobst Novacut 106 & Media 68 Gluer",
    status: "Dieline Construction",
    dueDate: "2026-10-18",
    targetPlant: "1505- Khaniwade",
    grainDirection: "Perpendicular to Crease",
    fileFormats: [".DXF", ".CF2", ".PDF"],
  },
  {
    id: "dl-104",
    dielineCode: "DL-26-092",
    srNumber: "SR-26-00104",
    boxFormat: "Blister / Sleeve",
    title: "Kokuyo Camlin Metal Tin Slide Sleeve",
    client: "Camlin Kokuyo",
    dimensions: "315 × 125 × 25 mm",
    substrate: "300 GSM SBS Board",
    caliperMicrons: 400,
    machineCompatibility: "Bobst SP 102 Die-Cutter",
    status: "Dieline Construction",
    dueDate: "2026-10-22",
    targetPlant: "1503- Silvasa",
    grainDirection: "Perpendicular to Crease",
    fileFormats: [".DXF", ".PDF"],
  },
  {
    id: "dl-105",
    dielineCode: "DL-26-095",
    srNumber: "SR-26-00105",
    boxFormat: "Rigid Box",
    title: "Navneet HQ Journal Two-Piece Telescopic Box",
    client: "Navneet HQ",
    dimensions: "220 × 160 × 35 mm",
    substrate: "1000 GSM Kappa Board + Wibalin Wrap",
    caliperMicrons: 1500,
    machineCompatibility: "Kolbus Casemaker & Rigid Wrapper",
    status: "Laser Die Cleared",
    dueDate: "2026-10-09",
    targetPlant: "1503- Silvasa",
    grainDirection: "Parallel to Spine",
    fileFormats: [".DXF", ".ARD", ".CF2"],
  },
  {
    id: "dl-106",
    dielineCode: "DL-26-096",
    srNumber: "SR-26-00106",
    boxFormat: "Blister / Sleeve",
    title: "George Home A6 Pocket Journal Belly Band Sleeve",
    client: "Asda Stores Ltd",
    dimensions: "105 × 150 × 14 mm",
    substrate: "250 GSM Kraft Uncoated",
    caliperMicrons: 320,
    machineCompatibility: "Heidelberg Cylinder Die Cutter",
    status: "Plotter Sample Tested",
    dueDate: "2026-09-28",
    targetPlant: "1003- Pariya",
    grainDirection: "Parallel to Spine",
    fileFormats: [".DXF", ".PDF"],
  },
  {
    id: "dl-107",
    dielineCode: "DL-26-097",
    srNumber: "SR-26-00107",
    boxFormat: "Rigid Box",
    title: "Room Essentials Thermal PU Debossed Dieline",
    client: "Target Global Sourcing Limited",
    dimensions: "215 × 150 × 24 mm",
    substrate: "Thermal PU Leatherette + 2mm Board",
    caliperMicrons: 2200,
    machineCompatibility: "Emmeci Rigid Box Line",
    status: "Laser Die Cleared",
    dueDate: "2026-10-10",
    targetPlant: "1505- Khaniwade",
    grainDirection: "Parallel to Spine",
    fileFormats: [".DXF", ".ARD"],
  },
  {
    id: "dl-108",
    dielineCode: "DL-26-081",
    srNumber: "SR-26-00108",
    boxFormat: "Folding Carton",
    title: "Sundaram Scholar Geometry Reverse Tuck Carton",
    client: "Sundaram Multi-pap",
    dimensions: "165 × 75 × 25 mm",
    substrate: "350 GSM Cyber Xpack FBB",
    caliperMicrons: 480,
    machineCompatibility: "Bobst Novacut 106 & Media 68 Gluer",
    status: "Laser Die Cleared",
    dueDate: "2026-10-18",
    targetPlant: "1503- Silvasa",
    grainDirection: "Perpendicular to Crease",
    fileFormats: [".DXF", ".CF2", ".PDF"],
  },
  {
    id: "dl-109",
    dielineCode: "DL-26-088",
    srNumber: "SR-26-00109",
    boxFormat: "Flute Corrugated",
    title: "Target Global Study Kit 3-Ply E-Flute Shipper",
    client: "Target Global Sourcing Limited",
    dimensions: "320 × 240 × 85 mm",
    substrate: "Kraft 250 GSM / E-Flute / 200 GSM Liner",
    caliperMicrons: 1600,
    machineCompatibility: "Heidelberg Dymatrix 106 Pro",
    status: "Plotter Sample Tested",
    dueDate: "2026-10-18",
    targetPlant: "1505- Khaniwade",
    fluteGrade: "E-Flute (1.5mm)",
    grainDirection: "Parallel to Spine",
    fileFormats: [".ARD", ".DXF"],
  },
];

// Downstream Creative Graphics Briefs - directly tied to Sample Requests
const INITIAL_CREATIVE_BRIEFS: any[] = [
  {
    id: "cr-101",
    artCode: "ART-26-001",
    srNumber: "SR-26-00101",
    title: "Youva Neon Flare Geometry Series",
    brand: "Navneet Youva",
    category: "Notebook Covers",
    variantsCount: 4,
    designer: "Ananya Sharma",
    colorSpecs: "CMYK + Spot Pantone 805C Neon Red",
    proofVersion: "v2 (Rev 1)",
    proofStatus: "Client Review",
    dueDate: "2026-10-15",
    dimensions: "180 × 240 mm",
    finishingNotes: "Matte Lamination + Spot UV on Geometric Poly-mesh",
    cmykCheckPassed: true,
    resolutionDpi: 450,
    bleedMm: 3,
    clientFeedback: "Increase contrast on author tagline; front foil title is sharp.",
    accentColor: "#f43f5e",
  },
  {
    id: "cr-102",
    artCode: "ART-26-002",
    srNumber: "SR-26-00102",
    title: "Classmate Pulse Luxury Gift Carton",
    brand: "ITC Classmate",
    category: "Rigid Packaging",
    variantsCount: 2,
    designer: "Rohan Patel",
    colorSpecs: "CMYK + Spot Pantone 871C Metallic Gold",
    proofVersion: "v3 (Final)",
    proofStatus: "Prepress Approved",
    dueDate: "2026-10-12",
    dimensions: "260 × 190 × 45 mm",
    finishingNotes: "Hot Stamping Foil + Soft-Touch Velvet Lam",
    cmykCheckPassed: true,
    resolutionDpi: 600,
    bleedMm: 4,
    clientFeedback: "Color proofs signed off by brand director on 26-Sep.",
    accentColor: "#eab308",
  },
  {
    id: "cr-103",
    artCode: "ART-26-003",
    srNumber: "SR-26-00103",
    title: "TRU RED Executive Project Planner Cover",
    brand: "Staples TRU RED",
    category: "Notebook Covers",
    variantsCount: 2,
    designer: "Ananya Sharma",
    colorSpecs: "2C Spot Black + Foil Accent",
    proofVersion: "v1 (Draft)",
    proofStatus: "In Concept",
    dueDate: "2026-10-18",
    dimensions: "210 × 297 mm (A4)",
    finishingNotes: "Soft Touch Matte + Blind Deboss Logo",
    cmykCheckPassed: true,
    resolutionDpi: 300,
    bleedMm: 3,
    clientFeedback: "Draft concept under brand art review.",
    accentColor: "#3b82f6",
  },
  {
    id: "cr-104",
    artCode: "ART-26-004",
    srNumber: "SR-26-00104",
    title: "Kokuyo Camlin Artist Brush Tin Lid",
    brand: "Camlin Kokuyo",
    category: "Tin / Metal Containers",
    variantsCount: 3,
    designer: "Vikram Mehta",
    colorSpecs: "4C White Baseplate + Tin Metal Tint",
    proofVersion: "v1 (Draft)",
    proofStatus: "In Concept",
    dueDate: "2026-10-22",
    dimensions: "310 × 120 × 22 mm",
    finishingNotes: "Embossed Brand Crest + High-Gloss Overvarnish",
    cmykCheckPassed: true,
    resolutionDpi: 300,
    bleedMm: 2.5,
    clientFeedback: "Awaiting primary brand guideline vector assets.",
    accentColor: "#06b6d4",
  },
  {
    id: "cr-105",
    artCode: "ART-26-005",
    srNumber: "SR-26-00105",
    title: "HQ Royal Flora Hardbound Journal",
    brand: "Navneet HQ",
    category: "Notebook Covers",
    variantsCount: 5,
    designer: "Pooja Deshmukh",
    colorSpecs: "CMYK + Pantone 876C Copper Foil",
    proofVersion: "v2 (Rev 2)",
    proofStatus: "Revisions Requested",
    dueDate: "2026-10-09",
    dimensions: "148 × 210 mm (A5)",
    finishingNotes: "Debossed Leatherette with Micro-grain Register",
    cmykCheckPassed: false,
    resolutionDpi: 300,
    bleedMm: 3,
    clientFeedback: "Spine text shifted 1.5mm left; please recenter spine title.",
    accentColor: "#d97706",
  },
  {
    id: "cr-106",
    artCode: "ART-26-006",
    srNumber: "SR-26-00106",
    title: "George Home Pocket Journal Edge Print",
    brand: "George Home",
    category: "Stationery Packs",
    variantsCount: 3,
    designer: "Vikram Mehta",
    colorSpecs: "CMYK Full Process + Gold Edge Gilding",
    proofVersion: "v3 (Final)",
    proofStatus: "Prepress Approved",
    dueDate: "2026-09-28",
    dimensions: "105 × 148 mm",
    finishingNotes: "Edge gilding register validated",
    cmykCheckPassed: true,
    resolutionDpi: 400,
    bleedMm: 3,
    clientFeedback: "Dispatched to print production.",
    accentColor: "#10b981",
  },
  {
    id: "cr-108",
    artCode: "ART-26-008",
    srNumber: "SR-26-00108",
    title: "Sundaram Scholar Geometry Box Carton",
    brand: "Sundaram Multi-pap",
    category: "Stationery Packs",
    variantsCount: 2,
    designer: "Rohan Patel",
    colorSpecs: "CMYK Full Process",
    proofVersion: "v1 (Intake)",
    proofStatus: "Brief Intake",
    dueDate: "2026-10-18",
    dimensions: "165 × 75 × 25 mm",
    finishingNotes: "Aqueous Gloss Coated 350 GSM FBB",
    cmykCheckPassed: true,
    resolutionDpi: 350,
    bleedMm: 3,
    clientFeedback: "Brand assets ingested from sales intake form.",
    accentColor: "#8b5cf6",
  },
];

// Downstream Costing & Margin Estimations - directly tied to Sample Requests
const INITIAL_COSTING_ESTIMATIONS: any[] = [
  {
    id: "cst-401",
    costingCode: "CST-26-401",
    srNumber: "SR-26-00101",
    customer: "Navneet Youva",
    productTitle: "Youva Neon Geometry Hardbound Notebook",
    targetVolume: 50000,
    substrateUnitCost: 16.4,
    conversionUnitCost: 7.2,
    netUnitCost: 23.6,
    marginPct: 22.0,
    quotedUnitPrice: 30.25,
    totalProjectValue: 1512500,
    status: "Quote Released",
    dueDate: "2026-10-15",
    targetPlant: "1505- Khaniwade",
    substrateSpec: "70 GSM Maplitho Inside + 300 GSM Cyber Xpack Cover",
  },
  {
    id: "cst-402",
    costingCode: "CST-26-402",
    srNumber: "SR-26-00102",
    customer: "ITC Classmate",
    productTitle: "Classmate Pulse Rigid Gift Box Edition",
    targetVolume: 25000,
    substrateUnitCost: 38.5,
    conversionUnitCost: 19.8,
    netUnitCost: 58.3,
    marginPct: 26.5,
    quotedUnitPrice: 79.32,
    totalProjectValue: 1983000,
    status: "Margin Review",
    dueDate: "2026-10-12",
    targetPlant: "1505- Khaniwade",
    substrateSpec: "1200 GSM Kappa Board + 150 GSM Metallic Art Wrap",
  },
  {
    id: "cst-403",
    costingCode: "CST-26-403",
    srNumber: "SR-26-00103",
    customer: "Staples,The Office Superstore, LLC",
    productTitle: "TRU RED A4 Executive Project Planner",
    targetVolume: 80000,
    substrateUnitCost: 21.0,
    conversionUnitCost: 13.5,
    netUnitCost: 34.5,
    marginPct: 23.0,
    quotedUnitPrice: 44.8,
    totalProjectValue: 3584000,
    status: "Spec Review",
    dueDate: "2026-10-18",
    targetPlant: "1505- Khaniwade",
    substrateSpec: "80 GSM Maplitho + Elastic Cord + 350 GSM FBB",
  },
  {
    id: "cst-404",
    costingCode: "CST-26-404",
    srNumber: "SR-26-00104",
    customer: "Camlin Kokuyo",
    productTitle: "Kokuyo Camlin Artist Brush Tin Lid Outer",
    targetVolume: 100000,
    substrateUnitCost: 8.8,
    conversionUnitCost: 4.1,
    netUnitCost: 12.9,
    marginPct: 18.5,
    quotedUnitPrice: 15.83,
    totalProjectValue: 1583000,
    status: "Substrate Pricing",
    dueDate: "2026-10-22",
    targetPlant: "1503- Silvasa",
    substrateSpec: "0.24mm Electrolytic Tinplate with Food-Grade Baseplate",
  },
  {
    id: "cst-405",
    costingCode: "CST-26-405",
    srNumber: "SR-26-00105",
    customer: "Navneet HQ",
    productTitle: "HQ Royal Flora Journal w/ Copper Stamping",
    targetVolume: 35000,
    substrateUnitCost: 22.0,
    conversionUnitCost: 11.5,
    netUnitCost: 33.5,
    marginPct: 28.0,
    quotedUnitPrice: 46.53,
    totalProjectValue: 1628550,
    status: "Won Deal",
    dueDate: "2026-10-09",
    targetPlant: "1503- Silvasa",
    substrateSpec: "80 GSM Woodfree Cream + Imported PU Leatherette",
  },
  {
    id: "cst-408",
    costingCode: "CST-26-408",
    srNumber: "SR-26-00108",
    customer: "Sundaram Multi-pap",
    productTitle: "Sundaram Scholar Geometry Carton",
    targetVolume: 150000,
    substrateUnitCost: 4.6,
    conversionUnitCost: 2.1,
    netUnitCost: 6.7,
    marginPct: 21.0,
    quotedUnitPrice: 8.48,
    totalProjectValue: 1272000,
    status: "Quote Released",
    dueDate: "2026-10-18",
    targetPlant: "1503- Silvasa",
    substrateSpec: "300 GSM ITC Safire Board (Aqueous Coated)",
  },
  {
    id: "cst-409",
    costingCode: "CST-26-409",
    srNumber: "SR-26-00109",
    customer: "Target Global Sourcing Limited",
    productTitle: "Target Global Pastel Math Kit E-Flute Shipper",
    targetVolume: 75000,
    substrateUnitCost: 14.2,
    conversionUnitCost: 5.6,
    netUnitCost: 19.8,
    marginPct: 24.0,
    quotedUnitPrice: 26.05,
    totalProjectValue: 1953750,
    status: "Margin Review",
    dueDate: "2026-10-18",
    targetPlant: "1505- Khaniwade",
    substrateSpec: "3-Ply E-Flute Virgin Kraft with Micro-Corrugation",
  },
];


const INITIAL_DESIGN_REQUESTS: any[] = [
  {
    id: 1,
    customer_name: "Target Global Sourcing Limited",
    program_name: "Sunset Pastel BTS 2026",
    program_year: "BTS 2026-2027",
    number_of_designs: 6,
    trend: "Warm Sunset Gradients, Minimalist Botanical Line Art, Holographic Edge Foil",
    target_audience: "Gen Z High School & College Students, Trend-focused Shoppers",
    reference_image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80",
    product_description: "Full Cover Graphic Artwork for A5 Casebound 192P Journals with matching satin bookmark ribbon",
    design_required_date: "2026-10-02",
    status: "Creative",
    created_by: "Sarah Jenkins",
    updated_by: "Sarah Jenkins",
    created_at: "2026-09-14T09:30:00Z",
    updated_at: "2026-09-14T09:30:00Z",
  },
  {
    id: 2,
    customer_name: "Walmart, Inc",
    program_name: "Geometric Pop Subject Notebooks",
    program_year: "BTS 2026-2027",
    number_of_designs: 4,
    trend: "Bold Color Blocking, Neon Accents, Retro 90s Memphis Style",
    target_audience: "Elementary & Middle School Value Segment",
    reference_image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500&auto=format&fit=crop&q=80",
    product_description: "3-Subject Notebook Front Covers with high-impact gloss lamination and front name label plate",
    design_required_date: "2026-10-08",
    status: "Draft (Pre-SMT)",
    created_by: "Sarah Jenkins",
    updated_by: "Sarah Jenkins",
    created_at: "2026-09-16T11:15:00Z",
    updated_at: "2026-09-16T11:15:00Z",
  },
];

const INITIAL_USERS: any[] = [
  {
    id: 1,
    name: "Balachander",
    userid: "admin",
    email: "admin@navneet.com",
    role: "admin",
    sub_role: "Global Admin",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Sarah Jenkins",
    userid: "sjenkins",
    email: "sarah.j@navneet.com",
    role: "marketing_executive",
    sub_role: "Key Account Director (US Retail)",
    is_active: true,
    created_at: "2026-02-15T00:00:00Z",
  },
  {
    id: 3,
    name: "Alex Rivera",
    userid: "arivera",
    email: "alex.r@navneet.com",
    role: "user",
    sub_role: "Creative Studio Lead",
    is_active: true,
    created_at: "2026-03-01T00:00:00Z",
  },
];

function getStorage<T>(key: string, defaultVal: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore
  }
}

const BINDING_HIERARCHY: Record<string, string[]> = {
  "Case Bound": [
    "Case with Round Spine",
    "Square Spine Hardcover",
    "Flexi Case Soft Cover",
    "Hidden Spiral Wire Bound",
    "French Bound Luxury",
    "Flat Back Standard",
  ],
  "Soft Cover": [
    "Saddle Stitching (2 Wire)",
    "Sewn Soft Cover Drawn-on",
    "Wire-O Exposed Spine",
    "Glued Square Spine Notch",
    "Singer Sewn Thread Bound",
  ],
  "Perfect Bound": [
    "PUR Heavy Duty Adhesive",
    "Standard EVA Notch Perfect",
    "Burst Bound Layflat",
    "Milled Notch Bound",
  ],
  "Split Case": [
    "Two-Piece Linen Split Case",
    "Quarter Bound Bookcloth",
    "Split Spine with Exposed Ribbon",
  ],
  "Full Bound Stiff Cover": [
    "Turned-in Edge Rigid Board",
    "Metal Corner Guarded Stiff",
    "Padded Foam Full Bound",
  ],
  "Double Pasted (3 Layers)": [
    "Tri-Layer Duplex Core",
    "Color Edge Painted Sandwich",
    "Contrast Core Hardcover",
  ],
  "Portfolio": [
    "Magnetic Flap Envelope Style",
    "Ribbon Tie Gusseted Folio",
    "Elastic Band Portfolio",
  ],
  "File Folder": [
    "2-Ring Presentation Binder",
    "Lever Arch Heavy Mechanism",
    "Expanding Pocket Accordion",
  ],
  "Envelope": [
    "Peel & Seal Self-Adhesive",
    "String & Button Vintage Tie",
    "Booklet Flap Document Wallet",
  ],
  "Flapover": [
    "Wrap-around Elastic Band",
    "Hidden Magnet Snap Flap",
    "Velcro Strip Closure",
  ],
  "Unbound": [
    "Loose Leaf Shrink Wrapped",
    "Three-Hole Drilled Pad",
    "Corner Stapled Pack",
  ],
  "Refer To Special Binding": [
    "Exposed Coptic Swiss Stitch",
    "Custom Die-cut Stepped Edge",
    "Japanese Four-Hole Stitch",
  ],
};

function syncDownstreamTasksForSampleRequest(row: any) {
  const reqTypes: string[] = row.request_types || ["sample", "costing"];

  // 1. Studio Prepress / CAD Dieline Task
  if (reqTypes.includes("mockup")) {
    let dielines = getStorage("mock_studio_dielines", INITIAL_STUDIO_DIELINES);
    const existing = dielines.find((d: any) => d.srNumber === row.sr_number);
    if (!existing) {
      dielines.unshift({
        id: `dl-${row.id}`,
        dielineCode: `DL-26-${String(row.id).padStart(3, "0")}`,
        srNumber: row.sr_number,
        boxFormat: (row.product_type?.toLowerCase().includes("rigid")
          ? "Rigid Box"
          : row.product_type?.toLowerCase().includes("flute") || row.product_type?.toLowerCase().includes("shipper")
          ? "Flute Corrugated"
          : row.product_type?.toLowerCase().includes("sleeve")
          ? "Blister / Sleeve"
          : "Folding Carton") as any,
        title: row.product_description,
        client: row.customer,
        dimensions: "210 × 148 × 25 mm",
        substrate: "350 GSM Cyber Xpack FBB",
        caliperMicrons: 450,
        machineCompatibility: "Bobst Novacut 106 & Media 68 Gluer",
        status: "CAD Intake",
        dueDate: row.sample_required_date || "2026-11-01",
        targetPlant: row.target_plant || "1505- Khaniwade",
        grainDirection: "Parallel to Spine",
        fileFormats: [".DXF", ".PDF"],
      });
      setStorage("mock_studio_dielines", dielines);
    }
  }

  // 2. Creative Graphic / Artwork Brief Task
  if (reqTypes.includes("design")) {
    let briefs = getStorage("mock_creative_briefs", INITIAL_CREATIVE_BRIEFS);
    const existing = briefs.find((b: any) => b.srNumber === row.sr_number);
    if (!existing) {
      briefs.unshift({
        id: `cr-${row.id}`,
        artCode: `ART-26-${String(row.id).padStart(3, "0")}`,
        srNumber: row.sr_number,
        title: row.product_description,
        brand: row.brand_name || row.customer,
        category: (row.product_type?.toLowerCase().includes("tin")
          ? "Tin / Metal Containers"
          : row.product_type?.toLowerCase().includes("rigid")
          ? "Rigid Packaging"
          : row.product_type?.toLowerCase().includes("box") || row.product_type?.toLowerCase().includes("carton")
          ? "Stationery Packs"
          : "Notebook Covers") as any,
        variantsCount: 2,
        designer: "Unassigned",
        colorSpecs: "CMYK Full Process",
        proofVersion: "v1 (Draft)",
        proofStatus: "Brief Intake",
        dueDate: row.sample_required_date || "2026-11-01",
        dimensions: "180 × 240 mm",
        finishingNotes: "Standard Matte Lamination",
        cmykCheckPassed: true,
        resolutionDpi: 300,
        bleedMm: 3,
        clientFeedback: "Initial brief intake from Marketing request.",
        accentColor: "#3b82f6",
      });
      setStorage("mock_creative_briefs", briefs);
    }
  }

  // 3. Costing & Estimation Task
  if (reqTypes.includes("costing")) {
    let costings = getStorage("mock_costing_estimations", INITIAL_COSTING_ESTIMATIONS);
    const existing = costings.find((c: any) => c.srNumber === row.sr_number);
    if (!existing) {
      const vol = Number(row.qty_design_costing) || 50000;
      const subCost = 15.0;
      const convCost = 6.5;
      const net = subCost + convCost;
      const margin = 22.0;
      const quoted = Number((net / (1 - margin / 100)).toFixed(2));
      costings.unshift({
        id: `cst-${row.id}`,
        costingCode: `CST-26-${row.id}`,
        srNumber: row.sr_number,
        customer: row.customer,
        productTitle: row.product_description,
        targetVolume: vol,
        substrateUnitCost: subCost,
        conversionUnitCost: convCost,
        netUnitCost: net,
        marginPct: margin,
        quotedUnitPrice: quoted,
        totalProjectValue: vol * quoted,
        status: "Spec Review",
        dueDate: row.sample_required_date || "2026-11-01",
        targetPlant: row.target_plant || "1505- Khaniwade",
        substrateSpec: "300 GSM Folding Box Board + 70 GSM Inside Pages",
      });
      setStorage("mock_costing_estimations", costings);
    }
  }
}

export function setupMockApiInterceptor() {
  // If VITE_USE_MOCK is explicitly "false", disable mock interceptor and let fetch hit the real backend directly
  if (import.meta.env.VITE_USE_MOCK === "false") {
    console.info("[API] Real backend connection mode active. Mock interceptor disabled.");
    return;
  }

  const MOCK_DATA_VERSION = "v3.2_unified_cross_desk";
  if (typeof window !== "undefined") {
    const activeVersion = localStorage.getItem("mock_data_version");
    if (activeVersion !== MOCK_DATA_VERSION) {
      localStorage.setItem("mock_data_version", MOCK_DATA_VERSION);
      localStorage.setItem("mock_sample_requests", JSON.stringify(INITIAL_SAMPLE_REQUESTS));
      localStorage.setItem("mock_studio_dielines", JSON.stringify(INITIAL_STUDIO_DIELINES));
      localStorage.setItem("mock_creative_briefs", JSON.stringify(INITIAL_CREATIVE_BRIEFS));
      localStorage.setItem("mock_costing_estimations", JSON.stringify(INITIAL_COSTING_ESTIMATIONS));
    }
  }

  const originalFetch = window.fetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlStr = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = (init?.method || "GET").toUpperCase();

    if (urlStr.includes("/api/")) {
      const url = new URL(urlStr, window.location.origin);
      const pathname = url.pathname;

      // 1. Auth Login
      if (pathname.endsWith("/api/auth/login") && method === "POST") {
        let body: any = {};
        if (init?.body) {
          try {
            body = JSON.parse(init.body as string);
          } catch {
            // ignore
          }
        }
        const userid = body.userid || body.username || "admin";
        const users = getStorage("mock_users", INITIAL_USERS);
        const matched = users.find((u: any) => u.userid.toLowerCase() === userid.toLowerCase()) || users[0];

        const token =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsIm5hbWUiOiJCYWxhY2hhbmRlciIsInJvbGUiOiJhZG1pbiJ9.mock_signature_part";
        const responseData = {
          access_token: token,
          token_type: "bearer",
          user: {
            id: matched.id,
            name: matched.name,
            userid: matched.userid,
            email: matched.email,
            role: matched.role,
            sub_role: matched.sub_role,
            is_active: matched.is_active,
          },
        };

        return new Response(JSON.stringify(responseData), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 2. Auth Current User (/api/auth/me)
      if (pathname.endsWith("/api/auth/me")) {
        const users = getStorage("mock_users", INITIAL_USERS);
        const currentUser = users[0];
        return new Response(
          JSON.stringify({
            id: currentUser.id,
            name: currentUser.name,
            userid: currentUser.userid,
            email: currentUser.email,
            role: currentUser.role,
            sub_role: currentUser.sub_role,
            is_active: currentUser.is_active,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // 3. Sample Requests List & Search
      if (pathname === "/api/v1/sample-requests" && method === "GET") {
        let requests = getStorage("mock_sample_requests", INITIAL_SAMPLE_REQUESTS);
        const existingIds = new Set(requests.map((r: any) => String(r.id)));
        let updated = false;
        for (const initialItem of INITIAL_SAMPLE_REQUESTS) {
          if (!existingIds.has(String(initialItem.id))) {
            requests.push(initialItem);
            updated = true;
          }
        }
        if (updated) {
          setStorage("mock_sample_requests", requests);
        }
        const statusFilter = url.searchParams.get("status_filter");
        const customerFilter = url.searchParams.get("customer_filter");

        let filtered = [...requests];
        if (statusFilter && statusFilter.toLowerCase() !== "all") {
          filtered = filtered.filter((r: any) =>
            r.status.toLowerCase().includes(statusFilter.toLowerCase())
          );
        }
        if (customerFilter) {
          filtered = filtered.filter((r: any) =>
            r.customer.toLowerCase().includes(customerFilter.toLowerCase())
          );
        }

        return new Response(JSON.stringify(filtered), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 4. Sample Requests Material Search
      if (pathname === "/api/v1/sample-requests/search-material" && method === "GET") {
        const code = url.searchParams.get("code") || "";
        const requests = getStorage("mock_sample_requests", INITIAL_SAMPLE_REQUESTS);
        const q = code.toLowerCase().trim();

        const matches = requests
          .filter(
            (r: any) =>
              r.material_code.toLowerCase().includes(q) ||
              (r.barcode && r.barcode.includes(q)) ||
              r.product_description.toLowerCase().includes(q)
          )
          .map((r: any) => ({
            id: r.id,
            material_code: r.material_code,
            barcode: r.barcode,
            product_description: r.product_description,
            customer: r.customer,
            target_plant: r.target_plant,
            specs: {
              binding_type_1: "Case Bound",
              binding_type_2: "Square Spine Hardcover",
              size_length: "21.0",
              size_width: "14.8",
              fsc: "FSC Mix Credit",
            },
          }));

        return new Response(JSON.stringify(matches), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 5. Filter by binding
      if (pathname === "/api/v1/product-characteristics/filter-by-binding" && method === "GET") {
        const requests = getStorage("mock_sample_requests", INITIAL_SAMPLE_REQUESTS);
        const matches = requests.map((r: any) => ({
          id: r.id,
          material_code: r.material_code,
          barcode: r.barcode,
          product_description: r.product_description,
          customer: r.customer,
          target_plant: r.target_plant,
          specs: {
            binding_type_1: "Case Bound",
            binding_type_2: "Square Spine Hardcover",
            size_length: "21.0",
            size_width: "14.8",
            fsc: "FSC Mix Credit",
          },
        }));

        return new Response(JSON.stringify(matches), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 6. Batch Create Sample Requests
      if (pathname === "/api/v1/sample-requests/batch" && method === "POST") {
        const payload = init?.body ? JSON.parse(init.body as string) : { requests: [] };
        const requests = getStorage("mock_sample_requests", INITIAL_SAMPLE_REQUESTS);
        const items = payload.requests || [];

        const createdRows: any[] = [];
        const srNumbers: string[] = [];

        items.forEach((item: any, idx: number) => {
          const nextId = requests.length ? Math.max(...requests.map((r: any) => r.id)) + 1 + idx : 101 + idx;
          const padded = String(nextId).padStart(5, "0");
          const sr_number = `SR-26-${padded}`;
          const today = new Date().toISOString().split("T")[0];

          const newRow = {
            id: nextId,
            sr_number,
            material_code: item.material_code || `NB-NEW-${nextId}`,
            barcode: item.barcode || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            source_sample_code: item.source_sample_code || null,
            product_description: item.product_description || "Custom Notebook Sample",
            product_type: item.product_type || "Stationery Sample",
            customer: item.customer || "General Retail",
            target_plant: item.target_plant || "1505- Khaniwade",
            year: item.year || "2026-2027",
            program_year: item.program_year || "BTS 2026-2027",
            program_name: item.program_name || "Commercial Program",
            date_request_created: today,
            sample_required_date: item.sample_required_date || null,
            created_by: item.created_by || "Balachander (Admin)",
            brand_name: item.brand_name || "",
            unit_pc_pack: item.unit_pc_pack || "1",
            qty_for_sampling: item.qty_for_sampling || "6",
            qty_design_costing: item.qty_design_costing || "50000",
            mockup_required: item.mockup_required || "Yes",
            designs_customer_creative: item.designs_customer_creative || "",
            creation_mode: item.creation_mode || "material_code",
            request_types: item.request_types || item.requestTypes || ["sample", "costing"],
            status: item.status || "Draft (Pre-SMT)",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          createdRows.push(newRow);
          srNumbers.push(sr_number);
          requests.unshift(newRow);
          syncDownstreamTasksForSampleRequest(newRow);
        });

        setStorage("mock_sample_requests", requests);

        return new Response(
          JSON.stringify({
            created_count: createdRows.length,
            created_ids: createdRows.map((r) => r.id),
            sr_numbers: srNumbers,
            requests: createdRows,
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }

      // 7. Single Sample Request Creation
      if (pathname === "/api/v1/sample-requests" && method === "POST") {
        const item = init?.body ? JSON.parse(init.body as string) : {};
        const requests = getStorage("mock_sample_requests", INITIAL_SAMPLE_REQUESTS);
        const nextId = requests.length ? Math.max(...requests.map((r: any) => r.id)) + 1 : 101;
        const padded = String(nextId).padStart(5, "0");
        const sr_number = `SR-26-${padded}`;
        const today = new Date().toISOString().split("T")[0];

        const newRow = {
          id: nextId,
          sr_number,
          material_code: item.material_code || `NB-NEW-${nextId}`,
          barcode: item.barcode || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          source_sample_code: item.source_sample_code || null,
          product_description: item.product_description || "Custom Notebook Sample",
          product_type: item.product_type || "Stationery Sample",
          customer: item.customer || "General Retail",
          target_plant: item.target_plant || "1505- Khaniwade",
          year: item.year || "2026-2027",
          program_year: item.program_year || "BTS 2026-2027",
          program_name: item.program_name || "Commercial Program",
          date_request_created: today,
          sample_required_date: item.sample_required_date || null,
          created_by: item.created_by || "Balachander (Admin)",
          brand_name: item.brand_name || "",
          unit_pc_pack: item.unit_pc_pack || "1",
          qty_for_sampling: item.qty_for_sampling || "6",
          qty_design_costing: item.qty_design_costing || "50000",
          mockup_required: item.mockup_required || "Yes",
          designs_customer_creative: item.designs_customer_creative || "",
          creation_mode: item.creation_mode || "material_code",
          request_types: item.request_types || item.requestTypes || ["sample", "costing"],
          status: item.status || "Draft (Pre-SMT)",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        requests.unshift(newRow);
        syncDownstreamTasksForSampleRequest(newRow);
        setStorage("mock_sample_requests", requests);

        return new Response(JSON.stringify(newRow), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 8. Batch Status Update (accepts both POST and PATCH)
      if (pathname === "/api/v1/sample-requests/batch-status" && (method === "PATCH" || method === "POST")) {
        const payload = init?.body ? JSON.parse(init.body as string) : { sample_request_ids: [], status: "" };
        const requests = getStorage("mock_sample_requests", INITIAL_SAMPLE_REQUESTS);
        // Support both field names for compatibility
        const targetIds: (number | string)[] = payload.sample_request_ids || payload.ids || [];
        const newStatus = payload.status || "Draft (Pre-SMT)";

        const updated = requests.map((r: any) =>
          targetIds.includes(r.id) || targetIds.map(Number).includes(Number(r.id))
            ? { ...r, status: newStatus, updated_at: new Date().toISOString() }
            : r
        );
        setStorage("mock_sample_requests", updated);

        return new Response(
          JSON.stringify({
            success: true,
            updated_count: targetIds.length,
            updated_ids: targetIds,
            new_status: newStatus,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // 9. Single Request update / delete
      if (pathname.startsWith("/api/v1/sample-requests/") && (method === "PUT" || method === "PATCH")) {
        const idStr = pathname.split("/").pop();
        const payload = init?.body ? JSON.parse(init.body as string) : {};
        let requests = getStorage("mock_sample_requests", INITIAL_SAMPLE_REQUESTS);
        let found = false;
        let updatedItem: any = null;

        requests = requests.map((r: any) => {
          if (String(r.id) === String(idStr) || String(r.sr_number) === String(idStr)) {
            found = true;
            updatedItem = {
              ...r,
              ...payload,
              updated_at: new Date().toISOString(),
            };
            return updatedItem;
          }
          return r;
        });

        if (found) {
          setStorage("mock_sample_requests", requests);
          return new Response(JSON.stringify(updatedItem), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "Sample request not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (pathname.startsWith("/api/v1/sample-requests/") && method === "DELETE") {
        const id = Number(pathname.split("/").pop());
        let requests = getStorage("mock_sample_requests", INITIAL_SAMPLE_REQUESTS);
        requests = requests.filter((r: any) => r.id !== id);
        setStorage("mock_sample_requests", requests);

        return new Response(JSON.stringify({ message: "Deleted successfully" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Studio Dielines Endpoints
      if (pathname === "/api/v1/studio/dielines" && method === "GET") {
        const dielines = getStorage("mock_studio_dielines", INITIAL_STUDIO_DIELINES);
        return new Response(JSON.stringify(dielines), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (pathname === "/api/v1/studio/dielines" && method === "POST") {
        const item = init?.body ? JSON.parse(init.body as string) : {};
        const dielines = getStorage("mock_studio_dielines", INITIAL_STUDIO_DIELINES);
        const newItem = {
          id: item.id || `dl-${Date.now()}`,
          dielineCode: item.dielineCode || `DL-26-${Math.floor(100 + Math.random() * 900)}`,
          ...item,
        };
        dielines.unshift(newItem);
        setStorage("mock_studio_dielines", dielines);
        return new Response(JSON.stringify(newItem), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (pathname.startsWith("/api/v1/studio/dielines/") && (method === "PATCH" || method === "PUT")) {
        const id = pathname.split("/").pop();
        const payload = init?.body ? JSON.parse(init.body as string) : {};
        let dielines = getStorage("mock_studio_dielines", INITIAL_STUDIO_DIELINES);
        let updated: any = null;
        dielines = dielines.map((d: any) => {
          if (String(d.id) === String(id) || String(d.dielineCode) === String(id)) {
            updated = { ...d, ...payload };
            return updated;
          }
          return d;
        });
        if (updated) {
          setStorage("mock_studio_dielines", dielines);
          return new Response(JSON.stringify(updated), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "Dieline not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Creative Briefs Endpoints
      if (pathname === "/api/v1/creative/briefs" && method === "GET") {
        const briefs = getStorage("mock_creative_briefs", INITIAL_CREATIVE_BRIEFS);
        return new Response(JSON.stringify(briefs), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (pathname === "/api/v1/creative/briefs" && method === "POST") {
        const item = init?.body ? JSON.parse(init.body as string) : {};
        const briefs = getStorage("mock_creative_briefs", INITIAL_CREATIVE_BRIEFS);
        const newItem = {
          id: item.id || `cr-${Date.now()}`,
          artCode: item.artCode || `ART-26-${Math.floor(100 + Math.random() * 900)}`,
          ...item,
        };
        briefs.unshift(newItem);
        setStorage("mock_creative_briefs", briefs);
        return new Response(JSON.stringify(newItem), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (pathname.startsWith("/api/v1/creative/briefs/") && (method === "PATCH" || method === "PUT")) {
        const id = pathname.split("/").pop();
        const payload = init?.body ? JSON.parse(init.body as string) : {};
        let briefs = getStorage("mock_creative_briefs", INITIAL_CREATIVE_BRIEFS);
        let updated: any = null;
        briefs = briefs.map((b: any) => {
          if (String(b.id) === String(id) || String(b.artCode) === String(id)) {
            updated = { ...b, ...payload };
            return updated;
          }
          return b;
        });
        if (updated) {
          setStorage("mock_creative_briefs", briefs);
          return new Response(JSON.stringify(updated), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "Creative brief not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Costing Estimations Endpoints
      if (pathname === "/api/v1/costing/estimations" && method === "GET") {
        const costings = getStorage("mock_costing_estimations", INITIAL_COSTING_ESTIMATIONS);
        return new Response(JSON.stringify(costings), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (pathname === "/api/v1/costing/estimations" && method === "POST") {
        const item = init?.body ? JSON.parse(init.body as string) : {};
        const costings = getStorage("mock_costing_estimations", INITIAL_COSTING_ESTIMATIONS);
        const newItem = {
          id: item.id || `cst-${Date.now()}`,
          costingCode: item.costingCode || `CST-26-${Math.floor(100 + Math.random() * 900)}`,
          ...item,
        };
        costings.unshift(newItem);
        setStorage("mock_costing_estimations", costings);
        return new Response(JSON.stringify(newItem), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (pathname.startsWith("/api/v1/costing/estimations/") && (method === "PATCH" || method === "PUT")) {
        const id = pathname.split("/").pop();
        const payload = init?.body ? JSON.parse(init.body as string) : {};
        let costings = getStorage("mock_costing_estimations", INITIAL_COSTING_ESTIMATIONS);
        let updated: any = null;
        costings = costings.map((c: any) => {
          if (String(c.id) === String(id) || String(c.costingCode) === String(id)) {
            updated = { ...c, ...payload };
            return updated;
          }
          return c;
        });
        if (updated) {
          setStorage("mock_costing_estimations", costings);
          return new Response(JSON.stringify(updated), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "Costing estimation not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 10. Plants List
      if (pathname === "/api/v1/plants" && method === "GET") {
        const plants = getStorage("mock_plants", INITIAL_PLANTS);
        return new Response(JSON.stringify(plants), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 11. Customers List
      if (pathname === "/api/v1/customers" && method === "GET") {
        const customers = getStorage("mock_customers", INITIAL_CUSTOMERS);
        return new Response(JSON.stringify(customers), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 12. Binding Hierarchy
      if (pathname === "/api/v1/product-characteristics/binding-hierarchy") {
        return new Response(
          JSON.stringify({
            hierarchy: BINDING_HIERARCHY,
            all_binding_1: Object.keys(BINDING_HIERARCHY),
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // 13. Distinct Classes
      if (pathname === "/api/v1/product-characteristics/classes") {
        const classMap: Record<string, number> = {};
        allCharacteristicsData.forEach((c: any) => {
          classMap[c.class_name] = (classMap[c.class_name] || 0) + 1;
        });
        const classes = Object.entries(classMap).map(([class_name, total]) => ({
          class_name,
          total_characteristics: total,
          characteristics_with_uom: 0,
        }));

        return new Response(JSON.stringify(classes), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 14. Product Characteristics Definitions
      if (pathname === "/api/v1/product-characteristics" && method === "GET") {
        const classNameParam = url.searchParams.get("class_name");
        let list = allCharacteristicsData;
        if (classNameParam) {
          list = list.filter((c: any) => c.class_name === classNameParam);
        }
        return new Response(JSON.stringify(list), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 15. Product Details for a Sample Request
      if (pathname.includes("/api/v1/product-characteristics/details/")) {
        const sampleRequestId = Number(pathname.split("/").pop());
        const details = allCharacteristicsData.map((char: any, idx: number) => ({
          id: idx + 1,
          sample_request_id: sampleRequestId,
          class_name: char.class_name,
          characteristic_name: char.characteristic_name,
          value: char.options && char.options.length > 0 ? char.options[0] : "",
          uom: char.uom || null,
        }));

        return new Response(JSON.stringify(details), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 16. Save Details
      if (pathname === "/api/v1/product-characteristics/details" && method === "POST") {
        return new Response(JSON.stringify({ message: "Saved product details successfully" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 17. Design Requests
      if (pathname.startsWith("/api/v1/design-requests/") && method === "GET") {
        const idStr = pathname.replace("/api/v1/design-requests/", "");
        const id = parseInt(idStr, 10);
        const designs = getStorage("mock_design_requests", INITIAL_DESIGN_REQUESTS);
        const found = designs.find((d: any) => d.id === id);
        if (found) {
          return new Response(JSON.stringify(found), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ detail: "Design request not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 17b. Design Request Update (PUT/PATCH for status updates)
      if (pathname.startsWith("/api/v1/design-requests/") && (method === "PUT" || method === "PATCH")) {
        const idStr = pathname.replace("/api/v1/design-requests/", "");
        const id = parseInt(idStr, 10);
        const body = init?.body ? JSON.parse(init.body as string) : {};
        const designs = getStorage("mock_design_requests", INITIAL_DESIGN_REQUESTS);
        const idx = designs.findIndex((d: any) => d.id === id);
        if (idx === -1) {
          return new Response(JSON.stringify({ detail: "Design request not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        const updated = { ...designs[idx], ...body, updated_at: new Date().toISOString() };
        designs[idx] = updated;
        setStorage("mock_design_requests", designs);
        return new Response(JSON.stringify(updated), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 17c. Design Request Delete
      if (pathname.startsWith("/api/v1/design-requests/") && method === "DELETE") {
        const idStr = pathname.replace("/api/v1/design-requests/", "");
        const id = parseInt(idStr, 10);
        let designs = getStorage("mock_design_requests", INITIAL_DESIGN_REQUESTS);
        designs = designs.filter((d: any) => d.id !== id);
        setStorage("mock_design_requests", designs);
        return new Response(JSON.stringify({ message: "Deleted successfully" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (pathname === "/api/v1/design-requests" && method === "GET") {
        const designs = getStorage("mock_design_requests", INITIAL_DESIGN_REQUESTS);
        return new Response(JSON.stringify(designs), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (pathname === "/api/v1/design-requests" && method === "POST") {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        const designs = getStorage("mock_design_requests", INITIAL_DESIGN_REQUESTS);
        const nextId = designs.length ? Math.max(...designs.map((d: any) => d.id)) + 1 : 1;

        const newDesign = {
          id: nextId,
          ...body,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        designs.unshift(newDesign);
        setStorage("mock_design_requests", designs);

        return new Response(JSON.stringify(newDesign), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 18. Members / Users List (/api/auth/users)
      if (pathname === "/api/auth/users" && method === "GET") {
        const users = getStorage("mock_users", INITIAL_USERS);
        return new Response(JSON.stringify(users), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (pathname === "/api/auth/users" && method === "POST") {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        const users = getStorage("mock_users", INITIAL_USERS);
        const nextId = users.length + 1;
        const newUser = {
          id: nextId,
          ...body,
          is_active: true,
          created_at: new Date().toISOString(),
        };
        users.push(newUser);
        setStorage("mock_users", users);
        return new Response(JSON.stringify(newUser), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 19. Health check
      if (pathname === "/api/health") {
        return new Response(JSON.stringify({ status: "healthy", environment: "prototype" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Default fallback to native fetch
    return originalFetch.apply(window, [input, init]);
  };
}
