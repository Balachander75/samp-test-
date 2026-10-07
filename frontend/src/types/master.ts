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

export interface BindingHierarchyResponse {
  binding1_options: string[];
  binding2_options?: string[];
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
  source_sample_code?: string;
  c1_caliper_weight?: string;
  c2_material_type?: string;
  c2_cover_finish?: string;
  details_count?: number;
}
