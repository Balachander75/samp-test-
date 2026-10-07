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
