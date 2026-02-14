import {
  useState,
  useRef,
  type ChangeEventHandler,
  type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router";
import { Briefcase, Upload, Check, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Client_ROUTEMAP from "../../misc/Client_ROUTEMAP";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type RegisterUser = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const initialState: RegisterUser = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function CandidateRegister() {
  const [user, setUser] = useState<RegisterUser>(initialState);
  const [show, setShow] = useState({
    password: false,
    confirmPassword: false,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const profilePictureRef = useRef<HTMLInputElement | null>(null);
  const cvRef = useRef<HTMLInputElement | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const onChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value },
  }) => {
    setUser((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (user.password !== user.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (user.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    const success = await register({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: user.password,
      profilePicture: profilePictureRef.current?.files?.[0].name,
      cvUrl: cvRef.current?.files?.[0].name,
    });

    setIsLoading(false);

    if (success) {
      setSuccess(true);
      setTimeout(() => {
        navigate(
          `${Client_ROUTEMAP.candidate.root}/${Client_ROUTEMAP.candidate.dashboard}`,
        );
      }, 2000);
    } else {
      setError("Email already exists");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl text-gray-900 mb-2">
            Registration Successful!
          </h2>
          <p className="text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

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
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
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
                  placeholder="John Doe"
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
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={user.phone}
                onChange={onChange}
                placeholder="+1 (555) 123-4567"
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
                  placeholder="••••••••"
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
                  placeholder="••••••••"
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
              <Label>Resume / CV (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={cvRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  hidden
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
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
