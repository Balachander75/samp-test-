import allCharacteristicsData from "./all_characteristics.json";

// Customer Master list (from production database)
const INITIAL_CUSTOMERS: any[] = [
  { id: 1, name: "Target Global Sourcing Limited", country: "Hong Kong" },
  { id: 2, name: "Walmart, Inc", country: "USA" },
  { id: 3, name: "Walmart canada Corp", country: "Canada" },
  { id: 4, name: "Staples,The Office Superstore, LLC", country: "USA" },
  { id: 5, name: "Dollar General Corporation", country: "USA" },
  { id: 6, name: "Dollar Tree Stores Canada, INC", country: "Canada" },
  { id: 7, name: "Family Dollar Services, LLC.", country: "USA" },
  { id: 8, name: "Greenbrier International, INC", country: "USA" },
  { id: 9, name: "Asda Stores Ltd", country: "United Kingdom" },
  { id: 10, name: "Tedi GmbH & Co. KG", country: "Germany" },
  { id: 11, name: "Woolworth Gmbh", country: "Germany" },
  { id: 12, name: "KIK Textilien und non-Food GmbH", country: "Germany" },
  { id: 13, name: "Ustro Ulrich Strobel Gmbh", country: "Germany" },
  { id: 14, name: "HRK Group, Inc.", country: "USA" },
  { id: 15, name: "Freedom Stationery (Pty) Ltd.", country: "South Africa" },
  { id: 16, name: "Sai Office Supplies Limited.", country: "Kenya" },
  { id: 17, name: "Sai Office Supplies (UG) LTD", country: "Uganda" },
  { id: 18, name: "Printech Ltd", country: "Zambia" },
  { id: 19, name: "King's Stationers", country: "Tanzania" },
  { id: 20, name: "Avalon International Ltd.", country: "New Zealand" },
  { id: 21, name: "Nemo Traders S.A.", country: "Panama" },
  { id: 22, name: "Daily Latino America S.A.,", country: "Panama" },
  { id: 23, name: "Svojtka & Co, s.r.o", country: "Czech Republic" },
  { id: 24, name: "Manpalider S.A", country: "Costa Rica" },
  { id: 25, name: "JYOSUN NV", country: "St. Martin" },
  { id: 26, name: "Comercializadora Mexico", country: "Mexico" },
  { id: 27, name: "Full Solutions S.A. De C.V", country: "El Salvador" },
  { id: 28, name: "Techno A Class SARL", country: "Togo" },
  { id: 29, name: "Ste Technomart Sarl", country: "Ivory Coast" },
  { id: 30, name: "Norwegian Toy Import A/S", country: "Norway" },
];

const INITIAL_PLANTS: any[] = [
  { id: 1, code: "1503- Silvasa", name: "1503- Silvasa", location: "Dadra & Nagar Haveli", is_active: true },
  { id: 2, code: "1505- Khaniwade", name: "1505- Khaniwade", location: "Maharashtra", is_active: true },
  { id: 3, code: "1003- Pariya", name: "1003- Pariya", location: "Gujarat", is_active: true },
];

const INITIAL_SAMPLE_REQUESTS: any[] = [
  {
    id: 101,
    sr_number: "SR-26-00101",
    material_code: "NB-CB-A5-0801",
    barcode: "8901234567801",
    source_sample_code: "PREV-2025-412",
    product_description: "A5 Case Bound Hardcover Executive Journal 192P Dot Grid",
    product_type: "Case Bound Journal",
    customer: "Target Global Sourcing Limited",
    target_plant: "1505- Khaniwade",
    year: "2026-2027",
    program_year: "BTS 2026-2027",
    program_name: "Bright Future Stationery BTS",
    date_request_created: "2026-09-15",
    sample_required_date: "2026-10-10",
    created_by: "Balachander (Admin)",
    brand_name: "Room Essentials",
    customer_product_code: "TGT-NB-7821",
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
    material_code: "NB-SC-B5-0422",
    barcode: "8901234567822",
    source_sample_code: "SAMP-2025-883",
    product_description: "B5 Saddle Stitched Student Subject Notebook 80P College Ruled",
    product_type: "Soft Cover Notebook",
    customer: "Walmart, Inc",
    target_plant: "1503- Silvasa",
    year: "2026-2027",
    program_year: "BTS 2026-2027",
    program_name: "Pen + Gear Everyday Value",
    date_request_created: "2026-09-16",
    sample_required_date: "2026-10-05",
    created_by: "Sarah Jenkins",
    brand_name: "Pen + Gear",
    customer_product_code: "WMT-PG-1104",
    unit_pc_pack: "3-Pack Shrink",
    qty_for_sampling: "12",
    qty_design_costing: "250000",
    mockup_required: "Yes",
    creation_mode: "binding",
    request_types: ["sample", "costing"],
    status: "Creative",
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
    mockup_required: "No",
    creation_mode: "material_code",
    request_types: ["design", "sample", "costing"],
    status: "Studio",
    created_at: "2026-09-17T09:45:00Z",
    updated_at: "2026-09-17T09:45:00Z",
  },
  {
    id: 104,
    sr_number: "SR-26-00104",
    material_code: "FL-PF-A4-0311",
    barcode: "8901234567311",
    source_sample_code: null,
    product_description: "A4 Presentation Portfolio with Magnetic Flap & Expandable Pocket",
    product_type: "Presentation Portfolio",
    customer: "Dollar General Corporation",
    target_plant: "1003- Pariya",
    year: "2026-2027",
    program_year: "Holiday 2026",
    program_name: "Artisan Heritage Collection",
    date_request_created: "2026-09-18",
    sample_required_date: "2026-10-25",
    created_by: "Sarah Jenkins",
    brand_name: "Signature Collection",
    customer_product_code: "BN-ART-501",
    unit_pc_pack: "Gift Box Packaging",
    qty_for_sampling: "2",
    qty_design_costing: "20000",
    mockup_required: "Yes",
    creation_mode: "binding",
    request_types: ["design", "mockup"],
    status: "Draft (Pre-SMT)",
    created_at: "2026-09-18T14:10:00Z",
    updated_at: "2026-09-18T14:10:00Z",
  },
  {
    id: 105,
    sr_number: "SR-26-00105",
    material_code: "NB-SP-A5-1200",
    barcode: "8901234567200",
    source_sample_code: null,
    product_description: "A5 Hidden Wire-O Eco Journal with Kraft Cover & Elastic Pen Loop",
    product_type: "Wire-O Notebook",
    customer: "Walmart, Inc",
    target_plant: "1503- Silvasa",
    year: "2026-2027",
    program_year: "BTS 2026-2027",
    program_name: "Amazon Commercial Stationery",
    date_request_created: "2026-09-12",
    sample_required_date: "2026-09-30",
    created_by: "Balachander (Admin)",
    brand_name: "Mainstays",
    customer_product_code: "WMT-MS-091",
    unit_pc_pack: "Bulk Pack of 10",
    qty_for_sampling: "8",
    qty_design_costing: "300000",
    mockup_required: "No",
    creation_mode: "material_code",
    request_types: ["sample", "costing"],
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

export function setupMockApiInterceptor() {
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
        const requests = getStorage("mock_sample_requests", INITIAL_SAMPLE_REQUESTS);
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
            request_types: item.request_types || ["sample", "costing"],
            status: item.status || "Draft (Pre-SMT)",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          createdRows.push(newRow);
          srNumbers.push(sr_number);
          requests.unshift(newRow);
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
          request_types: item.request_types || ["sample", "costing"],
          status: item.status || "Draft (Pre-SMT)",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        requests.unshift(newRow);
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
