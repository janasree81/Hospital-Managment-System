// FIX: This file was incorrectly populated with mock data instead of type definitions.
// It has been replaced with the correct type definitions inferred from mock data and component usage.
// This resolves the circular dependency and "not exported" errors throughout the application.

// --- Core Types ---

export enum Role {
  Admin = 'Admin',
  Doctor = 'Doctor',
  Nurse = 'Nurse',
  Pharmacist = 'Pharmacist',
  Patient = 'Patient',
  LabTech = 'Lab Technician',
  OccupationalTherapist = 'Occupational Therapist',
}

export interface User {
  id: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  email: string;
  password?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
}

export interface Alert {
  id: string;
  read: boolean;
  message: string;
  patientName: string;
  patientId: string;
  timestamp: string;
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

// --- Patient & Clinical ---

export interface Vital {
  timestamp: string;
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  loggedBy: string;
  map?: number;
  cvp?: number;
}

export interface ConsultationNote {
  id: string;
  timestamp: string;
  doctorName: string;
  notes: string;
  diagnosis: string;
  bloodPressure: string;
  pulseRate: number;
  linkedPrescriptionIds?: string[];
  linkedReferralId?: string;
}

export interface Referral {
    id: string;
    referringDoctor: string;
    referredToDoctor: string;
    referredToDepartment: string;
    reason: string;
    timestamp: string;
    status: 'Pending' | 'Completed' | 'Cancelled';
}

export interface DailyConsumption {
    date: string;
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    status: 'Consumed' | 'Partially Consumed' | 'Refused';
    loggedBy: string;
    notes?: string;
}
export type ConsumptionLog = DailyConsumption;

export interface ICUNote {
  id: string;
  timestamp: string;
  author: string;
  noteType: string;
  text: string;
}

export interface VentilatorSettings {
    mode: string;
    fio2: number;
    peep: number;
    tidalVolume: number;
    respiratoryRate: number;
}

export interface MedicationInfusion {
    id: string;
    drugName: string;
    rate: number;
    unit: string;
}

export interface SOFAScore {
    respiration: number;
    coagulation: number;
    liver: number;
    cardiovascular: number;
    cns: number;
    renal: number;
    totalScore: number;
}

// FIX: Added OT type definitions before they are used in the Patient interface.
// --- OT ---
export interface OTAssessment {
    id: string;
    date: string;
    therapistName: string;
    type: string;
    scores: Record<string, number>;
    summary: string;
}

export interface OTGoal {
    id: string;
    description: string;
    targetDate: string;
    status: 'In Progress' | 'Achieved' | 'Revised' | 'On Hold';
    progress: number;
}

export interface OTSessionNote {
    id: string;
    date: string;
    therapistName: string;
    activitiesPerformed: { activityId: string; performanceNotes: string }[];
    observations: string;
    progressTowardsGoals: string;
}

export interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other' | 'Unknown';
    avatarUrl: string;
    dateOfBirth: string;
    contactNumber: string;
    contactEmail: string;
    address: string;
    bloodType: string;
    roomNumber: string;
    allergies: string[];
    chronicConditions: string[];
    emergencyContactName: string;
    emergencyContactPhone: string;
    acuityScore: number;
    vitals: Vital[];
    consultationHistory: ConsultationNote[];
    referrals: Referral[];
    dietPlanId?: string;
    consumptionHistory?: DailyConsumption[];
    otAssessments?: OTAssessment[];
    otGoals?: OTGoal[];
    otSessionNotes?: OTSessionNote[];
    assignedEquipment?: { equipmentId: string, name: string, assignedDate: string }[];
    wardId?: string;
    bedNumber?: string;
    primaryDiagnosis?: string;
    icuBedNumber?: string;
    ventilatorSettings?: VentilatorSettings;
    activeInfusions?: MedicationInfusion[];
    sofaScoreHistory?: { date: string, score: SOFAScore }[];
    icuNotes?: ICUNote[];
    tagId?: string; // from BedManagement
}

export interface Appointment {
  id: string;
  patientName: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  doctorName: string;
  department: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
  reason: string;
  appointmentType: 'In-person' | 'Video Consultation';
  isFollowUp: boolean;
  pastMedicalHistory?: string;
}

