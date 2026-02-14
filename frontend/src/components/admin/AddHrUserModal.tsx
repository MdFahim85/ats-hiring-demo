import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { modifiedFetch } from "@/misc/modifiedFetch";
import Server_ROUTEMAP from "@/misc/Server_ROUTEMAP";

import type { createHr } from "@backend/controllers/admin";
import type { GetReqBody, GetRes } from "@backend/types/req-res";

const initialHRUserState = {
  name: "",
  email: "",
  password: "",
  role: "hr" as const,
  phone: "",
  department: "",
  profilePicture: "",
  status: "active" as const,
  createdAt: new Date(),
};

export function AddHRUserModal() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialHRUserState);

  const { mutate: createHRUser, isPending } = useMutation({
    mutationFn: () => {
      return modifiedFetch<GetRes<typeof createHr>>(
        Server_ROUTEMAP.admin.root + Server_ROUTEMAP.admin.createHr,
        {
          method: "post",
          body: JSON.stringify(formData satisfies GetReqBody<typeof createHr>),
        },
      );
    },
    onSuccess: (data) => {
      if (data) toast.success(data.message);

      queryClient.invalidateQueries({
        queryKey: [Server_ROUTEMAP.users.root + Server_ROUTEMAP.users.get],
      });

      setFormData(initialHRUserState);
      setModalOpen(false);
    },
    onError: (error) => {
      error.message?.split(",")?.forEach((msg: string) => toast.error(msg));
    },
  });

  const handleSave = () => {
    createHRUser();
  };

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 px-6 py-3 bg-blue-600">
          <Plus className="w-5 h-5" /> Add HR User
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md w-full p-6">
        <DialogHeader>
          <DialogTitle>Add New HR User</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="John Doe"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="john@company.com"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="********"
            />
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Select
              value={formData.department}
              onValueChange={(value: string) =>
                setFormData((prev) => ({ ...prev, department: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Product">Product</SelectItem>
                <SelectItem value="Analytics">Analytics</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !formData.name ||
                !formData.email ||
                !formData.department ||
                !formData.password ||
                isPending
              }
              className="flex-1 items-center gap-2 px-6 py-3 bg-blue-600"
            >
              {isPending ? "Adding..." : "Add HR User"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
