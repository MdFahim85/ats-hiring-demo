import { useEffect, useState, type ChangeEventHandler } from "react";
import { Link, useNavigate } from "react-router";
import { Briefcase, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Client_ROUTEMAP from "../../misc/Client_ROUTEMAP";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type LoginUser = {
  email: string;
  password: string;
};

const initialState: LoginUser = {
  email: "",
  password: "",
};

export default function Login() {
  const [userData, setUserData] = useState<LoginUser>(initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  const onChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { id, value },
  }) => {
    setUserData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const success = await login(userData.email, userData.password);
    setIsLoading(false);

    if (!success) {
      setError("Invalid email or password");
    }
  };

  useEffect(() => {
    if (!user) return;

    switch (user.role) {
      case "admin":
        navigate(
          `${Client_ROUTEMAP.admin.root}/${Client_ROUTEMAP.admin.dashboard}`,
        );
        break;
      case "hr":
        navigate(`${Client_ROUTEMAP.hr.root}/${Client_ROUTEMAP.hr.dashboard}`);
        break;
      case "candidate":
        navigate(
          `${Client_ROUTEMAP.candidate.root}/${Client_ROUTEMAP.candidate.dashboard}`,
        );
        break;
      default:
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setError("Unknown user role");
    }
  }, [user, navigate]);

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
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                required
                value={userData.email}
                onChange={onChange}
                placeholder="Enter your email"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={userData.password}
                  onChange={onChange}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg space-y-2 text-xs">
            <p className="text-blue-900 font-semibold">Demo Credentials:</p>
            <div className="space-y-4 pt-4 text-lg">
              <p className="text-blue-700">
                <strong>Candidate:</strong> john.doe@example.com | password123
              </p>
              <p className="text-blue-700">
                <strong>HR:</strong> sarah.hr@company.com | password123
              </p>
              <p className="text-blue-700">
                <strong>Admin:</strong> admin@company.com | password123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
