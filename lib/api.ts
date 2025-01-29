import { User } from "@/types";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const api = {
  // User Management
  createUser: async (phoneNumber: string,UserEmail: string,UserName: string, role: User["role"], clerkId: string) => {
    console.log("Creating user:", phoneNumber, UserEmail, UserName, role,clerkId);
    console.log("API URL:", API_URL);
    const res = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, email:UserEmail, name:UserName, role, clerkId }),
    });
    const data = await res.json();
    
    if (res.status === 400) {
      throw new Error("User with this phone number already exists");
    }
    
    if (!res.ok) {
      throw new Error(data.message || "Failed to create user");
    }
    
    return data;
  },

  // SuperAdmin Routes
  getAllGroups: async () => {
    const res = await fetch(`${API_URL}/admin/groups`);
    return res.json();
  },

  deleteGroup: async (groupId: number) => {
    const res = await fetch(`${API_URL}/admin/groups/${groupId}`, {
      method: "DELETE",
    });
    return res.json();
  },

  // Owner Routes
  createGroup: async (name: string, ownerId: number) => {
    const res = await fetch(`${API_URL}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ownerId }),
    });
    return res.json();
  },

  getOwnerGroups: async (ownerId: number) => {
    const res = await fetch(`${API_URL}/owners/${ownerId}/groups`);
    return res.json();
  },

  addManager: async (groupId: number, managerId: number) => {
    
   try {
     const res = await fetch(`${API_URL}/groups/${groupId}/managers`, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ managerId: managerId.toString() }),
     });
     return res.json();
   } catch (error) {
    console.error('Error adding manager:', error);
    throw error;
   }
  },

  addManagerByPhone: async (groupId: number, phoneNumber: string) => {
    const res = await fetch(`${API_URL}/groups/${groupId}/managers/phone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    });
    return res.json();
  },

  removeManager: async (groupId: number, managerId: number) => {
    const res = await fetch(
      `${API_URL}/groups/${groupId}/managers/${managerId}`,
      {
        method: "DELETE",
      }
    );
    return res.json();
  },

  // Manager Routes
  getManagerGroups: async (managerId: number) => {
    const res = await fetch(`${API_URL}/managers/${managerId}/groups`);
    return res.json();
  },

  addMember: async (groupId: number, memberId: number) => {
    const res = await fetch(`${API_URL}/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: memberId.toString() }),
    });
    console.log("Response:", await res.json());
    return res;
  },

  //join a group by group id and user id
// app.post("/groups/:groupId/members", async (req: Request, res: Response) => {
//   try {
//     console.log("Joining group: ", req.params, req.body);
//     const { groupId } = req.params;

//     const groupInDB = await prisma.group.findUnique({
//       where: { id: parseInt(groupId) },
//     });
//     if (!groupInDB) {
//       throw new Error('Group not found');
//     }
    
//     const { userId } = req.body;
//     const group = await prisma.group.update({
//       where: { id: parseInt(groupId) },
//       data: { members: { connect: { id: parseInt(userId) } } }
//     });
//     res.status(200).json({ success: true, group });
//     console.log("User joined group: ", group);
//   } catch (error) {
//     console.error('Error joining group:', error);
//     res.status(500).json({ error: "Error joining group" });
//   }
// });

  removeMember: async (groupId: number, memberId: number) => {
    const res = await fetch(
      `${API_URL}/groups/${groupId}/members/${memberId}`,
      {
        method: "DELETE",
      }
    );
    return res.json();
  },

  // Customer Routes
  getUserGroups: async (userId: number) => {
    const res = await fetch(`${API_URL}/users/${userId}/groups`);
    return res.json();
  },

  // Todo Routes
  createTodo: async (groupId: number, title: string, creatorId: number) => {
    const res = await fetch(`${API_URL}/groups/${groupId}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, creatorId }),
    });
    return res.json();
  },

  updateTodo: async (
    todoId: number,
    data: { title?: string; status?: boolean }
  ) => {
    const res = await fetch(`${API_URL}/todos/${todoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteTodo: async (todoId: number) => {
    const res = await fetch(`${API_URL}/todos/${todoId}`, {
      method: "DELETE",
    });
    return res.json();
  },

  getGroupTodos: async (groupId: number) => {
    const res = await fetch(`${API_URL}/groups/${groupId}/todos`);
    return res.json();
  },
};

export default api;
