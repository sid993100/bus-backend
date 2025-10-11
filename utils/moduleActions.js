// bus-backend/utils/moduleActions.js

export const MODULE_ACTIONS = {
  // ----- Account & User Management -----
  account: ["create", "read", "update", "delete"],
  user: ["create", "read", "update", "delete"],
  userProfile: ["create", "read", "update", "delete"],
  accessControl: ["create", "read", "update", "delete"],
  roleAccessControl: ["create", "read", "update", "delete", "accessControl"],

  // ----- Masters -----
  department: ["create", "read", "update", "delete"],
  tollType: ["create", "read", "update", "delete"],
  serviceCategory: ["create", "read", "update", "delete"],
  seatLayout: ["create", "read", "update", "delete"],
  vehicleM: ["create", "read", "update", "delete"], // vehicleManufacturer
  vehicleType: ["create", "read", "update", "delete"],
  vehicleModel: ["create", "read", "update", "delete"],
  ownerType: ["create", "read", "update", "delete"],
  viltM: ["create", "read", "update", "delete"], // vltdManufacturer
  vltModel: ["create", "read", "update", "delete"], // vltdModel
  pismanuf: ["create", "read", "update", "delete"], // pisManufacturer
  pisType: ["create", "read", "update", "delete"],
  pisModel: ["create", "read", "update", "delete"],
  simServiceProvider: ["create", "read", "update", "delete"],
  plan: ["create", "read", "update", "delete"],
  hierarchy: ["create", "read", "update", "delete"],
  gender: ["create", "read", "update", "delete"],
  stopArea: ["create", "read", "update", "delete"],
  country: ["create", "read", "update", "delete"],
  state: ["create", "read", "update", "delete"],
  stopeGrade: ["create", "read", "update", "delete"], // stopGrade
  employType: ["create", "read", "update", "delete"], // employeeType
  photoIdCard: ["create", "read", "update", "delete"],
  depot: ["create", "read", "update", "delete"],
  region: ["create", "read", "update", "delete"],
  zone: ["create", "read", "update", "delete"],
  toll: ["create", "read", "update", "delete"],
  serviceType: ["create", "read", "update", "delete"],
  deviceEvent:["create", "read", "update", "delete"],

  // ----- Operations -----
  busStop: ["create", "read", "update", "delete"],
  route: ["create", "read", "update", "delete", "intermediateStop", "mapping"],
  trip: ["create", "read", "update", "delete", "approval"],
  duty: ["create", "read", "update", "delete"],
  scheduleConfig: ["create", "read", "update", "delete"],
  todayTrips: ["read", "delay", "breakdown"],
  todaySchedules: ["read", "cancellation"],
  dutyAllocation: ["create", "read", "update", "delete", "dutySlip", "cancellation"],

  // ----- Staff -----
  conductor: ["create", "read", "update", "delete"],
  driver: ["create", "read", "update", "delete"],

  // ----- Devices & Vehicle -----
  vltDevice: ["create", "read", "update", "delete", "sim"], // vltDevices
  vltSim: ["create", "read", "update", "delete"], // new
  vehicle: ["create", "read", "update", "delete", "vltd"], // vehicles
  sim: ["create", "read", "update", "delete"], // expanded from ["read"]
  subscription: ["create", "read", "update", "delete"], // expanded from ["read"]
  pisReg: ["create", "read", "update", "delete"], // pisScreens

  // ----- Tracking & Events -----
  liveTrack: ["read"], // new
  liveTracking: ["read"],
  journey: ["read"], // new
  journeyHistory: ["read"],
  journeyHistoryReplay: ["read"],
  event: ["read"], // new
  events: ["read"],

  // ----- Reports -----
  rawData: ["read"],
  vehicleActivity: ["read"],
  crowdManagement: ["read"],
  idlingSummary: ["read"],
  stoppageSummary: ["read"],
  idlingDetailedReport: ["read"], // detailedIdling
  stoppageDetailedReport: ["read"], // detailedStoppage
  distanceTravelled: ["read"],
  vehicleUtilization: ["read"],
  firmware: ["read"], // firmwareVersion
  vehicleCurrentStatus: ["read"],
  arrivalDeparture: ["read"],

  // ----- Incident Handling -----
  incidentHandling: ["read"],
  incidentManagement: ["read"],

  // ----- Misc / Common -----
  helpAndSupport: ["create", "read", "update", "delete"],
  contactUs: ["create", "read", "update", "delete"],
  complaint: ["create", "read", "update", "delete"],
  faq: ["create", "read", "update", "delete"],
  faqCategory: ["create", "read", "update", "delete"],
  geofence: ["create", "read", "update", "delete"],

};
