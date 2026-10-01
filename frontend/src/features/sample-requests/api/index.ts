import {
  CreateSampleRequestForm,
  SampleRequestItem,
  PlantItem,
  CreatePlantForm,
  CustomerItem,
  BindingHierarchyResponse,
  ProductSearchResult,
  BatchCreateSampleRequestPayload,
  BatchCreateSampleRequestResponse,
  DesignRequest,
  DesignRequestForm,
  DielineItem,
  CreativeBriefItem,
  CostingItem,
  FeasibilityRequestPayload,
  FeasibilityRequestRecord,
  ProgramMaterialItem,
  ProgramRequestRecord,
  CreateProgramRequestPayload,
  AddProgramMaterialPayload,
} from "../types";
import { API_BASE_URL, createApiHeaders } from "@/lib/api";




export const PRODUCT_CLASS_ORDER = [
  "PRODUCT_CLASS",
  "NB_BINDING",
  "NB_COMPONENT_1",
  "NB_COMPONENT_2",
  "NB_COMPONENT_3",
  "NB_COMPONENT_4",
  "NB_COMPONENT_5",
  "NB_COMPONENT_6",
  "NB_COMPONENT_7",
  "NB_DIVIDER_SPECS",
  "PACKAGING_SPECS_1",
  "PACKING_DETAILS",
  "RULLING_DETAILS",
] as const;

const BINDING_CACHE_TTL_MS = 30_000;
const bindingSearchCache = new Map<string, { results: ProductSearchResult[]; expiresAt: number }>();
let bindingHierarchyCache: { data: BindingHierarchyResponse; expiresAt: number } | null = null;

function mapDesignRequest(item: Record<string, unknown>): DesignRequest {
  return {
    id: Number(item.id),
    srNumber: typeof item.sr_number === "string" ? item.sr_number : (typeof item.srNumber === "string" ? item.srNumber : undefined),
    requestCode: typeof item.request_code === "string" ? item.request_code : (typeof item.requestCode === "string" ? item.requestCode : undefined),
    customerName: String(item.customer_name || item.customer || ""),
    programName: String(item.program_name || item.programName || ""),
    programYear: String(item.program_year || item.programYear || "2026-2027"),
    targetPlant: typeof item.target_plant === "string" ? item.target_plant : (typeof item.targetPlant === "string" ? item.targetPlant : undefined),
    numberOfDesigns: Number(item.number_of_designs || item.numberOfDesigns || 1),
    trend: typeof item.trend === "string" ? item.trend : null,
    targetAudience: typeof item.target_audience === "string" ? item.target_audience : (typeof item.targetAudience === "string" ? item.targetAudience : null),
    referenceImage: typeof item.reference_image === "string" ? item.reference_image : (typeof item.referenceImage === "string" ? item.referenceImage : null),
    productDescription: String(item.product_description || item.productDescription || "Creative Design Brief"),
    designRequiredDate: typeof item.design_required_date === "string" ? item.design_required_date : (typeof item.designRequiredDate === "string" ? item.designRequiredDate : null),
    status: String(item.status || "Draft (Pre-SMT)"),
    createdBy: String(item.created_by || item.createdBy || "Marketing Specialist"),
    updatedBy: String(item.updated_by || item.updatedBy || ""),
    createdAt: String(item.created_at || item.createdAt || ""),
    updatedAt: String(item.updated_at || item.updatedAt || ""),
  };
}

export function mapDesignRequestToSampleRequest(item: DesignRequest): SampleRequestItem {
  const createdDate = item.createdAt ? item.createdAt.split("T")[0] : "";
  const currentYearSuffix = new Date().getFullYear() % 100;
  const srNum = item.srNumber || `SR-${currentYearSuffix}-DSG-${String(item.id).padStart(3, "0")}`;
  const matCode = item.requestCode || `DSG-1505-${String(item.id).padStart(4, "0")}`;
  return {
    id: `design-${item.id}`,
    srNumber: srNum,
    year: item.programYear || "2026-2027",
    productDescription: item.productDescription,
    customer: item.customerName,
    targetPlant: item.targetPlant || "",
    dateRequestCreated: createdDate || new Date().toISOString().split("T")[0],
    createdBy: item.createdBy || "Marketing Specialist",
    materialCode: matCode,
    sampleRequiredDate: item.designRequiredDate || undefined,
    status: item.status || "Draft (Pre-SMT)",
    programYear: item.programYear,
    programName: item.programName,
    requestKind: "design",
    designRequestId: item.id,
    numberOfDesigns: item.numberOfDesigns,
    trend: item.trend,
    targetAudience: item.targetAudience,
    referenceImage: item.referenceImage,
    createdAt: item.createdAt,
    requestTypes: ["design"],
    creationMode: "marketing_request",
  };
}

export async function fetchDesignRequestsApi(): Promise<DesignRequest[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/design-requests`, {
    headers: createApiHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to fetch design requests: ${response.statusText}`);
  const data = (await response.json()) as Record<string, unknown>[];
  return data.map(mapDesignRequest);
}

