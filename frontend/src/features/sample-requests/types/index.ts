export type SampleStatus =
  | "Draft (Pre-SMT)"
  | "Creative"
  | "Studio"
  | "SAMP"
  | "In Plant Work"
  | "Dispatched / Closed"
  | "Actual Deal"
  | "Draft (Pre-PMT)"
  | "Sampling Review (PMT)"
  | "Released"
  | "In Plant Execution"
  | "QC Inspection"
  | "Dispatched"
  | "Customer Review"
  | "Approved / Closed";

export interface SampleRequestItem {
  id: string;
  srNumber: string;
  year: string;
  productDescription: string;
  customer: string;
  targetPlant: string;
  dateRequestCreated: string;
  createdBy: string;
  materialCode: string;
  barcode?: string;
  customerProductCode?: string;
  sourceSampleCode?: string;
  sourceRequestId?: number;
  sourceSampleRequestId?: number;
  sampleRequiredDate?: string;
  productType?: string;
  productTypeNavneet?: string;
  productTypeNewCustomer?: string;
  productImagePath?: string;
  designsCustomerCreative?: string;
  brandName?: string;
  unitPcPack?: string | number;
  qtyDesignCosting?: string | number;
  productArtworkNos?: string | number;
  targetArtworkDateCreative?: string;
  targetArtworkDateStudio?: string;
  qtyForSampling?: string | number;
  mockupRequired?: string;
  status: SampleStatus | string;
  creationMode?: "material_code" | "binding" | string;
  programYear?: string;
  programName?: string;
  requestTypes?: RequestType[];
  requestKind?: "sample" | "design";
  designRequestId?: number;
  numberOfDesigns?: number;
  trend?: string | null;
  targetAudience?: string | null;
  referenceImage?: string | null;
  createdAt: string;
  plantFeasibilityResponse?: "Yes" | "No" | "Maybe" | null;
  plantFeasibilityRemark?: string | null;
  samplingFeasibilityResponse?: "Yes" | "No" | "Maybe" | null;
  samplingFeasibilityRemark?: string | null;
  feasibilityClosedAt?: string | null;
  feasibilityClosedBy?: "plant" | "sampling" | null;
}

export interface CreateSampleRequestForm {
  year?: string;
  programYear?: string;
  productDescription?: string;
  programName?: string;
  customer: string;
  targetPlant: string;
  materialCode?: string;
  barcode?: string;
  customerProductCode?: string;
  sourceSampleCode?: string;
  sampleRequiredDate?: string;
  productType?: string;
  brandName?: string;
  productTypeNavneet?: string;
  productTypeNewCustomer?: string;
  unitPcPack?: string | number;
  qtyDesignCosting?: string | number;
  productArtworkNos?: string | number;
  targetArtworkDateCreative?: string;
  targetArtworkDateStudio?: string;
  qtyForSampling?: string | number;
  mockupRequired?: string;
  designsCustomerCreative?: string;
  productImagePath?: string;
  dateRequestCreated?: string;
  createdBy?: string;
  status?: string;
  creationMode?: "material_code" | "binding" | string;
  sourceRequestId?: number;
  sourceSampleRequestId?: number;
  customBinding1?: string;
  customBinding2?: string;
  customDetails?: Array<{
    className: string;
    characteristicName: string;
    value: string | null;
    uom?: string | null;
  }>;
  requestTypes?: RequestType[];
  requestTypeSelectedAt?: RequestTypeSelectedAt;
  plantFeasibilityResponse?: "Yes" | "No" | "Maybe" | null;
  plantFeasibilityRemark?: string | null;
  samplingFeasibilityResponse?: "Yes" | "No" | "Maybe" | null;
  samplingFeasibilityRemark?: string | null;
  feasibilityClosedAt?: string | null;
  feasibilityClosedBy?: "plant" | "sampling" | null;
}

export type RequestType = "design" | "mockup" | "sample" | "costing";

export type RequestTypeSelectedAt = Partial<Record<RequestType, string | null>>;

export interface BindingHierarchyResponse {
  binding1_options: string[];
  hierarchy: Record<string, string[]>;
}

export interface ProductSearchResult {
  id: number;
  sr_number: string;
  material_code: string;
  product_description: string;
  customer?: string;
  target_plant?: string;
  binding_type_1?: string;
  binding_type_2?: string;
  c1_caliper_weight?: string;
  c2_material_type?: string;
  c2_cover_finish?: string;
  details_count?: number;
}

