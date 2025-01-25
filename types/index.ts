export interface User {
  id: number;
  phoneNumber: string;
  role: "SUPERADMIN" | "OWNER" | "MANAGER" | "CUSTOMER";
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: number;
  name: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  owner: User;
  managers: User[];
  members: User[];
  todos: Todo[];
}

export interface Todo {
  id: number;
  title: string;
  status: boolean;
  groupId: number;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
  creator: User;
  group: Group;
}