export async function fetchDesignRequestApi(id: number): Promise<DesignRequest> {
  const response = await fetch(`${API_BASE_URL}/api/v1/design-requests/${id}`, {
    headers: createApiHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to fetch design request: ${response.statusText}`);
  return mapDesignRequest(await response.json());
}

export async function createDesignRequestApi(form: DesignRequestForm): Promise<DesignRequest | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/design-requests`, {
      method: "POST",
      headers: createApiHeaders({ json: true }),
      body: JSON.stringify({
        customer_name: form.customerName.trim(),
        program_name: form.programName.trim(),
        program_year: form.programYear.trim(),
        number_of_designs: Number(form.numberOfDesigns),
        trend: form.trend.trim() || null,
        target_audience: form.targetAudience.trim() || null,
        reference_image: form.referenceImage.trim() || null,
        product_description: form.productDescription.trim(),
        design_required_date: form.designRequiredDate || null,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.detail || `Failed to create design request: ${response.statusText}`);
    }
    return mapDesignRequest(await response.json());
  } catch (error) {
    console.error("Error creating design request:", error);
    throw error;
  }
}

export async function updateDesignRequestApi(
  id: number,
  form: Partial<DesignRequestForm>,
): Promise<DesignRequest | null> {
  const response = await fetch(`${API_BASE_URL}/api/v1/design-requests/${id}`, {
    method: "PUT",
    headers: createApiHeaders({ json: true }),
    body: JSON.stringify({
      ...(form.customerName !== undefined ? { customer_name: form.customerName.trim() } : {}),
      ...(form.programName !== undefined ? { program_name: form.programName.trim() } : {}),
      ...(form.programYear !== undefined ? { program_year: form.programYear.trim() } : {}),
      ...(form.numberOfDesigns !== undefined ? { number_of_designs: Number(form.numberOfDesigns) } : {}),
      ...(form.trend !== undefined ? { trend: form.trend.trim() || null } : {}),
      ...(form.targetAudience !== undefined ? { target_audience: form.targetAudience.trim() || null } : {}),
      ...(form.referenceImage !== undefined ? { reference_image: form.referenceImage.trim() || null } : {}),
      ...(form.productDescription !== undefined ? { product_description: form.productDescription.trim() } : {}),
      ...(form.designRequiredDate !== undefined ? { design_required_date: form.designRequiredDate || null } : {}),
    }),
  });
  if (!response.ok) throw new Error(`Failed to update design request: ${response.statusText}`);
  return mapDesignRequest(await response.json());
}

export async function updateDesignRequestStatusApi(id: number, status: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/api/v1/design-requests/${id}`, {
    method: "PUT",
    headers: createApiHeaders({ json: true }),
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error(`Failed to update design request status: ${response.statusText}`);
  return true;
}

export async function deleteDesignRequestApi(id: number): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/api/v1/design-requests/${id}`, {
    method: "DELETE",
    headers: createApiHeaders(),
  });
  return response.ok;
}

type ApiSampleRequest = Record<string, unknown>;

function text(value: unknown, fallback = ""): string {
  return value == null || value === "" ? fallback : String(value);
}

function textOrNumber(value: unknown): string | number {
  return typeof value === "number" ? value : text(value);
}

function mapSampleRequest(item: ApiSampleRequest, fallbackDate = ""): SampleRequestItem {
  return {
    id: text(item.id),
    srNumber: text(item.sr_number ?? (item as any).srNumber),
    year: text(item.year, "2026-2027"),
    productDescription: text(item.product_description ?? (item as any).productDescription),
    programName: text(item.program_name ?? (item as any).programName),
    customer: text(item.customer),
    targetPlant: text(item.target_plant ?? (item as any).targetPlant),
    dateRequestCreated: text(item.date_request_created ?? (item as any).dateRequestCreated, fallbackDate),
    createdBy: text(item.created_by ?? (item as any).createdBy, "Admin"),
    materialCode: text(item.material_code ?? (item as any).materialCode),
    barcode: text(item.barcode),
    customerProductCode: text(item.customer_product_code ?? item.customerProductCode),
    sourceSampleCode: text(item.source_sample_code ?? (item as any).sourceSampleCode),
    sourceRequestId: item.source_request_id ? Number(item.source_request_id) : undefined,
    sourceSampleRequestId: item.source_sample_request_id ? Number(item.source_sample_request_id) : (item.source_request_id ? Number(item.source_request_id) : undefined),
    sampleRequiredDate: text(item.sample_required_date ?? (item as any).sampleRequiredDate),
    productType: text(item.product_type ?? (item as any).productType),
    productTypeNavneet: text(item.product_type_navneet ?? item.productTypeNavneet ?? item.product_type),
    productTypeNewCustomer: text(item.product_type_new_customer ?? (item as any).productTypeNewCustomer),
    productImagePath: text(item.product_image_path ?? (item as any).productImagePath),
    designsCustomerCreative: text(item.designs_customer_creative ?? (item as any).designsCustomerCreative),
    brandName: text(item.brand_name ?? (item as any).brandName),
    unitPcPack: textOrNumber(item.unit_pc_pack ?? (item as any).unitPcPack),
    qtyDesignCosting: textOrNumber(item.qty_design_costing ?? (item as any).qtyDesignCosting),
    productArtworkNos: textOrNumber(item.product_artwork_nos ?? (item as any).productArtworkNos),
    targetArtworkDateCreative: text(item.target_artwork_date_creative ?? (item as any).targetArtworkDateCreative),
    targetArtworkDateStudio: text(item.target_artwork_date_studio ?? (item as any).targetArtworkDateStudio),
    qtyForSampling: textOrNumber(item.qty_for_sampling ?? (item as any).qtyForSampling),
    mockupRequired: text(item.mockup_required ?? (item as any).mockupRequired),
    status: text(item.status, "Draft (Pre-SMT)"),
    creationMode: text(item.creation_mode ?? (item as any).creationMode, "material_code"),
    programYear: text(item.program_year ?? (item as any).programYear),
    requestTypes: Array.isArray(item.request_types || (item as any).requestTypes)
      ? ((item.request_types || (item as any).requestTypes) as any[]).filter((value): value is "design" | "mockup" | "sample" | "costing" =>
          ["design", "mockup", "sample", "costing"].includes(String(value)),
        )
      : [],
    createdAt: item.created_at ? text(item.created_at).split("T")[0] : ((item as any).createdAt ? text((item as any).createdAt).split("T")[0] : fallbackDate),
    plantFeasibilityResponse: (item.plant_feasibility_response || item.plantFeasibilityResponse || null) as any,
    plantFeasibilityRemark: text(item.plant_feasibility_remark || item.plantFeasibilityRemark) || null,
    samplingFeasibilityResponse: (item.sampling_feasibility_response || item.samplingFeasibilityResponse || null) as any,
    samplingFeasibilityRemark: text(item.sampling_feasibility_remark || item.samplingFeasibilityRemark) || null,
    feasibilityClosedAt: text(item.feasibility_closed_at || item.feasibilityClosedAt) || null,
    feasibilityClosedBy: (item.feasibility_closed_by || item.feasibilityClosedBy || null) as any,
    referenceImages: Array.isArray(item.reference_images)
      ? (item.reference_images as string[])
      : Array.isArray((item as any).referenceImages)
      ? ((item as any).referenceImages as string[])
      : [],
    referenceLinks: Array.isArray(item.reference_links)
      ? (item.reference_links as string[])
      : Array.isArray((item as any).referenceLinks)
      ? ((item as any).referenceLinks as string[])
      : [],
  };
}

export function mapFeasibilityRequestToSampleRequest(item: FeasibilityRequestRecord): SampleRequestItem {
  const createdAt = item.requestRaisedAt || "";
  const description = item.customFeasibilityType || item.feasibilityType;
  return {
    id: `feasibility-${item.id}`,
    srNumber: item.srNumber,
    year: createdAt ? createdAt.slice(0, 4) : "",
    productDescription: `${description}: ${item.descriptionNotes}`,
    customer: item.customer,
    targetPlant: "",
    dateRequestCreated: createdAt ? createdAt.split("T")[0] : "",
    createdBy: item.createdBy || "",
    materialCode: item.requestCode,
    sampleRequiredDate: item.requiredDate,
    status: item.status,
    creationMode: "feasibility_check",
    programName: description,
    programYear: createdAt ? createdAt.slice(0, 4) : "",
    requestTypes: ["sample"],
    requestKind: "feasibility",
    createdAt,
    referenceImage: item.referenceImages?.[0] || null,
    referenceImages: item.referenceImages || [],
    referenceLinks: item.referenceLinks || [],
    feasibilityType: item.feasibilityType,
    customFeasibilityType: item.customFeasibilityType,
    feasibilityDescription: item.descriptionNotes,
    marketingRemarks: item.marketingRemarks,
    samplingFeasibilityResponse: item.samplingFeasibilityResponse,
    samplingFeasibilityRemark: item.samplingFeasibilityRemark,
    samplingFeasibilityApprovedBy: item.samplingFeasibilityApprovedBy,
    feasibilityClosedAt: item.feasibilityClosedAt,
    feasibilityClosedBy: item.feasibilityClosedBy as any,
    isRespondedOnTime: item.isRespondedOnTime,
    marketingDecision: item.marketingDecision,
    marketingDecisionBy: item.marketingDecisionBy,
    marketingDecisionAt: item.marketingDecisionAt,
    marketingDecisionRemark: item.marketingDecisionRemark,
    activities: item.activities || [],
  };
}

function mapFeasibilityResponse(item: Record<string, unknown>): FeasibilityRequestRecord {
  const rawActivities = Array.isArray(item.activities) ? item.activities : [];
  const activities = rawActivities.map((act: any) => ({
    id: Number(act.id),
    feasibilityRequestId: Number(act.feasibility_request_id || item.id),
    actorId: act.actor_id != null ? Number(act.actor_id) : null,
    actorName: String(act.actor_name || "Unknown"),
    actorDepartment: String(act.actor_department || "Operations"),
    action: String(act.action || "EVENT"),
    payload: (act.payload && typeof act.payload === "object") ? act.payload : {},
    createdAt: String(act.created_at || ""),
  }));

  return {
    id: Number(item.id),
    requestCode: String(item.request_code || ""),
    srNumber: String(item.sr_number || ""),
    customer: String(item.customer || ""),
    feasibilityType: String(item.feasibility_type || ""),
    customFeasibilityType: typeof item.custom_feasibility_type === "string" ? item.custom_feasibility_type : null,
    descriptionNotes: String(item.description_notes || ""),
    requiredDate: String(item.required_date || ""),
    marketingRemarks: typeof item.marketing_remarks === "string" ? item.marketing_remarks : null,
    referenceImages: Array.isArray(item.reference_images) ? (item.reference_images as string[]) : [],
    referenceLinks: Array.isArray(item.reference_links) ? (item.reference_links as string[]) : [],
    createdBy: typeof item.created_by === "string" ? item.created_by : null,
    requestCreatedBy: typeof item.request_created_by === "string"
      ? item.request_created_by
      : (typeof item.created_by === "string" ? item.created_by : null),
    status: String(item.status || "Pending Feasibility"),
    requestRaisedAt: String(item.request_raised_at || ""),
    updatedAt: typeof item.updated_at === "string" ? item.updated_at : null,
    samplingFeasibilityResponse: (item.sampling_feasibility_response || null) as any,
    samplingFeasibilityRemark: typeof item.sampling_feasibility_remark === "string" ? item.sampling_feasibility_remark : null,
    samplingFeasibilityApprovedBy: typeof item.sampling_feasibility_approved_by === "string" ? item.sampling_feasibility_approved_by : null,
    feasibilityClosedAt: typeof item.feasibility_closed_at === "string" ? item.feasibility_closed_at : null,
    feasibilityClosedBy: typeof item.feasibility_closed_by === "string" ? item.feasibility_closed_by : null,
    isRespondedOnTime: item.is_responded_on_time != null ? Boolean(item.is_responded_on_time) : null,
    marketingDecision: (item.marketing_decision || null) as any,
    marketingDecisionBy: typeof item.marketing_decision_by === "string" ? item.marketing_decision_by : null,
    marketingDecisionAt: typeof item.marketing_decision_at === "string" ? item.marketing_decision_at : null,
    marketingDecisionRemark: typeof item.marketing_decision_remark === "string" ? item.marketing_decision_remark : null,
    activities,
  };
}

export async function fetchFeasibilityRequestsApi(): Promise<SampleRequestItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/feasibility-requests`, {
    headers: createApiHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to fetch feasibility requests: ${response.statusText}`);
  const data = (await response.json()) as Record<string, unknown>[];
  return data.map((item) => mapFeasibilityRequestToSampleRequest(mapFeasibilityResponse(item)));
}