export interface PlantItem {
  id: number;
  code: string;
  name: string;
  location?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlantForm {
  code: string;
  name: string;
  location?: string;
  isActive?: boolean;
}

export interface CustomerItem {
  id: number;
  name: string;
  country?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StagedProductItem {
  id: string; // unique client id
  materialCode: string;
  sourceSampleCode?: string;
  productDescription: string;
  barcode?: string;
  customerProductCode?: string;
  productType?: string;
  sourceSampleRequestId?: number;
  sourceRequestId?: number;
  creationMode: "material_code" | "binding";
  bindingType1: string;
  bindingType2: string;
  originalBindingType1?: string;
  originalBindingType2?: string;
  isBindingEdited?: boolean;
  detailsCount?: number;
  customer?: string;
  targetPlant?: string;
  srNumber?: string;
  editedDetails?: Array<{
    id?: number;
    sampleRequestId?: number;
    className: string;
    characteristicName: string;
    value: string | null;
    uom?: string | null;
    options?: string[];
  }>;
  requestTypes?: RequestType[];
  requestTypeSelectedAt?: RequestTypeSelectedAt;
}

export interface BatchSampleRequestItemPayload {
  material_code: string;
  product_description?: string;
  barcode?: string | null;
  customer_product_code?: string | null;
  source_sample_code?: string | null;
  product_type?: string | null;
  source_sample_request_id?: number;
  creation_mode: "material_code" | "binding";
  custom_binding_1?: string | null;
  custom_binding_2?: string | null;
  custom_details?: Array<{
    class_name: string;
    characteristic_name: string;
    value: string | null;
    uom: string | null;
  }>;
  request_types?: RequestType[];
  request_type_selected_at?: RequestTypeSelectedAt;
}

export interface BatchCreateSampleRequestPayload {
  customer: string;
  program_name: string;
  program_year: string;
  target_plant?: string;
  created_by?: string;
  date_request_created?: string;
  sample_required_date?: string;
  items: BatchSampleRequestItemPayload[];
}

export interface BatchCreateSampleRequestResponse {
  success: boolean;
  message: string;
  total_created: number;
  requests: SampleRequestItem[];
}

export interface DesignRequest {
  id: number;
  customerName: string;
  programName: string;
  programYear: string;
  numberOfDesigns: number;
  trend?: string | null;
  targetAudience?: string | null;
  referenceImage?: string | null;
  productDescription: string;
  designRequiredDate?: string | null;
  status: SampleStatus | string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DesignRequestForm {
  customerName: string;
  programName: string;
  programYear: string;
  numberOfDesigns: string;
  trend: string;
  targetAudience: string;
  referenceImage: string;
  productDescription: string;
  designRequiredDate: string;
}

export interface DielineItem {
  id: string;
  dielineCode: string;
  srNumber: string;
  boxFormat: "Rigid Box" | "Folding Carton" | "Flute Corrugated" | "Blister / Sleeve";
  title: string;
  client: string;
  dimensions: string; // L x W x H mm
  substrate: string;
  caliperMicrons: number;
  machineCompatibility: string;
  status: "CAD Intake" | "Dieline Construction" | "3D Simulation" | "Plotter Sample Tested" | "Laser Die Cleared";
  dueDate: string;
  targetPlant: string;
  fluteGrade?: string;
  grainDirection: "Parallel to Spine" | "Perpendicular to Crease";
  fileFormats: string[];
}

export interface CreativeBriefItem {
  id: string;
  artCode: string;
  srNumber: string;
  title: string;
  brand: string;
  category: "Notebook Covers" | "Rigid Packaging" | "Tin / Metal Containers" | "Stationery Packs";
  variantsCount: number;
  designer: string;
  colorSpecs: string;
  proofVersion: string;
  proofStatus: "Brief Intake" | "In Concept" | "Client Review" | "Revisions Requested" | "Prepress Approved";
  dueDate: string;
  dimensions: string;
  finishingNotes: string;
  cmykCheckPassed: boolean;
  resolutionDpi: number;
  bleedMm: number;
  clientFeedback?: string;
  accentColor: string;
}

export interface CostingItem {
  id: string;
  costingCode: string;
  srNumber: string;
  customer: string;
  productTitle: string;
  targetVolume: number; // in pcs
  substrateUnitCost: number; // INR
  conversionUnitCost: number; // INR
  netUnitCost: number; // substrate + conversion
  marginPct: number; // e.g. 24.5%
  quotedUnitPrice: number; // calculated from margin
  totalProjectValue: number; // targetVolume * quotedUnitPrice
  status: "Spec Review" | "Substrate Pricing" | "Margin Review" | "Quote Released" | "Won Deal";
  dueDate: string;
  targetPlant: string;
  substrateSpec: string;
}

