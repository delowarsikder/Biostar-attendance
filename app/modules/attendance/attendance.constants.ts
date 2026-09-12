export const BIOSTAR_IDENTIFY_SUCCESS_EVENT = 55;

export const ATTENDANCE_READERS_BACK = [
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
 

export interface AttendanceReader {
  id: number;
  name: string;
  ip: string;
  type: string;
}

export const ATTENDANCE_READERS: readonly AttendanceReader[] = [
   {
    id: 539338112,
    name: "T1-Out",
    ip: "192.168.30.109",
    type: "BioEntryPlus",
  },
  {
    id: 539338120,
    name: "T2-In",
    ip: "192.168.30.115",
    type: "BioEntryPlus",
  },
  {
    id: 539339462,
    name: "Ad-In",
    ip: "192.168.30.103",
    type: "BioEntryPlus",
  },
  {
    id: 539339465,
    name: "HR-Out",
    ip: "192.168.30.105",
    type: "BioEntryPlus",
  },
  {
    id: 539339470,
    name: "Ad-Out",
    ip: "192.168.30.104",
    type: "BioEntryPlus",
  },
  {
    id: 539339471,
    name: "HR-In",
    ip: "192.168.30.106",
    type: "BioEntryPlus",
  },
  {
    id: 539339528,
    name: "T1-In",
    ip: "192.168.30.112",
    type: "BioEntryPlus",
  },
  {
    id: 539339534,
    name: "T2-Out",
    ip: "192.168.30.110",
    type: "BioEntryPlus",
  },
] as const;
