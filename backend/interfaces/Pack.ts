import { Timestamp } from 'firebase/firestore';

export interface PackTag {
    tagName: string;
  }
  
  export interface PackRoute {
    routeID: string;
  }
  
  export interface PackOptions {
    chatEnabled: boolean;
  }
  
  export interface PackDetails {
    id: string;
    name: string;
    description: string;
    owner: string; // user ID
    admins: string[]; // user IDs
    members: string[]; // user IDs
    createdBy: string; // user ID
    createdDate: Timestamp;
    imageURI: string;
    visibility: string,
    tags: PackTag[];
    routes: PackRoute[];
    options: PackOptions;
  }