export async function createFeasibilityRequestApi(
  payload: FeasibilityRequestPayload,
): Promise<FeasibilityRequestRecord> {
  const response = await fetch(`${API_BASE_URL}/api/v1/feasibility-requests`, {
    method: "POST",
    headers: createApiHeaders({ json: true }),
    body: JSON.stringify({
      customer: payload.customer,
      feasibility_type: payload.feasibilityType,
      custom_feasibility_type: payload.customFeasibilityType || null,
      description_notes: payload.descriptionNotes,
      required_date: payload.requiredDate,
      marketing_remarks: payload.marketingRemarks || null,
      reference_images: payload.referenceImages || [],
      reference_links: payload.referenceLinks || [],
      created_by: payload.createdBy || null,
      request_created_by: payload.createdBy || null,
      created_by_user_id: payload.createdByUserId || null,
    }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || `Failed to create feasibility request: ${response.statusText}`);
  }
  return mapFeasibilityResponse(await response.json());
}

export interface UpdateFeasibilityRequestPayload {
  status?: string;
  samplingFeasibilityResponse?: "Yes" | "No" | "Maybe" | null;
  samplingFeasibilityRemark?: string | null;
  samplingFeasibilityApprovedBy?: string | null;
  feasibilityClosedAt?: string | null;
  feasibilityClosedBy?: string | null;
  isRespondedOnTime?: boolean | null;
  marketingDecision?: "Accepted" | "Rejected" | null;
  marketingDecisionBy?: string | null;
  marketingDecisionAt?: string | null;
  marketingDecisionRemark?: string | null;
}

export async function updateFeasibilityRequestApi(
  id: number | string,
  payload: UpdateFeasibilityRequestPayload,
): Promise<SampleRequestItem> {
  const rawId = String(id).replace(/^feasibility-/, "");
  const response = await fetch(`${API_BASE_URL}/api/v1/feasibility-requests/${Number(rawId)}`, {
    method: "PUT",
    headers: createApiHeaders({ json: true }),
    body: JSON.stringify({
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.samplingFeasibilityResponse !== undefined
        ? { sampling_feasibility_response: payload.samplingFeasibilityResponse }
        : {}),
      ...(payload.samplingFeasibilityRemark !== undefined
        ? { sampling_feasibility_remark: payload.samplingFeasibilityRemark }
        : {}),
      ...(payload.samplingFeasibilityApprovedBy !== undefined
        ? { sampling_feasibility_approved_by: payload.samplingFeasibilityApprovedBy }
        : {}),
      ...(payload.feasibilityClosedAt !== undefined
        ? { feasibility_closed_at: payload.feasibilityClosedAt }
        : {}),
      ...(payload.feasibilityClosedBy !== undefined
        ? { feasibility_closed_by: payload.feasibilityClosedBy }
        : {}),
      ...(payload.isRespondedOnTime !== undefined
        ? { is_responded_on_time: payload.isRespondedOnTime }
        : {}),
      ...(payload.marketingDecision !== undefined
        ? { marketing_decision: payload.marketingDecision }
        : {}),
      ...(payload.marketingDecisionBy !== undefined
        ? { marketing_decision_by: payload.marketingDecisionBy }
        : {}),
      ...(payload.marketingDecisionAt !== undefined
        ? { marketing_decision_at: payload.marketingDecisionAt }
        : {}),
      ...(payload.marketingDecisionRemark !== undefined
        ? { marketing_decision_remark: payload.marketingDecisionRemark }
        : {}),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || `Failed to update feasibility request: ${response.statusText}`);
  }

  return mapFeasibilityRequestToSampleRequest(mapFeasibilityResponse(await response.json()));
}

export async function recordFeasibilitySampVerdictApi(
  id: number | string,
  payload: {
    response: "Yes" | "No" | "Maybe";
    remark?: string | null;
    approved_by?: string | null;
  },
): Promise<SampleRequestItem> {
  const rawId = String(id).replace(/^feasibility-/, "");
  const response = await fetch(`${API_BASE_URL}/api/v1/feasibility-requests/${Number(rawId)}/samp-verdict`, {
    method: "PUT",
    headers: createApiHeaders({ json: true }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail?.[0]?.msg || error?.detail || `Failed to record lab verdict: ${response.statusText}`);
  }

  return mapFeasibilityRequestToSampleRequest(mapFeasibilityResponse(await response.json()));
}

export async function recordFeasibilityMarketingDecisionApi(
  id: number | string,
  payload: {
    decision: "Accepted" | "Rejected";
    decision_remark?: string | null;
    decision_by?: string | null;
  },
): Promise<SampleRequestItem> {
  const rawId = String(id).replace(/^feasibility-/, "");
  const response = await fetch(`${API_BASE_URL}/api/v1/feasibility-requests/${Number(rawId)}/marketing-decision`, {
    method: "POST",
    headers: createApiHeaders({ json: true }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || `Failed to record marketing decision: ${response.statusText}`);
  }

  return mapFeasibilityRequestToSampleRequest(mapFeasibilityResponse(await response.json()));
}

export async function recordFeasibilityViewedApi(
  id: number | string,
  viewerName: string,
  department = "SAMP Lab",
): Promise<void> {
  try {
    const rawId = String(id).replace(/^feasibility-/, "");
    await fetch(`${API_BASE_URL}/api/v1/feasibility-requests/${Number(rawId)}/viewed`, {
      method: "POST",
      headers: createApiHeaders({ json: true }),
      body: JSON.stringify({ viewer_name: viewerName, department }),
    });
  } catch (err) {
    console.debug("Telemetry view tracking skipped:", err);
  }
}

export function mapProgramMaterial(item: Record<string, unknown>): ProgramMaterialItem {
  return {
    id: item.id != null ? Number(item.id) : undefined,
    materialType: typeof item.material_type === "string" ? item.material_type : undefined,
    supplierName: typeof item.supplier_name === "string" ? item.supplier_name : undefined,
    grade: typeof item.grade === "string" ? item.grade : undefined,
    colorVariant: typeof item.color_variant === "string" ? item.color_variant : undefined,
    caliperWt: typeof item.caliper_wt === "string" ? item.caliper_wt : undefined,
    quantity: item.quantity != null ? String(item.quantity) : undefined,
    unit: typeof item.unit === "string" && item.unit ? item.unit : undefined,
    remark: typeof item.remark === "string" ? item.remark : undefined,
    sampRemark: typeof item.samp_remark === "string" ? item.samp_remark : undefined,
    createdAt: typeof item.created_at === "string" ? item.created_at : undefined,
    updatedAt: typeof item.updated_at === "string" ? item.updated_at : undefined,
  };
}

export function mapProgramResponse(item: Record<string, unknown>): ProgramRequestRecord {
  const rawMaterials = Array.isArray(item.materials) ? item.materials : [];
  return {
    id: Number(item.id),
    requestCode: String(item.request_code || ""),
    srNumber: String(item.sr_number || ""),
    customerName: String(item.customer_name || ""),
    targetPlant: String(item.target_plant || ""),
    programCampaignTitle: String(item.program_campaign_title || ""),
    programYear: String(item.program_year || "2026-2027"),
    status: String(item.status || "Pending SAMP Review"),
    createdBy: typeof item.created_by === "string" ? item.created_by : null,
    createdAt: String(item.created_at || ""),
    updatedAt: String(item.updated_at || ""),
    materials: rawMaterials.map((m: any) => mapProgramMaterial(m)),
  };
}

export function mapProgramRequestToSampleRequest(record: ProgramRequestRecord): SampleRequestItem {
  const createdDate = record.createdAt ? record.createdAt.split("T")[0] : "";
  const matrixSummary =
    record.materials.length > 0
      ? "\n\nMaterial Specification Matrix:\n" +
        record.materials
          .map(
            (r, i) =>
              `#${i + 1} | Type: ${r.materialType || "—"} | Supplier: ${r.supplierName || "—"} | Grade: ${r.grade || "—"} | Color: ${r.colorVariant || "—"} | Caliper: ${r.caliperWt || "—"} | Qty: ${r.quantity || "—"} | Unit: ${r.unit || "—"} | Remark: ${r.remark || "—"}${r.sampRemark ? ` | SAMP Remark: ${r.sampRemark}` : ""}`
          )
          .join("\n")
      : "";

  return {
    id: `program-${record.id}`,
    srNumber: record.srNumber,
    materialCode: record.requestCode,
    customer: record.customerName,
    targetPlant: record.targetPlant,
    productDescription: `[Seasonal Program: ${record.programCampaignTitle}]\nProgram Year: ${record.programYear}\nTarget Plant: ${record.targetPlant}${matrixSummary}`,
    year: record.programYear,
    programYear: record.programYear,
    programName: record.programCampaignTitle,
    programCampaignTitle: record.programCampaignTitle,
    programMaterials: record.materials,
    status: record.status,
    createdBy: record.createdBy || "Marketing Team",
    dateRequestCreated: createdDate,
    createdAt: record.createdAt,
    creationMode: "program_planning",
    requestKind: "program",
    requestTypes: ["sample", "costing", "design"] as any,
  };
}

export async function fetchProgramRequestsApi(): Promise<SampleRequestItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/program-requests`, {
    headers: createApiHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to fetch program requests: ${response.statusText}`);
  const data = (await response.json()) as Record<string, unknown>[];
  return data.map((item) => mapProgramRequestToSampleRequest(mapProgramResponse(item)));
}

export async function createProgramRequestApi(
  payload: CreateProgramRequestPayload
): Promise<ProgramRequestRecord> {
  const response = await fetch(`${API_BASE_URL}/api/v1/program-requests`, {
    method: "POST",
    headers: createApiHeaders({ json: true }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || `Failed to create program request: ${response.statusText}`);
  }
  return mapProgramResponse(await response.json());
}

export async function updateSingleMaterialSampRemarkApi(
  requestId: number | string,
  materialId: number | string,
  sampRemark: string
): Promise<ProgramRequestRecord> {
  const cleanId = String(requestId).replace(/^program-/, "");
  const response = await fetch(
    `${API_BASE_URL}/api/v1/program-requests/${cleanId}/materials/${materialId}/samp-remark`,
    {
      method: "PATCH",
      headers: createApiHeaders({ json: true }),
      body: JSON.stringify({ samp_remark: sampRemark }),
    }
  );
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || `Failed to update SAMP remark: ${response.statusText}`);
  }
  return mapProgramResponse(await response.json());
}

export async function updateBatchProgramSampRemarksApi(
  requestId: number | string,
  remarks: Array<{ material_id: number; samp_remark: string }>
): Promise<ProgramRequestRecord> {
  const cleanId = String(requestId).replace(/^program-/, "");
  const response = await fetch(
    `${API_BASE_URL}/api/v1/program-requests/${cleanId}/samp-remarks`,
    {
      method: "PUT",
      headers: createApiHeaders({ json: true }),
      body: JSON.stringify({ remarks }),
    }
  );
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || `Failed to update SAMP remarks: ${response.statusText}`);
  }
  return mapProgramResponse(await response.json());
}

