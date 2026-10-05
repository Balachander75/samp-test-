export type DeliverableScopeId = "design" | "mockup" | "sample" | "costing";

export interface DeliverableDefinition {
  id: DeliverableScopeId;
  label: string;
}

export const DELIVERABLES: DeliverableDefinition[] = [
  { id: "design", label: "Design" },
  { id: "mockup", label: "Mockup" },
  { id: "sample", label: "Sampling" },
  { id: "costing", label: "Costing" },
];

export interface StagedProductItem {
  id: string;
  materialCode: string;
  productDescription: string;
  scopes: DeliverableScopeId[];
  timestamp: string;
  stagedDate?: string;
  designMetadata?: {
    numberOfDesigns: number;
    designRequiredDate: string;
    trend: string;
    targetAudience: string;
    remarks?: string;
    images: Array<{ id: string; url: string; name: string; size?: string }>;
    webLinks: string[];
    referenceImage: string;
  };
  samplingMetadata?: {
    sampleType: "full" | "partial";
    partialRequirements?: string;
    searchMode: "material_code" | "binding";
    sourceSampleId?: number;
    sourceSrNumber?: string;
    selectedMaterialCode?: string;
    bindingType1?: string;
    bindingType2?: string;
    customerReference?: string;
    targetPlant?: string;
  };
  catalogMetadata?: {
    sourceProductId: number;
    sourceRequestNumber?: string;
    sourceMaterialCode: string;
    sourceDescription: string;
    bindingType1?: string;
    bindingType2?: string;
  };
}

export const cleanPlantName = (plant?: string): string => {
  if (!plant) return "";
  return plant.replace(/^\d{4}-?\s*/, "").trim() || plant;
};
