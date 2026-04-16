"use client";

import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Alert, Button, Form } from "react-bootstrap";
import { useNavigate, useLocation, Link } from "react-router-dom";
import background from "../../assests/images/login.png";

// Define BASE_URL based on environment
const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const styles = `
  input[type="password"]::-ms-reveal,
  input[type="password"]::-ms-clear {
    display: none !important;
  }
  input[type="password"] {
    -webkit-appearance: none;
    appearance: none;
  }
  .auth-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    width: 100vw;
    overflow: hidden;
    background-image: url(${background});
    background-repeat: no-repeat;
    background-position: center center;
    background-size: cover;
    background-color: #1C1C1C; /* Fallback color if image fails */
  }
  .login-box {
    width: 400px;
    padding: 40px;
    background: rgba(0, 0, 0, 0.84);
    box-sizing: border-box;
    box-shadow: 0 15px 25px rgba(0,0,0,.6);
    border-radius: 10px;
  }
  .login-box h2 {
    margin: 0 0 30px;
    padding: 0;
    color: #fff;
    text-align: center;
    font-size: 1.5rem;
    font-weight: bold;
    letter-spacing: 1px;
  }
  .login-box .user-box {
    position: relative;
  }
  .login-box .user-box input {
    width: 100%;
    padding: 10px 0;
    font-size: 16px;
    color: #fff;
    margin-bottom: 30px;
    border: none;
    border-bottom: 1px solid #fff;
    outline: none;
    background: transparent;
  }
  .login-box .user-box label {
    position: absolute;
    top: 0;
    left: 0;
    padding: 10px 0;
    font-size: 16px;
    color: #fff;
    pointer-events: none;
    transition: .5s;
  }
  .login-box .user-box input:focus ~ label,
  .login-box .user-box input:valid ~ label {
    top: -20px;
    left: 0;
    color: #fff;
    font-size: 12px;
  }
  .login-box .submit-btn {
    position: relative;
    display: inline-block;
    padding: 10px 20px;
    font-weight: bold;
    color: #fff;
    font-size: 16px;
    text-decoration: none;
    text-transform: uppercase;
    overflow: hidden;
    transition: .5s;
    margin-top: 40px;
    letter-spacing: 3px;
    background: transparent;
    border: none;
    cursor: pointer;
    width: 100%;
    text-align: center;
  }
  .login-box .submit-btn:hover {
    background: #fff;
    color: #272727;
    border-radius: 5px;
  }
  .login-box .submit-btn span {
    position: absolute;
    display: block;
  }
  .login-box .submit-btn span:nth-child(1) {
    top: 0;
    left: -100%;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #fff);
    animation: btn-anim1 1.5s linear infinite;
  }
  @keyframes btn-anim1 {
    0% { left: -100%; }
    50%,100% { left: 100%; }
  }
  .login-box .submit-btn span:nth-child(2) {
    top: -100%;
    right: 0;
    width: 2px;
    height: 100%;
    background: linear-gradient(180deg, transparent, #fff);
    animation: btn-anim2 1.5s linear infinite;
    animation-delay: .375s;
  }
  @keyframes btn-anim2 {
    0% { top: -100%; }
    50%,100% { top: 100%; }
  }
  .login-box .submit-btn span:nth-child(3) {
    bottom: 0;
    right: -100%;
    width: 100%;
    height: 2px;
    background: linear-gradient(270deg, transparent, #fff);
    animation: btn-anim3 1.5s linear infinite;
    animation-delay: .75s;
  }
  @keyframes btn-anim3 {
    0% { right: -100%; }
    50%,100% { right: 100%; }
  }
  .login-box .submit-btn span:nth-child(4) {
    bottom: -100%;
    left: 0;
    width: 2px;
    height: 100%;
    background: linear-gradient(360deg, transparent, #fff);
    animation: btn-anim4 1.5s linear infinite;
    animation-delay: 1.125s;
  }
  @keyframes btn-anim4 {
    0% { bottom: -100%; }
    50%,100% { bottom: 100%; }
  }
  .login-box .forgot-password {
    color: #fff;
    text-decoration: none;
    font-size: 14px;
    transition: .5s;
  }
  .login-box .forgot-password:hover {
    background: transparent;
    color: #aaa;
    border-radius: 5px;
  }
  .alert-danger {
    background-color: #721C24;
    color: #fff;
    border: none;
    border-radius: 5px;
    margin-bottom: 20px;
  }
  .password-toggle {
    position: absolute;
    right: 0;
    top: 10px;
    color: #fff;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 16px;
  }
  @media (max-width: 576px) {
    .login-box {
      width: 90%;
      padding: 20px;
    }
    .login-box h2 {
      font-size: 1.2rem;
    }
    .login-box .user-box input {
      font-size: 14px;
    }
    .login-box .user-box label {
      font-size: 14px;
    }
    .login-box .submit-btn {
      font-size: 14px;
      padding: 8px 16px;
    }
  }
`;

function Login({ setUser }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const disableNavigation = (e) => {
      if (loading) {
        e.preventDefault();
        window.history.forward();
      }
    };

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("childrenIds");
    localStorage.removeItem("selectedChild");

    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener("popstate", disableNavigation);

    return () => {
      window.removeEventListener("popstate", disableNavigation);
    };
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await axios.post(
        `${BASE_URL}/api/auth/login`,
        formData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", data.user.role);

      if (data.user.role === "parent" && data.user.children) {
        localStorage.setItem("childrenIds", JSON.stringify(data.user.children));
      }

      if (setUser) {
        setUser(data.user);
      }

      navigate("/", { replace: true });
    } catch (err) {
      // console.error("Login error:", err.response?.data);
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <style>{styles}</style>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="login-box"
      >
        <h2>Login</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <div className="user-box">
            <Form.Control
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              disabled={loading}
            />
            <Form.Label>Email</Form.Label>
          </div>
          <div className="user-box position-relative">
            <Form.Control
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              autoComplete="new-password"
              disabled={loading}
            />
            <Form.Label>Password</Form.Label>
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? (
                <i className="bi bi-eye-slash"></i>
              ) : (
                <i className="bi bi-eye"></i>
              )}
            </button>
          </div>
          <div className="text-end mb-3">
            <Link to="/forgot-password" className="forgot-password">
              Forgot Password?
            </Link>
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            {loading ? "Logging in..." : "Login"}
          </button>
        </Form>
      </motion.div>
    </div>
  );
}

export default Login;