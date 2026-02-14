import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { LogOut } from "lucide-react";

import { useUserContext } from "@/contexts/UserContext";
import Server_ROUTEMAP from "@/misc/Server_ROUTEMAP";
import { modifiedFetch } from "@/misc/modifiedFetch";

import type { GetRes } from "@backend/types/req-res";
import type { userLogout } from "@backend/controllers/user";

function Logout() {
  // Use client
  const queryClient = useQueryClient();

  const { user } = useUserContext();

  // Logout Mutation
  const { mutate: logOut, isPending: isLoggingOut } = useMutation({
    mutationFn: () =>
      modifiedFetch<GetRes<typeof userLogout>>(
        Server_ROUTEMAP.users.root + Server_ROUTEMAP.users.userLogout,
        { method: "post" },
      ),
    onSuccess: (data) => {
      if (data) toast.success(data.message);
      queryClient.setQueryData(
        [Server_ROUTEMAP.users.root + Server_ROUTEMAP.users.self],
        null,
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
    throwOnError: true,
  });

  // Return nothing if no user
  if (!user) return <></>;

  return (
    <button
      onClick={() => {
        logOut();
      }}
      disabled={isLoggingOut}
      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
    >
      <LogOut className="w-5 h-5" />
      <span className="hidden sm:inline">Logout</span>
    </button>
  );
}

export default Logout;