export async function addProgramMaterialApi(
  requestId: number | string,
  payload: AddProgramMaterialPayload
): Promise<ProgramRequestRecord> {
  const cleanId = String(requestId).replace(/^program-/, "");
  const response = await fetch(
    `${API_BASE_URL}/api/v1/program-requests/${cleanId}/materials`,
    {
      method: "POST",
      headers: createApiHeaders({ json: true }),
      body: JSON.stringify(payload),
    }
  );
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || `Failed to add material: ${response.statusText}`);
  }
  return mapProgramResponse(await response.json());
}

export async function deleteProgramMaterialApi(
  requestId: number | string,
  materialId: number | string
): Promise<ProgramRequestRecord> {
  const cleanId = String(requestId).replace(/^program-/, "");
  const response = await fetch(
    `${API_BASE_URL}/api/v1/program-requests/${cleanId}/materials/${materialId}`,
    {
      method: "DELETE",
      headers: createApiHeaders(),
    }
  );
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || `Failed to delete material: ${response.statusText}`);
  }
  return mapProgramResponse(await response.json());
}

export async function fetchSampleRequestsApi(): Promise<SampleRequestItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/sample-requests`, { headers: createApiHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to fetch sample requests: ${res.statusText}`);
    }
    const data = await res.json();
    return data.map((item: ApiSampleRequest) => mapSampleRequest(item));
  } catch (err) {
    console.error("Error fetching sample requests:", err);
    return [];
  }
}

/**
 * Fetches all marketing intake requests across the persisted workflow types.
 */
