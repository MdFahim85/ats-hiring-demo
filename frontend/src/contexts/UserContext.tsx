import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useMemo,
  type FC,
  type PropsWithChildren,
} from "react";

import { modifiedFetch } from "../misc/modifiedFetch";
import Server_ROUTEMAP from "../misc/Server_ROUTEMAP";

import type { getSelf } from "@backend/controllers/user";
import type { User } from "@backend/models/User";
import type { GetRes } from "@backend/types/req-res";

const UserContext = createContext<
  { user?: Omit<User, "password">; isLoading: boolean } | undefined
>(undefined);

export default UserContext;

// eslint-disable-next-line react-refresh/only-export-components
export const useUserContext = () => {
  const user = useContext(UserContext);

  if (!user) throw new Error("Context not in tree");

  return user;
};

export const UserContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const { data: user, isLoading } = useQuery({
    queryKey: [Server_ROUTEMAP.users.root + Server_ROUTEMAP.users.self],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getSelf>>(
        Server_ROUTEMAP.users.root + Server_ROUTEMAP.users.self,
      ),
    retry: false,
  });

  const value = useMemo(() => ({ user, isLoading }), [user, isLoading]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
