import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { mockHRUsers } from "@/lib/mockData";
import { useState } from "react";
import { Trash } from "lucide-react";

export function DeleteHRUserModal({ hrId }: { hrId: string | null }) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleDelete = () => {
    if (hrId) {
      const hrIndex = mockHRUsers.findIndex((h) => h.id === hrId);
      if (hrIndex !== -1) {
        mockHRUsers.splice(hrIndex, 1);
      }
    }
    setModalOpen(false);
  };

  return (
    <AlertDialog open={modalOpen} onOpenChange={setModalOpen}>
      <AlertDialogTrigger asChild>
        <div className="text-md flex gap-2">
          <Trash className="w-5 h-5" /> Delete
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the HR
            user and remove their data from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
