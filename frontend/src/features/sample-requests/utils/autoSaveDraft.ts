import { StagedProductItem } from "../components/ProductStagingWorkspace";
import {
  createSampleRequestApi,
  createDesignRequestApi,
  updateSampleRequestApi,
} from "../api";
import { CreateSampleRequestForm } from "../types";
import { API_BASE_URL, createApiHeaders } from "@/lib/api";
import { UserProfile } from "@/features/auth";
import { getBusinessYearForDate } from "@/lib/businessYear";

export interface ProgramContextData {
  customer?: string;
  programName?: string;
  programYear?: string;
  year?: string;
  targetPlant?: string;
  parentRequestId?: string | number;
  parentSrNumber?: string;
}

export interface AutoSaveResult {
  success: boolean;
  count: number;
  customer: string;
  programName: string;
  requestId?: string | number;
  srNumber?: string;
}

/**
 * Automatically persists staged products directly into the Draft queue (status: "Draft (Pre-SMT)").
 * Uses the atomic batch endpoint if available, with resilient fallback to individual creation.
 */
export async function autoSaveStagedProductsToDraft(
  items: StagedProductItem[],
  programContext?: ProgramContextData | null,
  user?: UserProfile | null
): Promise<AutoSaveResult> {
  if (!items || items.length === 0) {
    return { success: false, count: 0, customer: "", programName: "" };
  }

  const customer = programContext?.customer?.trim() || "General Customer";
  const programName = programContext?.programName?.trim() || "Marketing Intake Program";
  const rawYear = programContext?.programYear || "2026";
  const programYear = String(rawYear).replace(/BTS/gi, "").trim() || "2026";
  const dateStr = new Date().toISOString().split("T")[0];
  const year = (programContext?.year && programContext.year.includes("-"))
    ? programContext.year
    : getBusinessYearForDate(dateStr);
  const targetPlant = programContext?.targetPlant?.trim() || "";
  const createdBy = user?.name || user?.userid || "Marketing Specialist";

  // A newly created request is completed with the first staged product. Remaining
  // products are created as their own requests under the same customer/program.
  // Existing staging sessions still use the batch path where available.
  if (!programContext?.parentRequestId) {
    try {
      const batchPayload = {
      customer,
      program_name: programName,
      program_year: programYear,
      year,
      target_plant: targetPlant,
      created_by: createdBy,
      date_request_created: dateStr,
      items: items.map((prod) => ({
        product_description: prod.productDescription,
        material_code: prod.materialCode,
        request_types: prod.scopes,
        mockup_required: prod.scopes.includes("mockup") ? "Yes" : null,
        status: "Draft (Pre-SMT)",
        creation_mode: "marketing_request",
        number_of_designs: prod.designMetadata?.numberOfDesigns || 1,
        sample_required_date: prod.designMetadata?.designRequiredDate || null,
        target_artwork_date_creative: prod.designMetadata?.designRequiredDate || null,
        trend: prod.designMetadata?.trend || null,
        target_audience: prod.designMetadata?.targetAudience || null,
        product_image_path: prod.designMetadata?.referenceImage || null,
        reference_images: prod.designMetadata?.images?.map((img) => img.url) || [],
        reference_links: prod.designMetadata?.webLinks || [],
        remarks:
          prod.designMetadata?.remarks ||
          (prod.samplingMetadata?.partialRequirements
            ? `[Partial Scope]: ${prod.samplingMetadata.partialRequirements}`
            : null),
        product_type: prod.samplingMetadata ? (prod.samplingMetadata.sampleType === "full" ? "Full Sample" : "Partial Sample") : null,
        source_sample_code:
          prod.samplingMetadata?.sourceSrNumber ||
          prod.samplingMetadata?.selectedMaterialCode ||
          prod.catalogMetadata?.sourceMaterialCode ||
          null,
        custom_binding_1:
          prod.samplingMetadata?.bindingType1 || prod.catalogMetadata?.bindingType1 || null,
        custom_binding_2:
          prod.samplingMetadata?.bindingType2 || prod.catalogMetadata?.bindingType2 || null,
      })),
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/sample-requests/batch`, {
        method: "POST",
        headers: createApiHeaders({ json: true }),
        body: JSON.stringify(batchPayload),
      });

      if (res.ok) {
        let firstId: string | number | undefined;
        let firstSr: string | undefined;
        try {
          const data = await res.json();
          if (data?.results && Array.isArray(data.results) && data.results.length > 0) {
            firstId = data.results[0].id;
            firstSr = data.results[0].sr_number;
          }
        } catch {
          // ignore
        }
        return {
          success: true,
          count: items.length,
          customer,
          programName,
          requestId: firstId,
          srNumber: firstSr,
        };
      }
    } catch (err) {
      console.warn("Batch draft save endpoint fallback:", err);
    }
  }

  // Attempt 2: Individual item creation fallback
  let savedCount = 0;
  let firstSavedId: string | number | undefined = programContext?.parentRequestId;
  let firstSavedSr: string | undefined = programContext?.parentSrNumber;

  for (const [index, prod] of items.entries()) {
    if (prod.designMetadata) {
      try {
        await createDesignRequestApi({
          customerName: customer,
          programName: programName,
          programYear: programYear,
          numberOfDesigns: String(prod.designMetadata.numberOfDesigns || 1),
          trend: prod.designMetadata.trend || "",
          targetAudience: prod.designMetadata.targetAudience || "",
          referenceImage: prod.designMetadata.referenceImage || "",
          productDescription: prod.productDescription,
          designRequiredDate: prod.designMetadata.designRequiredDate,
        });
      } catch (err) {
        console.warn("Design request auto-save error:", err);
      }
    }

    const payload: CreateSampleRequestForm = {
      customer,
      programName,
      programYear,
      year,
      targetPlant,
      productDescription: prod.productDescription,
      materialCode: prod.materialCode,
      barcode: "",
      customerProductCode: "",
      sampleRequiredDate: prod.designMetadata?.designRequiredDate,
      dateRequestCreated: dateStr,
      createdBy,
      status: "Draft (Pre-SMT)",
      creationMode: "marketing_request",
      requestTypes: prod.scopes,
      productArtworkNos: prod.designMetadata?.numberOfDesigns ? String(prod.designMetadata.numberOfDesigns) : undefined,
      designsCustomerCreative: prod.designMetadata?.numberOfDesigns ? String(prod.designMetadata.numberOfDesigns) : undefined,
      targetArtworkDateCreative: prod.designMetadata?.designRequiredDate,
      productImagePath: prod.designMetadata?.referenceImage || undefined,
      referenceImages: prod.designMetadata?.images?.map((img) => img.url) || [],
      referenceLinks: prod.designMetadata?.webLinks || [],
      sourceSampleCode:
        prod.samplingMetadata?.sourceSrNumber ||
        prod.samplingMetadata?.selectedMaterialCode ||
        prod.catalogMetadata?.sourceMaterialCode,
      customBinding1: prod.samplingMetadata?.bindingType1 || prod.catalogMetadata?.bindingType1,
      customBinding2: prod.samplingMetadata?.bindingType2 || prod.catalogMetadata?.bindingType2,
      mockupRequired: prod.scopes.includes("mockup") ? "Yes" : undefined,
    };

    try {
      if (index === 0 && programContext?.parentRequestId) {
        const updated = await updateSampleRequestApi(programContext.parentRequestId, payload);
        if (!updated) throw new Error("The sampling request could not be updated with the first product.");
      } else {
        const created = await createSampleRequestApi(payload);
        if (!created) throw new Error("A staged product could not be saved.");
        if (index === 0) {
          firstSavedId = created.id;
          firstSavedSr = created.srNumber;
        }
      }
      savedCount++;
    } catch (err) {
      console.error("Individual draft auto-save error:", err);
      if (index === 0 && programContext?.parentRequestId) {
        return { success: false, count: 0, customer, programName };
      }
    }
  }

  return {
    success: savedCount > 0,
    count: savedCount,
    customer,
    programName,
    requestId: firstSavedId,
    srNumber: firstSavedSr,
  };
}
