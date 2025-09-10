export interface KewaResponse {
  success: boolean;
  id?: string;
  sid?: string;
  device_id?: string;
  message?: string;
}

export interface KewaBatchResponse {
  success: boolean;
  user_id?: string;
  processed_count: number;
  failed_count: number;
  errors?: string[];
  timestamp?: string;
}