export type Role = "admin" | "team_lead" | "agent";

export type AgentGender = "male" | "female";

export type LeadStatus = "new" | "contacted" | "booked" | "won" | "lost";

export type LostReason = "price" | "timing" | "competitor" | "no_response" | "not_interested" | "other";

export type LeadSource = "meta" | "tiktok" | "website" | "manual";

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  /** Receives new-lead emails when a form submission is assigned to this clinic. */
  notificationEmail: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Practitioner {
  id: string;
  name: string;
  title: string | null;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
  clinicIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  slug: string;
  clinicId: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id?: string;
  name: string;
  email: string;
  role: Role;
  gender?: AgentGender | null;
  superadmin?: boolean;
  active?: boolean;
  invitePending?: boolean;
  /** Assigned clinics for clinic staff (`agent` role). Empty for system admins. */
  clinicIds?: string[];
  assignedAgents?: string[];
  linkedFromAgentId?: string;
  createdAt?: string | Date;
}

export interface AgentSummary {
  uid: string;
  name: string;
  gender?: AgentGender | null;
}

export interface Contact {
  id?: string;
  name: string;
  phone: string | null;
  email?: string | null;
  createdAt?: string | Date;
  lastActivityAt?: string | Date;
}

export interface LeadSubmission {
  id?: string;
  contactId: string;
  leadId?: string | null;
  source: LeadSource;
  campaign?: string | null;
  form?: string | null;
  language?: string | null;
  message?: string | null;
  createdAt?: string | Date;
}

export interface Lead {
  id?: string;
  contactId?: string | null;
  name: string;
  phone: string | null;
  email?: string | null;
  source: LeadSource;
  campaign?: string;
  form?: string;
  language?: string;
  clinicId?: string | null;
  practitionerId?: string | null;
  campaignId?: string | null;
  status: LeadStatus;
  assignedTo: string | null;
  createdAt?: string | Date;
  unreadCount?: number;
  offeredAmount?: number | null;
  bookedAmount?: number | null;
  collectedAmount?: number | null;
  comment?: string | null;
  callCount?: number;
  archived?: boolean;
  qualified?: boolean;
  lostReason?: LostReason;
  closedAt?: string | Date;
  lastActivityAt?: string | Date;
  needsIdentityReview?: boolean;
}

export interface Message {
  id?: string;
  leadId: string;
  sender: "agent" | "lead";
  content: string;
  createdAt?: string | Date;
  replyTo?: { body: string };
  messageSid?: string;
  deliveryStatus?: string;
  errorCode?: string;
  fileId?: string | null;
  attachment?: MessageAttachment | null;
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  url: string;
  source: "manual" | "email";
}

export interface LeadFile {
  id: string;
  leadId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  source: "manual" | "email";
  uploadedByName?: string | null;
  createdAt?: string | null;
  url?: string;
}

export interface Call {
  id?: string;
  agentId: string;
  agentName?: string;
  leadId: string;
  status: "initiated" | "completed" | "failed" | "no-answer";
  duration?: number;
  createdAt?: string | Date;
}

export interface Note {
  id?: string;
  leadId: string;
  agentId?: string;
  agentName?: string;
  content: string;
  createdAt?: string | Date;
}

export interface LeadEmail {
  id?: string;
  leadId: string;
  subject?: string;
  body?: string;
  direction?: string;
  sentBy?: string;
  sentByName?: string;
  externalId?: string;
  createdAt?: string | Date;
}
