import { apiFetch } from "./client";
import {
  SampleRequestItem,
  ProgramMaterialItem,
  ProgramRequestRecord,
  ProgramActivityItem,
  CreateProgramRequestPayload,
  AddProgramMaterialPayload,
} from "@/features/sample-requests/types";
import { getBusinessYearForDate } from "@/lib/businessYear";

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

export function mapProgramActivity(item: Record<string, unknown>): ProgramActivityItem {
  return {
    id: Number(item.id),
    programRequestId: Number(item.program_request_id),
    actorId: item.actor_id != null ? Number(item.actor_id) : undefined,
    actorName: String(item.actor_name || "System Operator"),
    actorDepartment: String(item.actor_department || "System"),
    action: String(item.action || "LOG"),
    payload: (typeof item.payload === "object" && item.payload !== null ? item.payload : {}) as Record<string, any>,
    createdAt: String(item.created_at || ""),
  };
}

export function mapProgramResponse(item: Record<string, unknown>): ProgramRequestRecord {
  const rawMaterials = Array.isArray(item.materials) ? item.materials : [];
  const rawActivities = Array.isArray(item.activities) ? item.activities : [];
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
    activities: rawActivities.map((a: any) => mapProgramActivity(a)),
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
    year: record.programYear && String(record.programYear).includes("-") ? String(record.programYear) : getBusinessYearForDate(createdDate),
    programYear: record.programYear,
    programName: record.programCampaignTitle,
    programCampaignTitle: record.programCampaignTitle,
    programMaterials: record.materials,
    activities: record.activities || [],
    status: record.status,
    createdBy: record.createdBy || "Marketing Team",
    dateRequestCreated: createdDate,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    creationMode: "program_planning",
    requestKind: "program",
    requestTypes: ["sample", "costing", "design"] as any,
  };
}

export async function fetchProgramRequestsApi(): Promise<SampleRequestItem[]> {
  const data = await apiFetch<Record<string, unknown>[]>("/api/v1/program-requests");
  return data.map((item) => mapProgramRequestToSampleRequest(mapProgramResponse(item)));
}

export async function createProgramRequestApi(
  payload: CreateProgramRequestPayload
): Promise<ProgramRequestRecord> {
  const data = await apiFetch<Record<string, unknown>>("/api/v1/program-requests", {
    method: "POST",
    jsonBody: payload,
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("samp:requests-changed"));
  }
  return mapProgramResponse(data);
}

export async function addProgramNoteApi(
  requestId: number | string,
  note: string
): Promise<ProgramRequestRecord> {
  const cleanId = String(requestId).replace(/^program-/, "");
  const data = await apiFetch<Record<string, unknown>>(
    `/api/v1/program-requests/${cleanId}/notes`,
    {
      method: "POST",
      jsonBody: { note },
    }
  );
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("samp:requests-changed"));
  }
  return mapProgramResponse(data);
}

export async function updateSingleMaterialSampRemarkApi(
  requestId: number | string,
  materialId: number | string,
  sampRemark: string
): Promise<ProgramRequestRecord> {
  const cleanId = String(requestId).replace(/^program-/, "");
  const data = await apiFetch<Record<string, unknown>>(
    `/api/v1/program-requests/${cleanId}/materials/${materialId}/samp-remark`,
    {
      method: "PATCH",
      jsonBody: { samp_remark: sampRemark },
    }
  );
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("samp:requests-changed"));
  }
  return mapProgramResponse(data);
}

export async function updateBatchProgramSampRemarksApi(
  requestId: number | string,
  remarks: Array<{ material_id: number; samp_remark: string }>
): Promise<ProgramRequestRecord> {
  const cleanId = String(requestId).replace(/^program-/, "");
  const data = await apiFetch<Record<string, unknown>>(
    `/api/v1/program-requests/${cleanId}/samp-remarks`,
    {
      method: "PUT",
      jsonBody: { remarks },
    }
  );
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("samp:requests-changed"));
  }
  return mapProgramResponse(data);
}

export async function addProgramMaterialApi(
  requestId: number | string,
  payload: AddProgramMaterialPayload
): Promise<ProgramRequestRecord> {
  const cleanId = String(requestId).replace(/^program-/, "");
  const data = await apiFetch<Record<string, unknown>>(
    `/api/v1/program-requests/${cleanId}/materials`,
    {
      method: "POST",
      jsonBody: payload,
    }
  );
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("samp:requests-changed"));
  }
  return mapProgramResponse(data);
}

export async function deleteProgramMaterialApi(
  requestId: number | string,
  materialId: number | string
): Promise<ProgramRequestRecord> {
  const cleanId = String(requestId).replace(/^program-/, "");
  const data = await apiFetch<Record<string, unknown>>(
    `/api/v1/program-requests/${cleanId}/materials/${materialId}`,
    {
      method: "DELETE",
    }
  );
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("samp:requests-changed"));
  }
  return mapProgramResponse(data);
}

export async function deleteProgramRequestApi(requestId: number | string): Promise<boolean> {
  const cleanId = String(requestId).replace(/^program-/, "");
  try {
    await apiFetch(`/api/v1/program-requests/${cleanId}`, { method: "DELETE" });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("samp:requests-changed"));
    }
    return true;
  } catch (err) {
    console.error("Error deleting program request from DB:", err);
    return false;
  }
}

export async function updateProgramRequestStatusApi(
  requestId: number | string,
  status: string
): Promise<ProgramRequestRecord> {
  const cleanId = String(requestId).replace(/^program-/, "");
  const data = await apiFetch<Record<string, unknown>>(
    `/api/v1/program-requests/${cleanId}`,
    {
      method: "PUT",
      jsonBody: { status },
    }
  );
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("samp:requests-changed"));
  }
  return mapProgramResponse(data);
}
