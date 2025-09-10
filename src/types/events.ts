import { DeviceInfo } from "./config";

export interface BaseEventData {
  sessionId?: string;
  timestamp?: string;
  screenName?: string;
  previousScreen?: string;
  [key: string]: any;
}

export interface KewaEvent {
  eventName: string;
  eventData: BaseEventData;
  contactData?: ContactData;
  deviceId?: string | null;
  deviceInfo?: DeviceInfo;
  metadata?: EventMetadata;
  timestamp: string;
}

export interface ContactData {
  id?: string;
  title?: string;
  firstname?: string;
  lastname?: string;
  company?: string;
  position?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  points?: number;
  fax?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
  preferred_locale?: string;
  timezone?: string;
  last_active?: string;
  attribution_date?: string;
  attribution?: number;
  website?: string;
  facebook?: string;
  foursquare?: string;
  instagram?: string;
  linkedin?: string;
  skype?: string;
  twitter?: string;
  companyaddress1?: string;
  companyaddress2?: string;
  companyemail?: string;
  companyphone?: string;
  companycity?: string;
  companystate?: string;
  companyzipcode?: string;
  companycountry?: string;
  companyname?: string;
  companywebsite?: string;
  companynumber_of_employees?: number;
  companyfax?: string;
  companyannual_revenue?: number;
  companyindustry?: string;
  companydescription?: string;
  [key: string]: any;
}

export interface EventMetadata {
  eventId: string;
  attemptCount?: number;
  queuedAt?: string;
  sentAt?: string;
}


export interface AppLaunchEvent extends BaseEventData {
  isFirstLaunch: boolean;
  installSource?: string;
  referrer?: string;
  campaignId?: string;
}

export interface SessionEvent extends BaseEventData {
  sessionId: string;
  sessionStartTime?: string;
  sessionDuration?: number;
}

export interface UserLoginEvent extends BaseEventData {
  userId: string;
  email?: string;
  loginMethod: 'email' | 'google' | 'facebook' | 'apple' | 'phone' | 'custom';
}

export interface UserRegistrationEvent extends BaseEventData {
  userId: string;
  email?: string;
  registrationMethod: 'email' | 'google' | 'facebook' | 'apple' | 'phone';
}


export interface ScreenViewEvent extends BaseEventData {
  screenName: string;
  screenClass?: string;
  loadTime?: number;
}

export interface ErrorEvent extends BaseEventData {
  errorMessage: string;
  errorStack?: string;
  errorName: string;
  isFatal?: boolean;
  context?: Record<string, any>;
}

export interface AppForegroundEvent extends BaseEventData {
  timestamp: string;
}

export interface AppBackgroundEvent extends BaseEventData {
  timestamp: string;
}

export type PredefinedEvents =
  | AppLaunchEvent
  | SessionEvent
  | UserLoginEvent
  | UserRegistrationEvent
  | ScreenViewEvent
  | ErrorEvent;