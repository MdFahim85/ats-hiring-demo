import { useState, useEffect } from "react";
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
import { mockHRUsers } from "@/lib/mockData";
import { PenBox } from "lucide-react";

export function EditHRUserModal({ hrId }: { hrId: string | null }) {
  const [formData, setFormData] = useState({
    name: "",
    department: "",
  });

  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (hrId) {
      const hr = mockHRUsers.find((h) => h.id === hrId);
      if (hr) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({
          name: hr.name,
          department: hr.department,
        });
      }
    }
  }, [hrId, open]);

  const handleSave = () => {
    if (hrId) {
      const hrIndex = mockHRUsers.findIndex((h) => h.id === hrId);
      if (hrIndex !== -1) {
        mockHRUsers[hrIndex] = {
          ...mockHRUsers[hrIndex],
          ...formData,
        };
      }
    }
    setModalOpen(false);
  };

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogTrigger asChild>
        <div className="text-md flex gap-2">
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
              disabled={!formData.name || !formData.department}
              className="flex-1 items-center gap-2 px-6 py-3 bg-blue-600"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
