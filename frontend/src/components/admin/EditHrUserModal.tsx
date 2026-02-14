import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { PenBox } from "lucide-react";
import { modifiedFetch } from "@/misc/modifiedFetch";
import Server_ROUTEMAP from "@/misc/Server_ROUTEMAP";

import type { updateHr } from "@backend/controllers/admin";
import type { getHrById } from "@backend/controllers/admin";
import type { GetReqBody, GetRes } from "@backend/types/req-res";

export function EditHRUserModal({ hrId }: { hrId: number }) {
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);

  const { data: hrUser } = useQuery({
    queryKey: [
      Server_ROUTEMAP.admin.root + Server_ROUTEMAP.admin.getHrById,
      hrId,
    ],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getHrById>>(
        Server_ROUTEMAP.admin.root +
          Server_ROUTEMAP.admin.getHrById.replace(
            Server_ROUTEMAP.admin._params.hrId,
            hrId.toString(),
          ),
      ),
    retry: false,
  });

  const [formData, setFormData] = useState({
    name: hrUser?.name ?? "",
    department: hrUser?.department ?? "",
  });

  const { mutate: updateHRUser, isPending } = useMutation({
    mutationFn: () => {
      return modifiedFetch<GetRes<typeof updateHr>>(
        Server_ROUTEMAP.admin.root +
          Server_ROUTEMAP.admin.updateHr.replace(
            Server_ROUTEMAP.admin._params.hrId,
            hrId.toString(),
          ),
        {
          method: "put",
          body: JSON.stringify(formData satisfies GetReqBody<typeof updateHr>),
        },
      );
    },
    onSuccess: (data) => {
      if (data) toast.success(data.message);

      queryClient.invalidateQueries({
        queryKey: [Server_ROUTEMAP.users.root + Server_ROUTEMAP.users.get],
      });

      setModalOpen(false);
    },
    onError: (error) => {
      error.message?.split(",")?.forEach((msg: string) => toast.error(msg));
    },
  });

  const handleSave = () => {
    updateHRUser();
  };

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogTrigger asChild>
        <div className="text-md flex gap-2 cursor-pointer">
          <PenBox className="w-5 h-5" /> Edit
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-md w-full p-6">
        <DialogHeader>
          <DialogTitle>Edit HR User</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="John Doe"
            />
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="edit-department">Department *</Label>
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
              disabled={!formData.name || !formData.department || isPending}
              className="flex-1 items-center gap-2 px-6 py-3 bg-blue-600"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
