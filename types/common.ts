// common.ts
export interface Identifiable {
  id: string;
}

export interface Timestamped {
  createdAt: string;
  updatedAt: string;
}

export interface Entity extends Identifiable, Timestamped {}