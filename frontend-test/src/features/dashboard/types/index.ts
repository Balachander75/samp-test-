export interface UserProfileInfo {
  name: string;
  userid: string;
  email: string;
  role: string;
  sub_role?: string;
}

export interface TeamMemberItem {
  id: number;
  name: string;
  userid: string;
  email: string;
  role: string;
  sub_role?: string;
  is_active: boolean;
  created_at?: string;
}

export interface ActivityItem {
  icon: string;
  title: string;
  desc: string;
  time: string;
  color: "green" | "blue" | "purple" | "emerald" | "orange";
}

export interface MetricProgress {
  label: string;
  value: string;
  percentage: number;
  colorClass: string;
}

export interface ServiceStatus {
  name: string;
  desc: string;
  status: string;
}
