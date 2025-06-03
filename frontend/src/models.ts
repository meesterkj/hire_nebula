export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date; // Or number for Date.now()
}

// Potentially other shared interfaces or types can go here
// For example, UserProfile if needed across components
// export interface UserProfile {
//   userID: string;
//   name: string;
//   email: string;
//   organisation?: string;
//   position?: string;
// }
