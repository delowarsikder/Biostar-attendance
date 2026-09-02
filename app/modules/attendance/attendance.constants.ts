export const BIOSTAR_IDENTIFY_SUCCESS_EVENT = 55;

export const ATTENDANCE_READERS = [
  539338112, // T1-Out
  539338120, // T2-In
  539339462, // Ad-In
  539339465, // HR-Out
  539339470, // Ad-Out
  539339471, // HR-In
  539339528, // T1-In
  539339534, // T2-Out
] as const;

export const IN_READERS = [
  539338120, // T2-In
  539339462, // Ad-In
  539339471, // HR-In
  539339528, // T1-In
] as const;

export const OUT_READERS = [
  539338112, // T1-Out
  539339465, // HR-Out
  539339470, // Ad-Out
  539339534, // T2-Out
] as const;