export async function fetchAllMarketingRequestsApi(): Promise<SampleRequestItem[]> {
  try {
    const [sampleRequests, designRequests, feasibilityRequests, programRequests] =
      await Promise.all([
        fetchSampleRequestsApi(),
        fetchDesignRequestsApi().catch(() => []),
        fetchFeasibilityRequestsApi().catch(() => []),
        fetchProgramRequestsApi().catch(() => []),
      ]);
    const mappedDesignRequests = designRequests
      .map(mapDesignRequestToSampleRequest)
      .filter(
        (dr) =>
          !sampleRequests.some(
            (sr) =>
              (dr.materialCode && sr.materialCode && dr.materialCode === sr.materialCode) ||
              (dr.customer && sr.customer === dr.customer && dr.productDescription === sr.productDescription)
          )
      );

    return [
      ...sampleRequests,
      ...mappedDesignRequests,
      ...feasibilityRequests,
      ...programRequests,
    ].sort((a, b) => {
      const da = new Date(a.createdAt || a.dateRequestCreated || 0).getTime();
      const db = new Date(b.createdAt || b.dateRequestCreated || 0).getTime();
      return db - da;
    });
  } catch (err) {
    console.error("Error fetching all marketing requests:", err);
    return [];
  }
}

export async function createSampleRequestApi(form: CreateSampleRequestForm): Promise<SampleRequestItem | null> {
  try {
    const rawYear = form.programYear || "2026";
    const selectedYear = String(rawYear).replace(/BTS/gi, "").trim() || "2026";
    const payload = {
      sr_number: (form as any).srNumber || (form as any).sr_number || undefined,
      year: form.year || "2026-2027",
      program_year: selectedYear,
      program_name: form.programName ? form.programName.trim() : null,
      product_description: form.productDescription || form.programName || "Standard Notebook Specification",
      customer: form.customer || "",
      target_plant: form.targetPlant || null,
      date_request_created: form.dateRequestCreated || new Date().toISOString().split("T")[0],
      created_by: form.createdBy || "Admin",
      material_code: form.materialCode || "",
      barcode: form.barcode || null,
      customer_product_code: form.customerProductCode || null,
      source_sample_code: form.sourceSampleCode || null,
      sample_required_date: form.sampleRequiredDate || null,
      product_type: form.productType || null,
      brand_name: form.brandName || null,
      product_type_navneet: form.productTypeNavneet || null,
      product_type_new_customer: form.productTypeNewCustomer || null,
      unit_pc_pack: form.unitPcPack != null ? String(form.unitPcPack) : null,
      qty_for_sampling: form.qtyForSampling != null ? String(form.qtyForSampling) : null,
      qty_design_costing: form.qtyDesignCosting != null ? String(form.qtyDesignCosting) : null,
      mockup_required: form.mockupRequired || null,
      designs_customer_creative: form.designsCustomerCreative || null,
      product_artwork_nos: form.productArtworkNos != null ? String(form.productArtworkNos) : null,
      product_image_path: form.productImagePath || null,
      target_artwork_date_creative: form.targetArtworkDateCreative || null,
      target_artwork_date_studio: form.targetArtworkDateStudio || null,
      creation_mode: form.creationMode || "marketing_request",
      request_types: form.requestTypes || [],
      request_type_selected_at: form.requestTypeSelectedAt || {},
      custom_binding_1: form.customBinding1 || null,
      custom_binding_2: form.customBinding2 || null,
      custom_details: form.customDetails || null,
      status: form.status || "Draft (Pre-SMT)",
      source_sample_request_id: form.sourceRequestId,
      reference_images: form.referenceImages || [],
      reference_links: form.referenceLinks || [],
      plant_feasibility_response: form.plantFeasibilityResponse || null,
      plant_feasibility_remark: form.plantFeasibilityRemark || null,
      sampling_feasibility_response: form.samplingFeasibilityResponse || null,
      sampling_feasibility_remark: form.samplingFeasibilityRemark || null,
    };

    const res = await fetch(`${API_BASE_URL}/api/v1/sample-requests`, {
      method: "POST",
      headers: createApiHeaders({ json: true }),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to create sample request: ${res.statusText}`);
    }

    const resJson = await res.json();
    const itemData = resJson?.data && typeof resJson.data === "object" ? resJson.data : resJson;
    return mapSampleRequest(itemData, new Date().toISOString().split("T")[0]);
  } catch (err) {
    console.error("Error creating sample request:", err);
    return null;
  }
}

export async function createSampleRequestBatchApi(
  payload: BatchCreateSampleRequestPayload
): Promise<BatchCreateSampleRequestResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/sample-requests/batch`, {
      method: "POST",
      headers: createApiHeaders({ json: true }),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || `Failed to create batch sample requests: ${res.statusText}`);
    }

    const data = await res.json();
    const fallbackDate = new Date().toISOString().split("T")[0];
    const mappedRequests: SampleRequestItem[] = (data.requests || []).map(
      (item: ApiSampleRequest) => mapSampleRequest(item, fallbackDate),
    );

    return {
      success: true,
      message: data.message,
      total_created: data.total_created,
      requests: mappedRequests,
    };
  } catch (err) {
    console.error("Error creating sample requests batch:", err);
    throw err;
  }
}


export interface UpdateSampleRequestPayload extends Partial<CreateSampleRequestForm> {
  status?: string;
  samplingFeasibilityResponse?: "Yes" | "No" | "Maybe" | null;
  samplingFeasibilityRemark?: string | null;
  plantFeasibilityResponse?: "Yes" | "No" | "Maybe" | null;
  plantFeasibilityRemark?: string | null;
  feasibilityClosedAt?: string | null;
  feasibilityClosedBy?: "plant" | "sampling" | null;
  sampling_feasibility_response?: string | null;
  sampling_feasibility_remark?: string | null;
  plant_feasibility_response?: string | null;
  plant_feasibility_remark?: string | null;
  feasibility_closed_at?: string | null;
  feasibility_closed_by?: string | null;
  product_description?: string;
}

export async function updateSampleRequestApi(
  id: number | string,
  payload: UpdateSampleRequestPayload
): Promise<SampleRequestItem | null> {
  try {
    const rawYear = payload.programYear;
    const selectedYear = rawYear ? String(rawYear).replace(/BTS/gi, "").trim() : undefined;
    const bodyPayload = {
      material_code: payload.materialCode,
      product_description: payload.productDescription,
      customer: payload.customer,
      program_name: payload.programName,
      program_year: selectedYear,
      target_plant: payload.targetPlant,
      barcode: payload.barcode,
      customer_product_code: payload.customerProductCode,
      sample_required_date: payload.sampleRequiredDate || null,
      brand_name: payload.brandName,
      product_type: payload.productType,
      unit_pc_pack: payload.unitPcPack != null ? String(payload.unitPcPack) : undefined,
      qty_for_sampling: payload.qtyForSampling != null ? String(payload.qtyForSampling) : undefined,
      qty_design_costing: payload.qtyDesignCosting != null ? String(payload.qtyDesignCosting) : undefined,
      mockup_required: payload.mockupRequired,
      designs_customer_creative: payload.designsCustomerCreative,
      product_artwork_nos: payload.productArtworkNos != null ? String(payload.productArtworkNos) : undefined,
      product_image_path: payload.productImagePath,
      creation_mode: payload.creationMode,
      request_types: payload.requestTypes,
      source_sample_code: payload.sourceSampleCode,
      status: payload.status,
      plant_feasibility_response: (payload as any).plantFeasibilityResponse ?? (payload as any).plant_feasibility_response,
      plant_feasibility_remark: (payload as any).plantFeasibilityRemark ?? (payload as any).plant_feasibility_remark,
      sampling_feasibility_response: (payload as any).samplingFeasibilityResponse ?? (payload as any).sampling_feasibility_response,
      sampling_feasibility_remark: (payload as any).samplingFeasibilityRemark ?? (payload as any).sampling_feasibility_remark,
      feasibility_closed_at: (payload as any).feasibilityClosedAt ?? (payload as any).feasibility_closed_at,
      feasibility_closed_by: (payload as any).feasibilityClosedBy ?? (payload as any).feasibility_closed_by,
    };

    const res = await fetch(`${API_BASE_URL}/api/v1/sample-requests/${id}`, {
      method: "PUT",
      headers: createApiHeaders({ json: true }),
      body: JSON.stringify(bodyPayload),
    });

    if (!res.ok) {
      throw new Error(`Failed to update sample request: ${res.statusText}`);
    }

    const data: ApiSampleRequest = await res.json();
    return mapSampleRequest(data, new Date().toISOString().split("T")[0]);
  } catch (err) {
    console.error(`Error updating sample request ${id}:`, err);
    throw err;
  }
}

export async function batchUpdateStatusApi(
  ids: (number | string)[],
  status: string
): Promise<{ success: boolean; updatedCount: number }> {
  try {
    const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
    const res = await fetch(`${API_BASE_URL}/api/v1/sample-requests/batch-status`, {
      method: "POST",
      headers: createApiHeaders({ json: true }),
      body: JSON.stringify({
        sample_request_ids: numericIds,
        status,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to batch update status: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      success: data.success,
      updatedCount: data.updated_count,
    };
  } catch (err) {
    console.error("Error batch updating status:", err);
    throw err;
  }
}

export async function deleteProgramRequestApi(requestId: number | string): Promise<boolean> {
  const cleanId = String(requestId).replace(/^program-/, "");
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/program-requests/${cleanId}`, {
      method: "DELETE",
      headers: createApiHeaders(),
    });
    return res.ok || res.status === 204;
  } catch (err) {
    console.error("Error deleting program request from DB:", err);
    return false;
  }
}

export async function deleteFeasibilityRequestApi(requestId: number | string): Promise<boolean> {
  const cleanId = String(requestId).replace(/^feasibility-/, "");
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/feasibility-requests/${cleanId}`, {
      method: "DELETE",
      headers: createApiHeaders(),
    });
    return res.ok || res.status === 204;
  } catch (err) {
    console.error("Error deleting feasibility request from DB:", err);
    return false;
  }
}

export async function deleteSampleRequestApi(id: number | string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/sample-requests/${id}`, {
      method: "DELETE",
      headers: createApiHeaders(),
    });
    return res.ok || res.status === 204;
  } catch (err) {
    console.error("Error deleting sample request:", err);
    return false;
  }
}

/**
 * Universal request deletion helper (used for testing and cleanup).
 * Automatically resolves whether the record is stored in program_requests,
 * feasibility_requests, or standard sample_requests and deletes it from DB.
 */
export async function deleteAnyRequestApi(
  request: SampleRequestItem | { id: string | number; requestKind?: string; creationMode?: string; srNumber?: string }
): Promise<boolean> {
  const idStr = String(request.id || "");
  const kind = (request as any).requestKind;
  const mode = (request as any).creationMode;

  if (idStr.startsWith("program-") || kind === "program" || mode === "program_planning") {
    return deleteProgramRequestApi(idStr);
  }

  if (idStr.startsWith("feasibility-") || kind === "feasibility" || mode === "feasibility_check") {
    return deleteFeasibilityRequestApi(idStr);
  }

  if (idStr.startsWith("design-") || kind === "design") {
    const rawId = idStr.replace(/^design-/, "");
    const numId = Number(rawId);
    if (!isNaN(numId)) {
      await deleteDesignRequestApi(numId).catch(() => false);
    }
    return deleteSampleRequestApi(request.id);
  }

  return deleteSampleRequestApi(request.id);
}

export async function batchDeleteSampleRequestsApi(ids: (number | string)[]): Promise<boolean> {
  try {
    const results = await Promise.all(ids.map((id) => deleteSampleRequestApi(id)));
    return results.every(Boolean);
  } catch (err) {
    console.error("Error batch deleting sample requests:", err);
    return false;
  }
}

export async function batchDeleteAnyRequestsApi(requests: SampleRequestItem[]): Promise<boolean> {
  try {
    const results = await Promise.all(requests.map((req) => deleteAnyRequestApi(req)));
    return results.every(Boolean);
  } catch (err) {
    console.error("Error batch deleting requests:", err);
    return false;
  }
}

export async function resetAllSampleCodesApi(): Promise<boolean> {
  try {
    await Promise.all([
      fetch(`${API_BASE_URL}/api/v1/program-requests/reset-sample-codes`, {
        method: "POST",
        headers: createApiHeaders(),
      }).catch(() => null),
      fetch(`${API_BASE_URL}/api/v1/feasibility-requests/reset-sample-codes`, {
        method: "POST",
        headers: createApiHeaders(),
      }).catch(() => null),
    ]);
    return true;
  } catch (err) {
    console.error("Failed to reset sample codes:", err);
    return false;
  }
}

export async function fetchPlantsApi(): Promise<PlantItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/plants`, { headers: createApiHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to fetch plants: ${res.statusText}`);
    }
    const data = await res.json();
    return data.map((p: any) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      location: p.location || undefined,
      isActive: p.is_active,
      createdBy: p.created_by,
      createdAt: p.created_at ? p.created_at.split("T")[0] : "",
      updatedAt: p.updated_at ? p.updated_at.split("T")[0] : "",
    }));
  } catch (err) {
    console.error("Error fetching plants from API:", err);
    return [];
  }
}

export async function createPlantApi(payload: CreatePlantForm, createdBy: string = "Admin"): Promise<PlantItem | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/plants`, {
      method: "POST",
      headers: createApiHeaders({ json: true }),
      body: JSON.stringify({
        code: payload.code,
        name: payload.name,
        location: payload.location,
        created_by: createdBy,
        is_active: payload.isActive ?? true,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || `Failed to create plant: ${res.statusText}`);
    }

    const p = await res.json();
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      location: p.location || undefined,
      isActive: p.is_active,
      createdBy: p.created_by,
      createdAt: p.created_at ? p.created_at.split("T")[0] : "",
      updatedAt: p.updated_at ? p.updated_at.split("T")[0] : "",
    };
  } catch (err) {
    console.error("Error adding plant:", err);
    throw err;
  }
}

export interface ProductDetailItem {
  id: number;
  sampleRequestId: number;
  className: string;
  characteristicName: string;
  value: string | null;
  uom: string | null;
  options: string[];
}

export interface ProductCharacteristicItem {
  id: number;
  class_name: string;
  characteristic_name: string;
  sequence: number;
  uom: string | null;
  options: string[];
  is_active: boolean;
}

const PRODUCT_CHARACTERISTICS_CACHE_TTL_MS = 5 * 60_000;
let productCharacteristicsCache:
  | { data: ProductCharacteristicItem[]; expiresAt: number }
  | null = null;
let productCharacteristicsRequest: Promise<ProductCharacteristicItem[]> | null = null;

function normalizeCharacteristics(data: ProductCharacteristicItem[]): ProductCharacteristicItem[] {
  return data.map((item) => ({
    ...item,
    options: Array.isArray(item.options) ? item.options : [],
  }));
}

function getCachedProductCharacteristics(): ProductCharacteristicItem[] | null {
  if (!productCharacteristicsCache || productCharacteristicsCache.expiresAt <= Date.now()) {
    return null;
  }
  return productCharacteristicsCache.data;
}

function sortProductClasses(classNames: string[]): string[] {
  return classNames.sort((a, b) => {
    const aIndex = PRODUCT_CLASS_ORDER.indexOf(a as typeof PRODUCT_CLASS_ORDER[number]);
    const bIndex = PRODUCT_CLASS_ORDER.indexOf(b as typeof PRODUCT_CLASS_ORDER[number]);
    return (aIndex === -1 ? PRODUCT_CLASS_ORDER.length : aIndex) - (bIndex === -1 ? PRODUCT_CLASS_ORDER.length : bIndex);
  });
}

async function fetchAllProductCharacteristics(): Promise<ProductCharacteristicItem[]> {
  const cached = getCachedProductCharacteristics();
  if (cached) return cached;
  if (productCharacteristicsRequest) return productCharacteristicsRequest;

  productCharacteristicsRequest = fetch(`${API_BASE_URL}/api/v1/product-characteristics`, {
    headers: createApiHeaders(),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`Failed to fetch product characteristics: ${res.statusText}`);
      const data = normalizeCharacteristics(await res.json());
      productCharacteristicsCache = {
        data,
        expiresAt: Date.now() + PRODUCT_CHARACTERISTICS_CACHE_TTL_MS,
      };
      return data;
    })
    .finally(() => {
      productCharacteristicsRequest = null;
    });

  return productCharacteristicsRequest;
}

function invalidateProductCharacteristicsCache(): void {
  productCharacteristicsCache = null;
  bindingHierarchyCache = null;
  bindingSearchCache.clear();
}

export async function fetchProductDetailsApi(
  sampleRequestId: number | string,
  excludeNa: boolean = false
): Promise<ProductDetailItem[]> {
  try {
    const url = `${API_BASE_URL}/api/v1/product-characteristics/details/${sampleRequestId}${excludeNa ? "?exclude_na=true" : ""}`;
    const [res, characteristics] = await Promise.all([
      fetch(url, { headers: createApiHeaders() }).catch(() => null),
      fetchAllProductCharacteristics(),
    ]);

    let data: any[] = [];
    if (res && res.ok) {
      try {
        data = await res.json();
      } catch {
        data = [];
      }
    }

    // Index saved details by "class_name::characteristic_name"
    const detailByCharKey = new Map<string, any>();
    if (Array.isArray(data)) {
      for (const d of data) {
        detailByCharKey.set(
          `${d.class_name}::${d.characteristic_name}`.toLowerCase(),
          d
        );
      }
    }

    // Collect the exact set of classes that are actually present in this product.
    // A class is present if it has at least one configured (non-NA) characteristic,
    // or if the record was explicitly saved for this product.
    const configuredClasses = new Set<string>();
    if (Array.isArray(data)) {
      for (const d of data) {
        const val = (d.value || "").toString().trim().toUpperCase();
        if (val && !["NA", "N/A", "NAN", "NULL", "NONE", "—", "-"].includes(val)) {
          if (d.class_name) {
            configuredClasses.add(d.class_name.toUpperCase());
          }
        }
      }
    }

    const presentClasses =
      configuredClasses.size > 0
        ? configuredClasses
        : new Set(
            (Array.isArray(data) ? data : [])
              .map((d: any) => (d.class_name || "").toUpperCase())
              .filter(Boolean)
          );

    // Only include characteristics for classes that are present in this product when excludeNa is true.
    // When excludeNa is false (editing or full view), return all master characteristics.
    const targetCharacteristics =
      excludeNa && presentClasses.size > 0
        ? characteristics.filter((c) => presentClasses.has(c.class_name.toUpperCase()))
        : characteristics;

    // Merge active master characteristics for present classes with saved detail values
    const mergedList: ProductDetailItem[] = targetCharacteristics.map((charItem, index) => {
      const key = `${charItem.class_name}::${charItem.characteristic_name}`.toLowerCase();
      const existing = detailByCharKey.get(key);
      if (existing) {
        return {
          id: existing.id,
          sampleRequestId: existing.sample_request_id ?? (Number(sampleRequestId) || 0),
          className: existing.class_name || charItem.class_name,
          characteristicName: existing.characteristic_name || charItem.characteristic_name,
          value: existing.value !== null && existing.value !== undefined ? String(existing.value) : "NA",
          uom: existing.uom || charItem.uom,
          options: Array.isArray(charItem.options) ? charItem.options : [],
        };
      }
      return {
        id: -1 - index,
        sampleRequestId: Number(sampleRequestId) || 0,
        className: charItem.class_name,
        characteristicName: charItem.characteristic_name,
        value: "NA",
        uom: charItem.uom,
        options: Array.isArray(charItem.options) ? charItem.options : [],
      };
    });

    // Include any custom or legacy rows from data that weren't in the standard master list
    const seenKeys = new Set(
      targetCharacteristics.map((c) => `${c.class_name}::${c.characteristic_name}`.toLowerCase())
    );
    if (Array.isArray(data)) {
      for (const d of data) {
        const key = `${d.class_name}::${d.characteristic_name}`.toLowerCase();
        const dVal = (d.value || "").toString().trim().toUpperCase();
        const isConfigured = dVal && !["NA", "N/A", "NAN", "NULL", "NONE", "—", "-"].includes(dVal);
        const isPresentClass = d.class_name && presentClasses.has(d.class_name.toUpperCase());
        if (!seenKeys.has(key) && (isPresentClass || isConfigured)) {
          mergedList.push({
            id: d.id,
            sampleRequestId: d.sample_request_id ?? (Number(sampleRequestId) || 0),
            className: d.class_name,
            characteristicName: d.characteristic_name,
            value: d.value !== null && d.value !== undefined ? String(d.value) : "NA",
            uom: d.uom,
            options: [],
          });
        }
      }
    }

    // Sort by canonical class order, then sequence, then characteristic name
    const sequenceByKey = new Map(
      characteristics.map((item) => [
        `${item.class_name}::${item.characteristic_name}`.toLowerCase(),
        item.sequence,
      ])
    );

    mergedList.sort((a, b) => {
      const aClass = PRODUCT_CLASS_ORDER.indexOf(a.className as typeof PRODUCT_CLASS_ORDER[number]);
      const bClass = PRODUCT_CLASS_ORDER.indexOf(b.className as typeof PRODUCT_CLASS_ORDER[number]);
      const classSort =
        (aClass === -1 ? PRODUCT_CLASS_ORDER.length : aClass) -
        (bClass === -1 ? PRODUCT_CLASS_ORDER.length : bClass);
      if (classSort !== 0) return classSort;
      const aSequence =
        sequenceByKey.get(`${a.className}::${a.characteristicName}`.toLowerCase()) ??
        Number.MAX_SAFE_INTEGER;
      const bSequence =
        sequenceByKey.get(`${b.className}::${b.characteristicName}`.toLowerCase()) ??
        Number.MAX_SAFE_INTEGER;
      return (
        aSequence - bSequence ||
        String(a.characteristicName).localeCompare(String(b.characteristicName))
      );
    });

    if (excludeNa) {
      return mergedList.filter((item) => {
        const v = (item.value || "").trim().toUpperCase();
        return v && !["NA", "N/A", "NAN", "NULL", "NONE", "—", "-"].includes(v);
      });
    }

    return mergedList;
  } catch (err) {
    console.error("Error fetching product details:", err);
    return [];
  }
}

export async function saveProductDetailsApi(
  sampleRequestId: number,
  details: { className: string; characteristicName: string; value: string | null; uom?: string | null }[]
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/product-characteristics/details`, {
      method: "POST",
      headers: createApiHeaders({ json: true }),
      body: JSON.stringify({
        sample_request_id: sampleRequestId,
        details: details.map((d) => ({
          class_name: d.className,
          characteristic_name: d.characteristicName,
          value: d.value && d.value.trim() ? d.value.trim() : null,
          uom: d.uom || null,
        })),
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to save product details:", err);
    return false;
  }
}

export async function fetchCustomersApi(search?: string): Promise<CustomerItem[]> {
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await fetch(`${API_BASE_URL}/api/v1/customers${query}`, { headers: createApiHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to fetch customers: ${res.statusText}`);
    }
    const data = await res.json();
    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      country: c.country,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
  } catch (err) {
    console.error("Error fetching customers:", err);
    return [];
  }
}

