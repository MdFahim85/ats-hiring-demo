import { useState, useRef, type ChangeEventHandler } from "react";
import { Link } from "react-router";
import { Briefcase, Upload, Eye, EyeOff } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import Client_ROUTEMAP from "../../misc/Client_ROUTEMAP";
import Server_ROUTEMAP from "../../misc/Server_ROUTEMAP";
import { modifiedFetch } from "../../misc/modifiedFetch";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import type { userRegister } from "@backend/controllers/user";
import type { GetReqBody, GetRes } from "@backend/types/req-res";
import { initialUserRegisterState } from "@/misc/initialStates";

export default function CandidateRegister() {
  const [user, setUser] = useState(initialUserRegisterState);
  const [show, setShow] = useState({
    password: false,
    confirmPassword: false,
  });

  const profilePictureRef = useRef<HTMLInputElement | null>(null);
  const cvRef = useRef<HTMLInputElement | null>(null);

  const queryClient = useQueryClient();

  const onChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value },
  }) => {
    setUser((prev) => ({ ...prev, [id]: value }));
  };

  const {
    mutate: registerUser,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: () => {
      if (user.password !== user.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (user.password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      const form = new FormData();

      form.append(
        "json",
        JSON.stringify(user satisfies GetReqBody<typeof userRegister>),
      );

      if (profilePictureRef.current?.files?.[0]) {
        form.append("profilePicture", profilePictureRef.current.files[0]);
      }

      if (cvRef.current?.files?.[0]) {
        form.append("cvUrl", cvRef.current.files[0]);
      }

      return modifiedFetch<GetRes<typeof userRegister>>(
        Server_ROUTEMAP.users.root + Server_ROUTEMAP.users.userRegister,
        {
          method: "post",
          body: form,
        },
      );
    },

    onSuccess: async (data) => {
      if (data?.message) toast.success(data.message);

      await queryClient.invalidateQueries({
        queryKey: [Server_ROUTEMAP.users.root + Server_ROUTEMAP.users.self],
      });
    },

    onError: (err) => {
      err.message?.split(",")?.forEach((msg: string) => toast.error(msg));
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Link
          to={Client_ROUTEMAP.public.root}
          className="flex items-center justify-center gap-2 mb-6"
        >
          <Briefcase className="w-10 h-10 text-blue-600" />
          <span className="text-2xl text-gray-900">Demo Software</span>
        </Link>

        <div className="text-center mb-8">
          <h2 className="text-3xl text-gray-900 mb-2">Create Your Account</h2>
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to={`${Client_ROUTEMAP.auth.root}/${Client_ROUTEMAP.auth.login}`}
              className="text-blue-600 hover:text-blue-700"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow-sm border border-gray-200 rounded-lg sm:px-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              registerUser();
            }}
            className="space-y-6"
          >
            {isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                {error?.message?.split(",")?.map((msg: string, i: number) => (
                  <p key={i} className="text-sm text-red-700">
                    {msg}
                  </p>
                ))}
              </div>
            )}

            {/* Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-normal">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={user.name}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  onChange={onChange}
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={user.phone ?? ""}
                onChange={onChange}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show.password ? "text" : "password"}
                  value={user.password}
                  onChange={onChange}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() =>
                    setShow((s) => ({ ...s, password: !s.password }))
                  }
                >
                  {show.password ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={show.confirmPassword ? "text" : "password"}
                  value={user.confirmPassword}
                  onChange={onChange}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() =>
                    setShow((s) => ({
                      ...s,
                      confirmPassword: !s.confirmPassword,
                    }))
                  }
                >
                  {show.confirmPassword ? (
                    <Eye size={15} />
                  ) : (
                    <EyeOff size={15} />
                  )}
                </button>
              </div>
            </div>

            {/* Profile Picture */}
            <div className="space-y-2">
              <Label>Profile Picture (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={profilePictureRef}
                  type="file"
                  accept="image/*"
                  hidden
                  id="profile-picture"
                />
                <label htmlFor="profile-picture" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload profile picture
                  </p>
                </label>
              </div>
            </div>

            {/* CV */}
            <div className="space-y-2">
              <Label>Resume / CV </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={cvRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  hidden
                  required
                  id="cv-upload"
                />
                <label htmlFor="cv-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload resume (PDF, DOC, DOCX)
                  </p>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={initialUserRegisterState === user || isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isPending ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