export interface DoctorAvailability {
    doctorName: string;
    availableDays: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[];
    availableSlots: string[];
}

export enum QueueStatus {
  Waiting = 'Waiting',
  InConsultation = 'In Consultation',
  Completed = 'Completed',
}

export interface QueueEntry {
  id: string;
  tokenNumber: number;
  patientName: string;
  doctorName: string;
  checkInTime: string;
  status: QueueStatus;
}


// --- Billing ---
export interface BillItem {
  description: string;
  amount: number;
}

export interface Bill {
  id: string;
  patientName: string;
  date: string;
  items: BillItem[];
  total: number;
  status: 'Paid' | 'Unpaid' | 'Pending';
}


// --- Staff & HR ---
export interface Staff {
  id: string;
  name: string;
  role: Role;
  department: string;
  contact: string;
  status: 'Active' | 'On Leave' | 'Inactive';
}

export enum ShiftType {
  Morning = 'Morning',
  Evening = 'Evening',
  Night = 'Night',
}

export interface DoctorPreferences {
    doctorId: string;
    doctorName: string;
    preferredShifts: ShiftType[];
    dislikedShifts: ShiftType[];
    maxConsecutiveShifts: number;
}

export interface DoctorShift {
    id: string;
    date: string;
    shift: ShiftType;
    doctorId: string;
    doctorName: string;
    department: string;
}

export interface LeaveRequest {
    id: string;
    doctorId: string;
    doctorName: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: 'Pending' | 'Approved' | 'Denied';
}


// --- Departmental ---
export interface Surgery {
  id: string;
  patientName: string;
  surgeonName: string;
  procedure: string;
  date: string;
  time: string;
  theatreNumber: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
}

export interface Drug {
  id: string;
  name: string;
  dosage: string;
  stock: number;
  unit: 'tablet' | 'capsule' | 'ml';
}

export interface Prescription {
  id: string;
  prescriptionNo?: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  drugName: string;
  dosage: string;
  quantity: number;
  frequency?: string;
  duration?: string;
  remark?: 'Before Food' | 'After Food' | 'With Food' | 'N/A';
  date: string;
  status: 'Pending' | 'Filled' | 'Cancelled';
  consultationNoteId?: string;
}

export interface TestResultItem {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
}

export interface LabTest {
  id: string;
  patientId: string;
  patientName: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other' | 'Unknown';
  doctorName: string;
  testName: string;
  testCategory: 'Pathology' | 'Microbiology' | 'Biochemistry' | 'Hematology' | 'Radiology' | 'Histopathology' | 'Special Panel';
  sampleType: string;
  sampleId: string;
  sampleCollectionDate: string;
  dateOrdered: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  billingStatus?: 'Pending' | 'Billed';
  results: TestResultItem[];
  isCritical: boolean;
  verifiedBy?: string;
  reportGeneratedDate?: string;
  interpretation?: string;
  safetyProtocolsFollowed: boolean;
  testMethod?: string;
  additionalNotes?: string;
}

// --- Emergency & Special Cases ---

export enum CaseStatus {
  WaitingTriage = 'Waiting for Triage',
  WaitingRoom = 'Waiting Room',
  InTreatment = 'In Treatment',
  Observation = 'Observation',
  AwaitingDisposition = 'Awaiting Disposition',
  Admitted = 'Admitted',
  Discharged = 'Discharged',
}

export enum TriageLevel {
    Emergent = 1,
    Urgent = 2,
    LessUrgent = 3,
    NonUrgent = 4,
}

export const TriageLevelDetails: Record<TriageLevel, { name: string; color: string; description: string; }> = {
    [TriageLevel.Emergent]: { name: 'ESI 1 - Emergent', color: 'red-500', description: 'Immediate life-saving intervention required.' },
    [TriageLevel.Urgent]: { name: 'ESI 2 - Urgent', color: 'orange-500', description: 'High risk situation, confused/lethargic/disoriented, or severe pain/distress.' },
    [TriageLevel.LessUrgent]: { name: 'ESI 3 - Less Urgent', color: 'yellow-500', description: 'Multiple resources required, stable vitals.' },
    [TriageLevel.NonUrgent]: { name: 'ESI 4/5 - Non-urgent', color: 'green-500', description: 'One or no resources required.' },
};

