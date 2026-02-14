import type { User } from "@backend/models/User";

export const initialUserLoginState: Pick<User, "email" | "password"> = {
  email: "",
  password: "",
};

export const initialUserRegisterState: User & { confirmPassword: string } = {
  id: -1,
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: "candidate",
  profilePicture: "",
  status: "active",
  cvUrl: "",
  department: "",
  createdAt: new Date(),
};
