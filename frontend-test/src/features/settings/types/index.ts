export interface SettingsProfileData {
  name: string;
  userid: string;
  email: string;
  role: string;
}

export interface SettingsSecurityData {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface SettingsPreferencesData {
  emailNotifs: boolean;
  securityAlerts: boolean;
  stageTransitionAlerts?: boolean;
  plantCapacityAlerts?: boolean;
}