export interface EmergencyCase {
  id: string;
  patientName: string;
  patientId?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other' | 'Unknown';
  chiefComplaint: string;
  arrivalTime: string;
  status: CaseStatus;
  vitals: Vital[];
  triageLevel?: TriageLevel;
  triageNotes?: string;
  assignedDoctor?: string;
  roomNumber?: string;
  notes?: { timestamp: string, author: string, note: string }[];
}

export enum MLCStatus {
  Pending = 'Pending',
  ReportGenerated = 'Report Generated',
  AuthoritiesNotified = 'Authorities Notified',
  Closed = 'Closed',
}

export interface AuditLogEntry {
  timestamp: string;
  user: string;
  action: string;
}

export interface NotificationLogEntry {
  timestamp: string;
  authority: string;
  method: string;
  notifiedBy: string;
}

export interface MedicoLegalCase {
  id: string;
  emergencyCaseId?: string;
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other' | 'Unknown';
  incidentDetails: string;
  incidentTimestamp: string;
  injuriesObserved: string;
  evidenceCollected: string[];
  firNumber?: string;
  policeStation?: string;
  status: MLCStatus;
  registeredBy: string;
  registrationTimestamp: string;
  reportGeneratedTimestamp?: string;
  notificationLog: NotificationLogEntry[];
  auditLog: AuditLogEntry[];
}

