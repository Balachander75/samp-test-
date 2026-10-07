import { SampleRequestItem } from "../../types";
import { isDesignRequest } from "../../utils/trackTypes";

export type RequestTypeScope = "design" | "mockup" | "sample" | "costing";

export function getRequestTypes(row: Partial<SampleRequestItem>): RequestTypeScope[] {
  const result: RequestTypeScope[] = [];

  const explicit = Array.isArray(row.requestTypes) ? row.requestTypes : [];
  explicit.forEach((t) => {
    if (["design", "mockup", "sample", "costing"].includes(t as any) && !result.includes(t as any)) {
      result.push(t as any);
    }
  });

  // Infer design if not present
  if (!result.includes("design")) {
    if (
      isDesignRequest(row) ||
      row.requestKind === "design" ||
      Boolean(row.designsCustomerCreative && row.designsCustomerCreative !== "0") ||
      Boolean(row.numberOfDesigns && Number(row.numberOfDesigns) > 0) ||
      Boolean(row.productArtworkNos && String(row.productArtworkNos) !== "0")
    ) {
      result.push("design");
    }
  }

  // Infer mockup if not present
  if (!result.includes("mockup")) {
    const mockupVal = String(row.mockupRequired || "").trim().toLowerCase();
    if (mockupVal === "yes" || mockupVal === "true" || mockupVal === "y") {
      result.push("mockup");
    }
  }

  // Infer costing if not present
  if (!result.includes("costing")) {
    if (row.qtyDesignCosting && Number(row.qtyDesignCosting) > 0) {
      result.push("costing");
    }
  }

  // Infer sampling if not present
  if (!result.includes("sample")) {
    const hasSamplingQty = row.qtyForSampling && Number(row.qtyForSampling) > 0;
    if (hasSamplingQty || result.length === 0) {
      result.push("sample");
    }
  }

  return result;
}
