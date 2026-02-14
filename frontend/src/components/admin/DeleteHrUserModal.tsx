import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
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
import { Trash } from "lucide-react";
import { modifiedFetch } from "@/misc/modifiedFetch";
import Server_ROUTEMAP from "@/misc/Server_ROUTEMAP";

import type { deleteHr } from "@backend/controllers/admin";
import type { GetRes } from "@backend/types/req-res";

export function DeleteHRUserModal({ hrId }: { hrId: number }) {
  const queryClient = useQueryClient();

  const { mutate: deleteHRUser, isPending } = useMutation({
    mutationFn: () =>
      modifiedFetch<GetRes<typeof deleteHr>>(
        Server_ROUTEMAP.admin.root +
          Server_ROUTEMAP.admin.deleteHr.replace(
            Server_ROUTEMAP.admin._params.hrId,
            hrId.toString(),
          ),
        { method: "delete" },
      ),
    onSuccess: (data) => {
      if (data) toast.success(data.message);

      queryClient.invalidateQueries({
        queryKey: [Server_ROUTEMAP.users.root + Server_ROUTEMAP.users.get],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <div className="text-md flex gap-2 cursor-pointer text-red-600 hover:text-red-700">
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
            onClick={() => deleteHRUser()}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
