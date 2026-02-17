import { useState, type ChangeEventHandler } from "react";
import { Link } from "react-router";
import { Briefcase, Eye, EyeOff } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import Client_ROUTEMAP from "../../misc/Client_ROUTEMAP";
import Server_ROUTEMAP from "../../misc/Server_ROUTEMAP";
import { modifiedFetch } from "../../misc/modifiedFetch.ts";
import Form from "@/components/shared/Form.tsx";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import type { userLogin } from "@backend/controllers/user";
import type { GetReqBody, GetRes } from "@backend/types/req-res";
import { initialUserLoginState } from "@/misc/initialStates.ts";
import type { User } from "@backend/models/User.ts";

export default function Login() {
  const [userData, setUserData] = useState(initialUserLoginState);
  const [showPassword, setShowPassword] = useState(false);

  const queryClient = useQueryClient();

  const onChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value },
  }) => {
    setUserData((prev) => ({ ...prev, [id]: value }));
  };

  const {
    mutate: loginUser,
    isPending: isLoggingIn,
    isError,
    error,
  } = useMutation({
    mutationFn: () =>
      modifiedFetch<GetRes<typeof userLogin>>(
        Server_ROUTEMAP.users.root + Server_ROUTEMAP.users.userLogin,
        {
          method: "post",
          body: JSON.stringify(userData satisfies GetReqBody<typeof userLogin>),
        },
      ),

    onSuccess: (data) => {
      if (data?.message) toast.success(data.message);

      queryClient.invalidateQueries({
        queryKey: [Server_ROUTEMAP.users.root + Server_ROUTEMAP.users.self],
      });
    },

    onError: (error) => {
      error.message?.split(",")?.forEach((err: string) => toast.error(err));
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          to={Client_ROUTEMAP.public.root}
          className="flex items-center justify-center gap-2 mb-6"
        >
          <Briefcase className="w-10 h-10 text-blue-600" />
          <span className="text-2xl text-gray-900">Demo Software</span>
        </Link>

        <h2 className="text-center text-3xl text-gray-900 mb-2">Sign In</h2>
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            to={`${Client_ROUTEMAP.auth.root}/${Client_ROUTEMAP.auth.register}`}
            className="text-blue-600 hover:text-blue-700"
          >
            Sign up
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-gray-200 rounded-lg sm:px-10">
          <Form
            onSubmit={() => {
              loginUser();
            }}
            className="space-y-6"
          >
            {isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                {error?.message?.split(",")?.map((err: string, i: number) => (
                  <p key={i} className="text-sm text-red-700">
                    {err}
                  </p>
                ))}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              {(["email"] satisfies KeyOfObjectOfType<User, string>[]).map(
                (k) => (
                  <>
                    <Label htmlFor={k}>Email address</Label>
                    <Input
                      id={k}
                      type="email"
                      required
                      value={userData[k]}
                      onChange={onChange}
                      placeholder="Enter your email"
                      className={isError ? "border-red-500" : ""}
                    />
                  </>
                ),
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              {(
                ["password"] satisfies KeyOfObjectOfType<User, string | null>[]
              ).map((k) => (
                <>
                  <Label htmlFor={k}>Password</Label>
                  <div className="relative">
                    <Input
                      id={k}
                      type={showPassword ? "text" : "password"}
                      required
                      value={userData[k]}
                      onChange={onChange}
                      placeholder="••••••••"
                      className={`pr-10 ${isError ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                  </div>
                </>
              ))}
            </div>

            <Button
              type="submit"
              disabled={initialUserLoginState === userData || isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoggingIn ? "Signing in..." : "Sign in"}
            </Button>
          </Form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg space-y-2 text-xs">
            <p className="text-blue-900 font-semibold">Demo Credentials:</p>
            <div className="space-y-4 pt-4 text-lg flex gap-4">
              <p className="text-blue-700">
                <Button
                  className="bg-blue-600"
                  onClick={() =>
                    setUserData((prev) => ({
                      ...prev,
                      email: "john.doe@example.com",
                      password: "password123",
                    }))
                  }
                >
                  <strong>Candidate</strong>
                </Button>
              </p>
              <p className="text-blue-700">
                <Button
                  className="bg-blue-600"
                  onClick={() =>
                    setUserData((prev) => ({
                      ...prev,
                      email: "sarah.hr@company.com",
                      password: "password123",
                    }))
                  }
                >
                  <strong>HR</strong>
                </Button>
              </p>
              <p className="text-blue-700">
                <Button
                  className="bg-blue-600"
                  onClick={() =>
                    setUserData((prev) => ({
                      ...prev,
                      email: "admin@test.com",
                      password: "password123",
                    }))
                  }
                >
                  <strong>Admin</strong>
                </Button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
