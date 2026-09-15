import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { motion } from "framer-motion";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [emailMasked, setEmailMasked] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError("Missing password reset token. Please request a new reset link.");
      return;
    }

    const verifyToken = async () => {
      try {
        setVerifying(true);
        const res = await api.get(`/verify-reset-token?token=${encodeURIComponent(token)}`);
        if (res.data.valid) {
          setTokenValid(true);
          setEmailMasked(res.data.email_masked || "");
        }
      } catch (err) {
        setTokenValid(false);
        setTokenError(
          err.response?.data?.detail ||
            "This password reset link is invalid, has expired, or was already used."
        );
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation password do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/reset-password", {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to reset password. The link may have expired. Please request a new one."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-12">
      {/* Background glow decoration */}
      <div className="absolute w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-8 backdrop-blur-xl relative z-10"
      >
        {/* State 1: Verifying Token */}
        {verifying && (
          <div className="text-center py-10 space-y-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-white">Verifying Reset Link...</h2>
            <p className="text-slate-400 text-xs">
              Checking token validity and security permissions.
            </p>
          </div>
        )}

        {/* State 2: Invalid / Expired Token */}
        {!verifying && !tokenValid && (
          <div className="text-center py-6 space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Invalid or Expired Link
              </h2>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                {tokenError}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Request a New Reset Link</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}

        {/* State 3: Password Successfully Reset */}
        {!verifying && tokenValid && success && (
          <div className="text-center py-6 space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Password Reset Complete!
              </h2>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Your password has been successfully updated. You can now log in using your new credentials.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In to SwipeX</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* State 4: Reset Form */}
        {!verifying && tokenValid && !success && (
          <div>
            {/* Header */}
            <div className="text-center mb-7">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Create New Password
              </h1>
              {emailMasked ? (
                <p className="text-slate-400 text-xs mt-1.5 font-medium">
                  Resetting credentials for <span className="text-blue-400 font-semibold">{emailMasked}</span>
                </p>
              ) : (
                <p className="text-slate-400 text-xs mt-1.5">
                  Choose a secure password for your SwipeX account
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-rose-400 text-sm flex items-start gap-2.5"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
                <div className="flex-1">{error}</div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password (min. 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-11 pr-12 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition focus:outline-none cursor-pointer"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-11 pr-12 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition focus:outline-none cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Validation helper text */}
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-rose-400 font-medium">
                  Passwords do not match.
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || (confirmPassword.length > 0 && newPassword !== confirmPassword)}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <>
                    <span>Set New Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center pt-5 border-t border-slate-800">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel and return to Login
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

