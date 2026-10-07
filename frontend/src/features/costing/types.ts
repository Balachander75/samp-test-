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
