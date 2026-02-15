import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Eye, EyeOff, Upload } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEventHandler } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router";

import Client_ROUTEMAP from "../../misc/Client_ROUTEMAP";
import Server_ROUTEMAP from "../../misc/Server_ROUTEMAP";
import { modifiedFetch } from "../../misc/modifiedFetch";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import Form from "@/components/shared/Form";
import { initialUserRegisterState } from "@/misc/initialStates";

import type { userRegister } from "@backend/controllers/user";
import type { User } from "@backend/models/User";
import type { GetReqBody, GetRes } from "@backend/types/req-res";

export default function CandidateRegister() {
  const [user, setUser] = useState(initialUserRegisterState);

  const [userProcessed, setUserProcessed] = useState<{
    previews: Partial<Record<keyof User, string>>;
    form: FormData;
  }>({ form: new FormData(), previews: {} });

  const [show, setShow] = useState({
    password: false,
    confirmPassword: false,
  });

  const userInputRef = useRef<{
    [x in keyof User]?: HTMLInputElement | null;
  }>({
    profilePicture: null,
    cvUrl: null,
  });

  const queryClient = useQueryClient();

  const onChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value },
  }) =>
    setUser((user) => ({
      ...user,
      [id]: (
        ["profilePicture"] satisfies KeyOfObjectOfType<
          User,
          string
        >[] as string[]
      ).includes(id)
        ? userInputRef.current[id as keyof User]?.files?.item(0)?.name || ""
        : value,
    }));

  useEffect(() => {
    // Profile Picture Preview
    if (userInputRef.current.profilePicture?.files?.item(0))
      userInputRef.current.profilePicture.files[0]
        .arrayBuffer()
        .then((buffer) => {
          const profilePicture = URL.createObjectURL(new Blob([buffer]));

          setUserProcessed((processedUser) =>
            Object.assign(
              {
                ...processedUser,
                previews: {
                  ...processedUser.previews,
                  profilePicture,
                },
              },
              { form: processedUser.form },
            ),
          );
        });

    // CV Preview (store filename only)
    if (userInputRef.current.cvUrl?.files?.item(0)) {
      setUserProcessed((processedUser) =>
        Object.assign(
          {
            ...processedUser,
            previews: {
              ...processedUser.previews,
              cvUrl: userInputRef.current.cvUrl?.files?.item(0)?.name || "",
            },
          },
          { form: processedUser.form },
        ),
      );
    }

    const form = new FormData();

    form.append(
      "json",
      JSON.stringify(user satisfies GetReqBody<typeof userRegister>),
    );

    Object.entries(userInputRef.current).forEach(([key, htmlInputElement]) => {
      if (!htmlInputElement) return;

      if (htmlInputElement.files?.item(0))
        form.append(key, htmlInputElement.files[0]);
    });

    setUserProcessed((processedUser) => ({
      ...processedUser,
      form,
    }));
  }, [user]);

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

      return modifiedFetch<GetRes<typeof userRegister>>(
        Server_ROUTEMAP.users.root + Server_ROUTEMAP.users.userRegister,
        {
          method: "post",
          body: userProcessed.form,
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
          <Form
            onSubmit={() => {
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
                {(
                  ["name"] satisfies KeyOfObjectOfType<User, string | null>[]
                ).map((k) => (
                  <>
                    <Label htmlFor={k}>Full Name *</Label>
                    <Input
                      id="name"
                      value={user[k]}
                      onChange={onChange}
                      required
                    />
                  </>
                ))}
              </div>

              <div className="space-y-2">
                {(
                  ["email"] satisfies KeyOfObjectOfType<User, string | null>[]
                ).map((k) => (
                  <>
                    <Label htmlFor={k}>Email Address *</Label>
                    <Input
                      id={k}
                      type="email"
                      value={user[k]}
                      onChange={onChange}
                      required
                    />
                  </>
                ))}
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              {(
                ["phone"] satisfies KeyOfObjectOfType<User, string | null>[]
              ).map((k) => (
                <>
                  <Label htmlFor={k}>Phone Number *</Label>
                  <Input
                    id={k}
                    value={user[k] ?? ""}
                    onChange={onChange}
                    required
                  />
                </>
              ))}
            </div>

            {/* Password */}
            <div className="space-y-2">
              {(
                ["password"] satisfies KeyOfObjectOfType<User, string | null>[]
              ).map((k) => (
                <>
                  <Label htmlFor={k}>Password *</Label>
                  <div className="relative">
                    <Input
                      id={k}
                      type={show.password ? "text" : "password"}
                      value={user[k]}
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
                </>
              ))}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              {(
                ["confirmPassword"] satisfies KeyOfObjectOfType<
                  typeof user,
                  string | null
                >[]
              ).map((k) => (
                <>
                  <Label htmlFor={k}>Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id={k}
                      type={show.confirmPassword ? "text" : "password"}
                      value={user[k]}
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
                </>
              ))}
            </div>

            {/* Profile Picture */}
            <div className="space-y-2">
              {(
                ["profilePicture"] satisfies KeyOfObjectOfType<
                  User,
                  string | null
                >[]
              ).map((k) => (
                <>
                  <Label>Profile Picture (Optional)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      ref={(ref) => {
                        userInputRef.current.profilePicture = ref;
                      }}
                      onChange={onChange}
                      type="file"
                      accept="image/*"
                      hidden
                      id={k}
                    />
                    <label htmlFor={k} className="cursor-pointer">
                      {userProcessed.previews.profilePicture ? (
                        <img
                          src={userProcessed.previews.profilePicture}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-full mx-auto mb-3"
                        />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            Click to upload profile picture
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </>
              ))}
            </div>

            {/* CV */}
            <div className="space-y-2">
              {(
                ["cvUrl"] satisfies KeyOfObjectOfType<User, string | null>[]
              ).map((k) => (
                <>
                  <Label>Resume / CV </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      ref={(ref) => {
                        userInputRef.current.cvUrl = ref;
                      }}
                      onChange={onChange}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      hidden
                      required
                      id={k}
                    />
                    <label htmlFor={k} className="cursor-pointer">
                      {userProcessed.previews.cvUrl ? (
                        <p className="text-sm text-gray-700 mb-2">
                          Selected: {userProcessed.previews.cvUrl}
                        </p>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            Click to upload resume (PDF, DOC, DOCX)
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </>
              ))}
            </div>

            <Button
              type="submit"
              disabled={initialUserRegisterState === user || isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isPending ? "Creating Account..." : "Create Account"}
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
}
