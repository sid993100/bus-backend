// constants/moduleActions.js

export const MODULE_ACTIONS = {
  // ----- OTC -----
  department: ["create", "read", "update", "delete"],
  tollType: ["create", "read", "update", "delete"],
  serviceCategory: ["create", "read", "update", "delete"],
  seatLayout: ["create", "read", "update", "delete"],
  vehicleManufacturer: ["create", "read", "update", "delete"],
  vehicleType: ["create", "read", "update", "delete"],
  vehicleModel: ["create", "read", "update", "delete"],
  ownerType: ["create", "read", "update", "delete"],
  vltdManufacturer: ["create", "read", "update", "delete"],
  vltdModel: ["create", "read", "update", "delete"],
  pisManufacturer: ["create", "read", "update", "delete"],
  pisType: ["create", "read", "update", "delete"],
  pisModel: ["create", "read", "update", "delete"],
  simServiceProvider: ["create", "read", "update", "delete"],
  plan: ["create", "read", "update", "delete"],
  hierarchy: ["create", "read", "update", "delete"],
  gender: ["create", "read", "update", "delete"],
  stopArea: ["create", "read", "update", "delete"],
  country: ["create", "read", "update", "delete"],
  state: ["create", "read", "update", "delete"],
  stopGrade: ["create", "read", "update", "delete"],
  employeeType: ["create", "read", "update", "delete"],
  photoIdCard: ["create", "read", "update", "delete"],

  // ----- Masters -----
  toll: ["create", "read", "update", "delete"],
  serviceType: ["create", "read", "update", "delete"],
  region: ["create", "read", "update", "delete"],
  depot: ["create", "read", "update", "delete"],
  vltDevices: ["create", "read", "update", "delete", "sim"],
  vehicles: ["create", "read", "update", "delete", "vltd"],
  subscription: ["read"],
  sim: ["read"],
  busStop: ["create", "read", "update", "delete"],
  pisScreens: ["create", "read", "update", "delete"],
  geoFence: ["create", "read", "update", "delete"],

  // ----- User Management -----
  roleAccessControl: ["create", "read", "update", "delete", "accessControl"],
  users: ["create", "read", "update", "delete", "status"],
  conductors: ["create", "read", "update", "delete"],
  drivers: ["create", "read", "update", "delete"],

  // ----- Operations -----
  route: ["create", "read", "update", "delete", "intermediateStop", "mapping"],
  tripConfiguration: ["create", "read", "update", "delete", "approval"],
  scheduleConfiguration: ["create", "read", "update", "delete"],
  todaysTrips: ["read", "delay", "breakdown"],
  todaysSchedules: ["read", "cancellation"],
  dutyAllocation: ["create", "read", "update", "delete", "dutySlip", "cancellation"],

  // ----- Incident Handling -----
  incidentHandling: ["read"],

  // ----- Vehicle Tracking -----
  liveTracking: ["read"],
  journeyHistoryReplay: ["read"],
  events: ["read"],

  // ----- Reports -----
  rawData: ["read"],
  journeyHistory: ["read"],
  incidentManagement: ["read"],
  vehicleActivity: ["read"],
  crowdManagement: ["read"],
  idlingSummary: ["read"],
  stoppageSummary: ["read"],
  detailedIdling: ["read"],
  detailedStoppage: ["read"],
  distanceTravelled: ["read"],
  vehicleUtilization: ["read"],
  firmwareVersion: ["read"],
  vehicleCurrentStatus: ["read"],
  arrivalDeparture: ["read"],

  // ----- Misc / Common -----
  helpAndSupport: ["create", "read", "update", "delete"],
  accessControl: ["create", "read", "update", "delete"],
  contactUs: ["create", "read", "update", "delete"],
  complaint: ["create", "read", "update", "delete"],
  userProfile: ["create", "read", "update", "delete"],
  faq: ["create", "read", "update", "delete"],
  faqCategory: ["create", "read", "update", "delete"],
};
