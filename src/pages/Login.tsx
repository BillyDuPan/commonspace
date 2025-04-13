import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSignUp = location.pathname === "/signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), {
          email: email,
          name: name,
          role: "user",
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/");
    } catch (error: any) {
      let errorMessage = `Failed to ${
        isSignUp ? "sign up" : "sign in"
      }. Please check your credentials.`;
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email already in use. Please sign in.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Weak password. Please use a stronger password.";
      } else {
        errorMessage = `Failed to ${isSignUp ? "sign up" : "sign in"}. Please check your credentials.`;
      }

      setError(errorMessage);
      console.error(isSignUp ? "Sign-up error:" : "Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-12">
      <div className="w-full max-w-md px-6">
        <div className="card rounded-lg p-8">
          <h1 className="page-header text-center mb-6">
            {isSignUp ? "Sign Up" : "Welcome Back"}
          </h1>

          {error && (
            <div className="alert alert-error mb-6">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Your Name"
                  required
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="yourname@example.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>            

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (isSignUp ? "Signing up..." : "Signing in...") : isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>

          {!isSignUp && (
            <div className="mt-4 text-center">
              <Link to="/signup" className="text-primary hover:text-primary-dark text-sm">
                Don't have an account? Sign Up
              </Link>
            </div>
          )}

          {isSignUp && (
            <div className="mt-4 text-center">
              <Link to="/login" className="text-primary hover:text-primary-dark text-sm">
                Already have an account? Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}