"use client";

import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";
import { motion } from "framer-motion";
import { useState } from "react";
import { Alert, Form } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import background from "../../assests/images/login.png";

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
  .alert-danger {
    background-color: #721C24;
    color: #fff;
    border: none;
    border-radius: 5px;
    margin-bottom: 20px;
  }
  .alert-success {
    background-color: #1C7224;
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

function VerifyOTP() {
  const [formData, setFormData] = useState({
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const trimmedOtp = formData.otp.trim();

    if (!email) {
      setError("Email information is missing. Please start the forgot password process again.");
      setLoading(false);
      return;
    }

    if (!trimmedOtp) {
      setError("Please enter the OTP.");
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.post(
        `${BASE_URL}/api/otp/reset-password`, // ← corrected endpoint
        {
          email,
          otp: trimmedOtp,
          newPassword: formData.newPassword,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      setSuccess(data.message || "Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (err) {
      let errorMessage = "Failed to reset password. Please try again.";

      if (err.response?.data) {
        errorMessage =
          err.response.data.error ||
          err.response.data.message ||
          err.response.data.errorMessage ||
          errorMessage;
      } else if (err.message?.includes("Network")) {
        errorMessage = "Cannot connect to server. Please check your internet connection.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);

      console.error("Password reset failed:", {
        email,
        otp: trimmedOtp,
        status: err.response?.status,
        backendResponse: err.response?.data,
        errorMessage: err.message,
      });
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
        <h2>Verify OTP</h2>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleSubmit}>
          <div className="user-box">
            <Form.Control
              type="text"
              value={formData.otp}
              onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
              required
              disabled={loading}
              placeholder=""
            />
            <Form.Label>OTP</Form.Label>
          </div>

          <div className="user-box position-relative">
            <Form.Control
              type={showPassword ? "text" : "password"}
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
              required
              disabled={loading}
              placeholder=""
            />
            <Form.Label>New Password</Form.Label>
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

          <div className="user-box">
            <Form.Control
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
              disabled={loading}
              placeholder=""
            />
            <Form.Label>Confirm Password</Form.Label>
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={
              loading ||
              !formData.otp.trim() ||
              !formData.newPassword ||
              !formData.confirmPassword
            }
          >
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>
        </Form>
      </motion.div>
    </div>
  );
}

export default VerifyOTP;