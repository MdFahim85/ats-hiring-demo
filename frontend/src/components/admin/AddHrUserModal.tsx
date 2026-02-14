import { useState } from "react";
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
import { mockHRUsers, mockUsers } from "@/lib/mockData";

export function AddHRUserModal() {
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    password: "",
  });

  const handleSave = () => {
    const newHR = {
      id: `hr-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      department: formData.department,
      password: formData.password, // if you need
      status: "active" as const,
      createdAt: new Date().toISOString().split("T")[0],
    };

    // Add directly to mockHRUsers
    mockHRUsers.push(newHR);

    // Optional: add to mockUsers too
    mockUsers.push({
      id: newHR.id,
      email: newHR.email,
      role: "hr",
      name: newHR.name,
      department: newHR.department,
    });

    setFormData({ name: "", email: "", department: "", password: "" });
    setModalOpen(false);
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
                !formData.password
              }
              className="flex-1 items-center gap-2 px-6 py-3 bg-blue-600"
            >
              Add HR User
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