export enum AMAStatus {
  PendingSignature = 'Pending Signature',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export interface AMACase {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  reasonForLeaving: string;
  risksExplained: string;
  witnessName: string;
  status: AMAStatus;
  requestTimestamp: string;
  consentTimestamp?: string;
}

export enum BroughtDeadStatus {
  PendingPaperwork = 'Pending Paperwork',
  AuthoritiesNotified = 'Authorities Notified',
  Completed = 'Completed',
}

export interface BroughtDeadCase {
  id: string;
  patientIdentifier: string;
  estimatedAge: number;
  gender: 'Male' | 'Female' | 'Other' | 'Unknown';
  broughtBy: string;
  arrivalTimestamp: string;
  declaredBy: string;
  preliminaryAssessment: string;
  probableCauseOfDeath: string;
  isMLC: boolean;
  belongings: string[];
  status: BroughtDeadStatus;
  auditLog: AuditLogEntry[];
}

// --- Logistics & Transport ---

export interface Coordinates {
  lat: number;
  lng: number;
}

export enum AmbulanceStatus {
  Available = 'Available',
  Dispatched = 'Dispatched',
  Maintenance = 'Maintenance',
}

export interface Ambulance {
  id: string;
  status: AmbulanceStatus;
  currentLocation: Coordinates;
  crew: string[];
}

export enum DispatchStatus {
  Dispatched = 'Dispatched',
  OnScene = 'On Scene',
  Transporting = 'Transporting',
  Arrived = 'Arrived at Hospital',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export interface DispatchLogEntry {
    timestamp: string;
    status: DispatchStatus;
}

export interface Dispatch {
  id: string;
  emergencyCaseId: string;
  patientName: string;
  ambulanceId: string;
  dispatchTimestamp: string;
  dispatchLocation: string;
  destination: string;
  priority: 'Routine' | 'Urgent' | 'Critical';
  status: DispatchStatus;
  logs: DispatchLogEntry[];
  etaMinutes?: number;
  startCoords?: Coordinates;
}

export enum PorterStatus {
  Available = 'Available',
  OnTask = 'On Task',
  OnBreak = 'On Break',
}

export interface Porter {
  id: string;
  name: string;
  status: PorterStatus;
  currentLocation: string;
}

export enum TransportStatus {
  Pending = 'Pending',
  Assigned = 'Assigned',
  EnRouteToPatient = 'En Route to Patient',
  Transporting = 'Transporting',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export enum TransportPriority {
  STAT = 'STAT',
  Urgent = 'Urgent',
  Routine = 'Routine',
}

export interface TransportRequest {
  id: string;
  patientId: string;
  patientName: string;
  fromLocation: string;
  toLocation: string;
  priority: TransportPriority;
  requestTimestamp: string;
  status: TransportStatus;
  assignedPorterId?: string;
  assignedPorterName?: string;
  assignmentTimestamp?: string;
  completionTimestamp?: string;
  equipmentNeeded?: string[];
  notes?: string;
}

// --- Security ---

export enum VisitorStatus {
  CheckedIn = 'Checked In',
  CheckedOut = 'Checked Out',
}

export interface Visitor {
  id: string;
  name: string;
  company: string;
  phone: string;
  visiting: string;
  purpose: string;
  checkInTime: string;
  checkOutTime?: string;
  status: VisitorStatus;
}

export interface SecurityLogEntry {
  id: string;
  timestamp: string;
  officerName: string;
  entry: string;
}

export enum IncidentStatus {
  Open = 'Open',
  UnderInvestigation = 'Under Investigation',
  Resolved = 'Resolved',
  Closed = 'Closed',
}

export enum IncidentPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export interface IncidentFollowUp {
    timestamp: string;
    user: string;
    note: string;
}

export interface SecurityIncident {
  id: string;
  type: string;
  incidentTimestamp: string;
  location: string;
  description: string;
  personsInvolved: string;
  actionsTaken: string;
  reportedBy: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  followUpNotes: IncidentFollowUp[];
}

// --- Admin & Feedback ---

export enum ComplaintStatus {
  Open = 'Open',
  InProgress = 'In Progress',
  Escalated = 'Escalated',
  Resolved = 'Resolved',
}

export enum ComplaintUrgency {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export interface ComplaintActionLog {
    timestamp: string;
    user: string;
    action: string;
}

export interface Complaint {
  id: string;
  patientId: string;
  patientName: string;
  filedBy: string;
  complaintText: string;
  dateFiled: string;
  status: ComplaintStatus;
  category: string;
  urgency: ComplaintUrgency;
  assignedTo?: string;
  resolutionNotes?: string;
  actionLog: ComplaintActionLog[];
  preferredContactMethod?: 'In-App' | 'Phone' | 'In-Person';
}

export enum FeedbackStatus {
    Open = 'Open',
    Acknowledged = 'Acknowledged',
    Actioned = 'Actioned',
    Closed = 'Closed',
}

export enum FeedbackPriority {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
}

export interface Feedback {
    id: string;
    patientId: string;
    patientName: string;
    submissionDate: string;
    channel: 'Web Portal' | 'In-person' | 'Survey';
    department: string;
    feedbackText: string;
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    status: FeedbackStatus;
    priority: FeedbackPriority;
    tags: string[];
    assignedTo?: string;
    resolutionNotes?: string;
}


// --- F&B and Nutrition ---

export interface FoodItem {
    id: string;
    name: string;
    category: 'Protein' | 'Grain' | 'Vegetable' | 'Fruit' | 'Dairy' | 'Other';
    calories: number;
    allergens: string[];
    stockQuantity: number;
    unit: 'piece' | 'g' | 'ml';
}

export interface DietPlan {
    id: string;
    dietType: 'Regular' | 'Low Sodium' | 'Diabetic' | 'Renal' | 'Liquid' | 'Low Fat' | 'Custom';
    caloriesPerDay: number;
    prescribedBy: string;
    startDate: string;
    notes?: string;
    meals: {
        mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
        time: string;
        items: { foodItemId: string; quantity: number }[];
    }[];
}

export enum ProductionOrderStatus {
    Pending = 'Pending',
    InProgress = 'In Progress',
    Ready = 'Ready for Delivery',
    Delivered = 'Delivered',
}

export interface ProductionOrder {
    id: string;
    patientId: string;
    patientName: string;
    roomNumber: string;
    date: string;
    mealType: 'Breakfast' | 'Lunch' | 'Dinner';
    dietType: DietPlan['dietType'];
    items: { foodItemId: string; name: string; quantity: number; unit: FoodItem['unit'] }[];
    status: ProductionOrderStatus;
}

export interface WasteLog {
    id: string;
    foodItemId: string;
    foodItemName: string;
    quantityWasted: number;
    unit: FoodItem['unit'];
    reason: 'Production Error' | 'Expired' | 'Patient Refused' | 'Other';
    timestamp: string;
    loggedBy: string;
}

// --- OT ---
export interface OTActivity {
    id: string;
    name: string;
    category: 'Fine Motor' | 'Gross Motor' | 'ADL' | 'Cognitive';
    description: string;
    videoUrl?: string;
}

export interface OTEquipment {
    id: string;
    name: string;
    description: string;
    status: 'Available' | 'In Use' | 'Maintenance';
    patientId?: string;
    patientName?: string;
}

// --- Ward Management ---
export enum BedStatus {
    Available = 'Available',
    Occupied = 'Occupied',
    Cleaning = 'Cleaning',
}

export interface Bed {
    id: string;
    roomId: string;
    bedNumber: string;
    status: BedStatus;
    patientId?: string;
    patientName?: string;
}

export interface Ward {
    id: string;
    name: string;
    beds: Bed[];
}

export enum TaskStatus {
    Pending = 'Pending',
    Completed = 'Completed',
}

export enum TaskPriority {
    High = 'High',
    Medium = 'Medium',
    Low = 'Low',
}

export interface NursingTask {
    id: string;
    patientId: string;
    patientName: string;
    task: string;
    details: string;
    dueDate: string;
    status: TaskStatus;
    category: 'Medication' | 'Vitals' | 'Care' | 'Other';
    priority: TaskPriority;
    assignedTo?: string;
}

export interface WardItem {
    id: string;
    name: string;
    stock: number;
    reorderLevel: number;
    unit: string;
}

// --- Biomedical & Gas ---

export enum EquipmentStatus {
    Operational = 'Operational',
    UnderMaintenance = 'Under Maintenance',
    Breakdown = 'Breakdown',
}

export interface BiomedicalEquipment {
    id: string;
    name: string;
    department: string;
    modelNumber: string;
    serialNumber: string;
    purchaseDate: string;
    lastServiceDate: string;
    nextServiceDate: string;
    status: EquipmentStatus;
    location: string;
}

export enum MaintenanceType {
    Preventive = 'Preventive',
    Corrective = 'Corrective',
}

export enum WorkOrderStatus {
    Open = 'Open',
    InProgress = 'In Progress',
    Completed = 'Completed',
}

export interface WorkOrder {
    id: string;
    equipmentId: string;
    equipmentName: string;
    issueDescription: string;
    reportedBy: string;
    dateReported: string;
    maintenanceType: MaintenanceType;
    status: WorkOrderStatus;
    assignedTo: string;
    priority: 'Low' | 'Medium' | 'High';
    serviceLog?: {
        date: string;
        technician: string;
        notes: string;
        partsReplaced: string[];
    };
}

export enum MedicalGasType {
    Oxygen = 'Oxygen',
    NitrousOxide = 'Nitrous Oxide',
    MedicalAir = 'Medical Air',
}

export enum CylinderStatus {
    Full = 'Full',
    InUse = 'In Use',
    Empty = 'Empty',
}

export interface Cylinder {
    id: string;
    gasType: MedicalGasType;
    size: 'H' | 'E';
    status: CylinderStatus;
    location: string;
    pressure: number;
}

export enum GasRequestStatus {
    Pending = 'Pending',
    Approved = 'Approved',
    Dispatched = 'Dispatched',
    Completed = 'Completed',
    Rejected = 'Rejected',
}

export interface GasRequest {
    id: string;
    department: string;
    gasType: MedicalGasType;
    quantity: number;
    status: GasRequestStatus;
    requestTimestamp: string;
}

// --- Integration & Compliance ---
export interface ExternalLabResult {
    id: string;
    patientName: string;
    testName: string;
    externalLabName: string;
    resultValue: string;
    units: string;
    referenceRange: string;
    observationDate: string;
    isCritical: boolean;
    status: 'Pending Review' | 'Verified' | 'Rejected';
    rawFhirData: string;
}

export interface IntegrationAuditLog {
    id: string;
    timestamp: string;
    user: string;
    action: string;
}

export interface DischargeMedication {
    name: string;
    dosage: string;
    frequency: string;
}

export enum DischargeSummaryStatus {
    Draft = 'Draft',
    Finalized = 'Finalized',
}

export interface DischargeSummary {
    id: string;
    patientId: string;
    patientName: string;
    status: DischargeSummaryStatus;
    lastUpdated: string;
    briefHistoryAndReasonForAdmission: string;
    courseInHospital: string;
    conditionAtDischarge: string;
    medicationsOnDischarge: DischargeMedication[];
    followUpInstructions: string;
}

export enum LicenseStatus {
    Active = 'Active',
    Expired = 'Expired',
    Renewing = 'Renewing',
}

export enum ComplianceStatus {
    Compliant = 'Compliant',
    AtRisk = 'At Risk',
    NonCompliant = 'Non-Compliant',
}

export interface License {
    id: string;
    name: string;
    issuingAuthority: string;
    licenseNumber: string;
    issueDate: string;
    expiryDate: string;
    status: LicenseStatus;
    complianceStatus: ComplianceStatus;
    owner: string;
}

export interface ComplianceAuditLog {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    licenseId?: string;
}

export interface AVAccessLogEntry {
    timestamp: string;
    userName: string;
    action: 'Uploaded' | 'Viewed' | 'Downloaded' | 'Edited';
}

export interface AVContent {
    id: string;
    title: string;
    description: string;
    fileName: string;
    duration: string;
    thumbnailUrl: string;
    uploadDate: string;
    uploadedBy: string;
    tags: string[];
    complianceCategory: 'Clinical Training' | 'Patient Consent' | 'Surgical Recording' | 'Departmental Memo';
    retentionPeriod: '1 Year' | '5 Years' | '7 Years' | 'Indefinite';
    accessLog: AVAccessLogEntry[];
}

// --- Housekeeping & Waste ---

export interface HousekeepingChecklistItem {
    id: string;
    text: string;
    isCompleted: boolean;
}

export enum HousekeepingTaskStatus {
    Pending = 'Pending',
    InProgress = 'In Progress',
    Completed = 'Completed',
    Blocked = 'Blocked',
}

export interface HousekeepingTask {
    id: string;
    task: string;
    location: string;
    priority: 'Low' | 'Medium' | 'High';
    status: HousekeepingTaskStatus;
    assignedTo?: string;
    checklist: HousekeepingChecklistItem[];
}

export interface HousekeepingStaff {
    id: string;
    name: string;
    status: 'Idle' | 'On Task' | 'On Break';
    currentLocation: string;
}

export enum BioWasteCategory {
    General = 'General Waste',
    Infectious = 'Infectious Waste',
    Sharps = 'Sharps',
    Pharmaceutical = 'Pharmaceutical',
}

export interface BioWasteLog {
    id: string;
    manifestId: string;
    category: BioWasteCategory;
    weightKg: number;
    origin: string; // Department/Ward
    collectionTimestamp: string;
    collectedBy: string;
    disposalTimestamp?: string;
    disposalMethod?: string;
    status: 'Collected' | 'In Transit' | 'Disposed';
}

// --- IT ---

export interface ITAsset {
    id: string;
    name: string;
    type: 'Desktop' | 'Laptop' | 'Printer' | 'Server' | 'Network Device';
    location: string;
    status: 'Operational' | 'Under Repair' | 'Decommissioned';
}

export enum ITTicketStatus {
    New = 'New',
    Assigned = 'Assigned',
    InProgress = 'In Progress',
    Resolved = 'Resolved',
    Closed = 'Closed',
}

export enum ITTicketPriority {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
    Critical = 'Critical',
}

export interface ITTicketLogEntry {
    timestamp: string;
    user: string;
    note: string;
}

export interface ITTicket {
    id: string;
    title: string;
    description: string;
    reportedBy: string;
    assetId?: string;
    category: 'Hardware Issue' | 'Software Bug' | 'Network Problem' | 'Access Request' | 'New Equipment Request' | 'Other';
    status: ITTicketStatus;
    priority: ITTicketPriority;
    assignedTo?: string;
    createdTimestamp: string;
    resolvedTimestamp?: string;
    resolutionNotes?: string;
    log: ITTicketLogEntry[];
}

export interface SBARReport {
    id: string;
    patientId: string;
    patientName: string;
    situation: string;
    background: string;
    assessment: string;
    recommendation: string;
    generatedBy: string;
    timestamp: string;
}