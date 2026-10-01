import { StagedProductItem } from "../components/ProductStagingWorkspace";
import {
  createSampleRequestApi,
  createDesignRequestApi,
} from "../api";
import { CreateSampleRequestForm } from "../types";
import { API_BASE_URL, createApiHeaders } from "@/lib/api";
import { UserProfile } from "@/features/auth";

export interface ProgramContextData {
  customer?: string;
  programName?: string;
  programYear?: string;
  targetPlant?: string;
}

export interface AutoSaveResult {
  success: boolean;
  count: number;
  customer: string;
  programName: string;
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
  const year = programContext?.programYear || "2026-2027";
  const targetPlant = programContext?.targetPlant?.trim() || "1505- Khaniwade";
  const createdBy = user?.name || user?.userid || "Marketing Specialist";
  const dateStr = new Date().toISOString().split("T")[0];

  // Attempt 1: Fast atomic batch creation
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
      })),
    };

    const res = await fetch(`${API_BASE_URL}/api/v1/sample-requests/batch`, {
      method: "POST",
      headers: createApiHeaders({ json: true }),
      body: JSON.stringify(batchPayload),
    });

    if (res.ok) {
      return {
        success: true,
        count: items.length,
        customer,
        programName,
      };
    }
  } catch (err) {
    console.warn("Batch draft save endpoint fallback:", err);
  }

  // Attempt 2: Individual item creation fallback
  let savedCount = 0;
  for (const prod of items) {
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
    };

    try {
      await createSampleRequestApi(payload);
      savedCount++;
    } catch (err) {
      console.error("Individual draft auto-save error:", err);
    }
  }

  return {
    success: savedCount > 0,
    count: savedCount,
    customer,
    programName,
  };
}
