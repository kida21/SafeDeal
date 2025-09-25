import { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { authApi, userApi } from "../lib/api";
import { toast } from "react-hot-toast";
import { LoginRequest, RegisterRequest } from "../types";
import { useNavigate } from "react-router-dom";

interface AuthFormProps {
  initialMode?: "login" | "register";
}

const AuthForm = ({ initialMode = "login" }: AuthFormProps) => {
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginRequest & RegisterRequest>();

  const onSubmit = async (data: LoginRequest | RegisterRequest) => {
    setIsLoading(true);
    try {
      let response;
      if (isLogin) {
        response = await authApi.login(data as LoginRequest);
        // Be resilient to different token field names
        const body: any = response?.data || {};
        const accessToken = body.access_token || body.accessToken || body.token || response?.headers?.["authorization"]?.replace(/^Bearer\s+/i, "");
        const refreshToken = body.refresh_token || body.refreshToken || body.refresh || '';

        if (!accessToken) {
          toast.error("Login succeeded but no access token returned by server.");
          return;
        }

        try { localStorage.setItem("access_token", accessToken); } catch {}
        if (refreshToken) {
          try { localStorage.setItem("refresh_token", refreshToken); } catch {}
        }

        // Fetch fresh profile to ensure activation and details are current
        try {
          const profileResp = await userApi.getProfile();
          const profile = profileResp.data;
          setUser(profile);
          try { localStorage.setItem("user_profile", JSON.stringify(profile)); } catch {}
        } catch (e) {
          // If profile fails immediately after login, force user to re-auth
          toast.error("Failed to load profile after login. Please try again.");
          return;
        }

        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        response = await authApi.register(data as RegisterRequest);
        toast(
          "Account created. Please verify your email (Mailtrap) to activate.",
          { icon: "✉️" }
        );
        navigate("/");
        return;
      }
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        JSON.stringify(error);
      toast.error(apiMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: "login" | "register") => {
    setIsLogin(tab === "login");
    reset();
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
      <div className="flex mb-8">
        <button
          onClick={() => handleTabChange("login")}
          className={`flex-1 py-3 px-4 text-sm font-medium rounded-l-lg transition-colors ${
            isLogin
              ? "bg-primary-800 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => handleTabChange("register")}
          className={`flex-1 py-3 px-4 text-sm font-medium rounded-r-lg transition-colors ${
            !isLogin
              ? "bg-primary-800 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {!isLogin && (
          <>
            <div className="flex space-x-4">
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  {...register("first_name", {
                    required: "First name is required",
                  })}
                  className="input w-full"
                  placeholder="Enter your first name"
                />
                {errors.first_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.first_name.message}
                  </p>
                )}
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  {...register("last_name", {
                    required: "Last name is required",
                  })}
                  className="input w-full"
                  placeholder="Enter your last name"
                />
                {errors.last_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profession
              </label>
              <input
                {...register("profession", {
                  required: "Profession is required",
                })}
                className="input w-full"
                placeholder="e.g., Software Engineer, Designer"
              />
              {errors.profession && (
                <p className="text-red-500 text-sm mt-1">
                  {(errors as any).profession?.message}
                </p>
              )}
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Invalid email address",
              },
            })}
            type="email"
            className="input w-full"
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
              type={showPassword ? "text" : "password"}
              className="input w-full pr-10"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary btn-md w-full"
        >
          {isLoading ? "Loading..." : isLogin ? "Login" : "Create Account"}
        </button>
      </form>

      {isLogin && (
        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{" "}
          <button
            onClick={() => handleTabChange("register")}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Create new account
          </button>
        </p>
      )}
    </div>
  );
};

export default AuthForm;