export async function createCustomerApi(payload: {
  name: string;
  country?: string;
}): Promise<CustomerItem | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/customers`, {
      method: "POST",
      headers: createApiHeaders({ json: true }),
      body: JSON.stringify({
        name: payload.name,
        country: payload.country,
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to create customer: ${res.statusText}`);
    }
    const c = await res.json();
    return {
      id: c.id,
      name: c.name,
      country: c.country,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    };
  } catch (err) {
    console.error("Error creating customer:", err);
    return null;
  }
}

export async function fetchBindingHierarchyApi(): Promise<BindingHierarchyResponse> {
  if (bindingHierarchyCache && bindingHierarchyCache.expiresAt > Date.now()) {
    return bindingHierarchyCache.data;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/product-characteristics/binding-hierarchy`, { headers: createApiHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to fetch binding hierarchy: ${res.statusText}`);
    }
    const data = await res.json();
    bindingHierarchyCache = { data, expiresAt: Date.now() + BINDING_CACHE_TTL_MS };
    return data;
  } catch (err) {
    console.error("Error fetching binding hierarchy:", err);
    return { binding1_options: [], hierarchy: {} };
  }
}

export async function fetchProductClassesApi(): Promise<string[]> {
  try {
    const cached = getCachedProductCharacteristics();
    if (cached) {
      return sortProductClasses([...new Set(cached.map((item) => item.class_name))]);
    }
    const res = await fetch(`${API_BASE_URL}/api/v1/product-characteristics/classes`, { headers: createApiHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    const classNames = data.map((item: { class_name?: string }) => item.class_name).filter(Boolean) as string[];
    return sortProductClasses(classNames);
  } catch {
    return [];
  }
}

export async function fetchCharacteristicsByClassApi(className: string): Promise<ProductCharacteristicItem[]> {
  try {
    const cached = getCachedProductCharacteristics();
    if (cached) return cached.filter((item) => item.class_name === className);
    const res = await fetch(`${API_BASE_URL}/api/v1/product-characteristics?class_name=${encodeURIComponent(className)}`, { headers: createApiHeaders() });
    if (!res.ok) return [];
    return normalizeCharacteristics(await res.json());
  } catch {
    return [];
  }
}

export async function createProductCharacteristicApi(
  payload: Omit<ProductCharacteristicItem, "id" | "is_active"> & { is_active?: boolean },
): Promise<ProductCharacteristicItem> {
  const res = await fetch(`${API_BASE_URL}/api/v1/product-characteristics`, {
    method: "POST",
    headers: createApiHeaders({ json: true }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to create characteristic: ${res.statusText}`);
  }
  const characteristic = await res.json();
  invalidateProductCharacteristicsCache();
  return characteristic;
}

export async function updateProductCharacteristicApi(
  id: number,
  payload: Partial<Omit<ProductCharacteristicItem, "id">>,
): Promise<ProductCharacteristicItem> {
  const res = await fetch(`${API_BASE_URL}/api/v1/product-characteristics/${id}`, {
    method: "PATCH",
    headers: createApiHeaders({ json: true }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to update characteristic: ${res.statusText}`);
  }
  const characteristic = await res.json();
  invalidateProductCharacteristicsCache();
  return characteristic;
}

export async function addCharacteristicOptionApi(
  id: number,
  option: string,
): Promise<ProductCharacteristicItem> {
  const res = await fetch(`${API_BASE_URL}/api/v1/product-characteristics/${id}/options`, {
    method: "POST",
    headers: createApiHeaders({ json: true }),
    body: JSON.stringify({ option }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to add characteristic option: ${res.statusText}`);
  }
  const characteristic = await res.json();
  invalidateProductCharacteristicsCache();
  return characteristic;
}

export async function searchProductsByMaterialApi(code: string): Promise<ProductSearchResult[]> {
  try {
    if (!code || !code.trim()) return [];
    const res = await fetch(`${API_BASE_URL}/api/v1/sample-requests/search-material?code=${encodeURIComponent(code.trim())}`, { headers: createApiHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Error searching product by material:", err);
    return [];
  }
}

export async function searchProductsByBindingApi(
  b1: string,
  b2?: string,
  c1Caliper?: string,
  c2Material?: string,
  c2Finish?: string,
): Promise<ProductSearchResult[]> {
  try {
    if (!b1 || !b1.trim()) return [];
    const cacheKey = `${b1.trim().toLowerCase()}::${(b2 || "").trim().toLowerCase()}::${(c1Caliper || "").trim().toLowerCase()}::${(c2Material || "").trim().toLowerCase()}::${(c2Finish || "").trim().toLowerCase()}`;
    const cached = bindingSearchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.results;

    let url = `${API_BASE_URL}/api/v1/product-characteristics/filter-by-binding?b1=${encodeURIComponent(b1.trim())}`;
    if (b2 && b2.trim()) {
      url += `&b2=${encodeURIComponent(b2.trim())}`;
    }
    if (c1Caliper && c1Caliper.trim()) {
      url += `&c1_caliper=${encodeURIComponent(c1Caliper.trim())}`;
    }
    if (c2Material && c2Material.trim()) {
      url += `&c2_material=${encodeURIComponent(c2Material.trim())}`;
    }
    if (c2Finish && c2Finish.trim()) {
      url += `&c2_finish=${encodeURIComponent(c2Finish.trim())}`;
    }
    const res = await fetch(url, { headers: createApiHeaders() });
    if (!res.ok) return [];
    const results = await res.json();
    bindingSearchCache.set(cacheKey, { results, expiresAt: Date.now() + BINDING_CACHE_TTL_MS });
    return results;
  } catch (err) {
    console.error("Error filtering products by binding:", err);
    return [];
  }
}

// ==========================================
// CROSS-DESK DOWNSTREAM TASK APIS
// ==========================================

export async function fetchStudioDielinesApi(): Promise<DielineItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/studio/dielines`, {
      headers: createApiHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch studio dielines");
    return (await res.json()) as DielineItem[];
  } catch (err) {
    console.error("fetchStudioDielinesApi error:", err);
    return [];
  }
}

export async function updateStudioDielineApi(id: string, payload: Partial<DielineItem>): Promise<DielineItem | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/studio/dielines/${id}`, {
      method: "PATCH",
      headers: createApiHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update studio dieline");
    return (await res.json()) as DielineItem;
  } catch (err) {
    console.error("updateStudioDielineApi error:", err);
    return null;
  }
}

export async function fetchCreativeBriefsApi(): Promise<CreativeBriefItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/creative/briefs`, {
      headers: createApiHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch creative briefs");
    return (await res.json()) as CreativeBriefItem[];
  } catch (err) {
    console.error("fetchCreativeBriefsApi error:", err);
    return [];
  }
}

export async function updateCreativeBriefApi(id: string, payload: Partial<CreativeBriefItem>): Promise<CreativeBriefItem | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/creative/briefs/${id}`, {
      method: "PATCH",
      headers: createApiHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update creative brief");
    return (await res.json()) as CreativeBriefItem;
  } catch (err) {
    console.error("updateCreativeBriefApi error:", err);
    return null;
  }
}

export async function fetchCostingEstimationsApi(): Promise<CostingItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/costing/estimations`, {
      headers: createApiHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch costing estimations");
    return (await res.json()) as CostingItem[];
  } catch (err) {
    console.error("fetchCostingEstimationsApi error:", err);
    return [];
  }
}

export async function updateCostingEstimationApi(id: string, payload: Partial<CostingItem>): Promise<CostingItem | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/costing/estimations/${id}`, {
      method: "PATCH",
      headers: createApiHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update costing estimation");
    return (await res.json()) as CostingItem;
  } catch (err) {
    console.error("updateCostingEstimationApi error:", err);
    return null;
  }
}

