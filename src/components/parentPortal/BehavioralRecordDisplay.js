import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// const BASE_URL =
//   process.env.NODE_ENV === "production"
//     ? process.env.REACT_APP_API_DEPLOYED_URL
//     : process.env.REACT_APP_API_URL;

const BASE_URL = process.env.REACT_APP_API_URL;

const BehavioralRecordDisplay = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const studentId = localStorage.getItem("selectedChild");

  // Setup Axios Interceptor for Authorization
  useEffect(() => {
    const setupAxiosInterceptors = () => {
      axios.interceptors.request.use(
        (config) => {
          const token = localStorage.getItem("token");
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          } else {
            throw new Error("No authentication token found");
          }
          return config;
        },
        (error) => Promise.reject(error)
      );

      axios.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            toast.error("Session expired. Please log in again.");
            localStorage.removeItem("token");
            navigate("/login");
          } else if (error.response?.status === 403) {
            toast.error("Access denied: Insufficient permissions");
          }
          return Promise.reject(error);
        }
      );
    };
    setupAxiosInterceptors();
  }, [navigate]);

  const fetchBehavioralRecords = async () => {
    if (!studentId) {
      setError("No student ID provided");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to continue");
        navigate("/login");
        return;
      }

      const response = await axios.get(
        `${BASE_URL}/api/students/${studentId}/behavioral-records`
      );
      setRecords(response.data.data || []);
    } catch (err) {
      console.error("Error fetching behavioral records:", err);
      setError(
        err.response?.data?.message || "Failed to fetch behavioral records"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBehavioralRecords();
  }, [studentId]);

  // Custom CSS for animations and responsiveness
  const styles = `
    .fade-in {
      animation: fadeIn 0.5s ease-in;
    }
    .record-card:hover {
      transform: translateY(-5px);
      transition: transform 0.3s ease;
      box-shadow: 0 8px 16px rgba(0,0,0,0.2) !important;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 576px) {
      .card-body { padding: 1rem; }
      .card-header h5 { font-size: 1.1rem; }
      .card-footer small { font-size: 0.8rem; }
    }
  `;

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center vh-100"
        style={{ backgroundColor: "#e3e6eb" }}
      >
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            borderRadius: "15px",
            padding: "2rem",
            boxShadow: "0 4px 16px rgba(31, 38, 135, 0.1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            className="spinner-border"
            role="status"
            style={{ width: "3rem", height: "3rem", color: "#6366f1" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ color: "#4b5563", marginTop: "1rem" }}>
            Loading behavioral records...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container my-5" style={{ backgroundColor: "#e3e6eb" }}>
        <div className="text-end mb-3">
          <button
            style={{
              background: "transparent",
              border: "1px solid #6366f1",
              color: "#6366f1",
              borderRadius: "12px",
              padding: "0.5rem 1.5rem",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            onMouseOver={(e) => {
              e.target.style.background = "linear-gradient(145deg, #6366f1, #a855f7)";
              e.target.style.color = "#fff";
            }}
            onMouseOut={(e) => {
              e.target.style.background = "transparent";
              e.target.style.color = "#6366f1";
            }}
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>
        <div
          className="d-flex align-items-center fade-in"
          style={{
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
            border: "1px solid rgba(185, 28, 28, 0.3)",
            borderRadius: "10px",
            padding: "1rem",
            boxShadow: "0 4px 16px rgba(31, 38, 135, 0.1)",
          }}
        >
          <i
            className="bi bi-exclamation-triangle-fill me-3 fs-4"
            style={{ color: "#b91c1c" }}
          ></i>
          <div>Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ backgroundColor: "transparent" }}>
      <style>{styles}</style>
      <div className="d-flex align-items-center mb-5 fade-in">
        <i
          className="bi bi-clipboard-data fs-2 me-3"
          style={{ color: "#0000ff" }}
        ></i>
        <h1
          className="mb-0 fw-bold"
          style={{
            // background: "linear-gradient(90deg, #6366f1, #a855f7)",
            color:"#0000ff",
            
          }}
        >
          Behavioral Records
        </h1>
      </div>

      {records.length === 0 ? (
        <div
          className="text-center fade-in py-4"
          style={{
            backgroundColor: "#e0f2fe",
            color: "#1e40af",
            borderRadius: "10px",
            boxShadow: "0 4px 16px rgba(31, 38, 135, 0.1)",
          }}
        >
          <i
            className="bi bi-info-circle fs-4 me-2"
            style={{ color: "#1e40af" }}
          ></i>
          No behavioral records available
        </div>
      ) : (
        <div className="row g-4">
          {records.map((record, index) => (
            <div
              className="col-12 col-md-6 col-lg-4 fade-in"
              key={record._id}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className="card h-100 record-card"
                style={{
                  backgroundColor: "#4C639A",
                  boxShadow: "0 4px 16px rgba(31, 38, 135, 0.1)",
                  borderRadius: "15px",
                }}
              >
                <div
                  className="card-header"
                  style={{
                    background: "linear-gradient(145deg, #e0e7ff 0%, #f5f3ff 100%)",
                    color: "#2e1065",
                    borderRadius: "15px 15px 0 0",
                  }}
                >
                  <h5 className="mb-0 fw-semibold">
                    {record.student?.name || "Unknown"} - Term: {record.term}
                  </h5>
                </div>
                <div
                  className="card-body"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.7)" }}
                >
                  <div className="mb-4">
                    <h6
                      className="card-subtitle mb-2 fw-bold"
                      style={{ color: "#2e1065" }}
                    >
                      <i
                        className="bi bi-clock me-2"
                        style={{ color: "#6b7280" }}
                      ></i>
                      Punctuality
                    </h6>
                    <div className="ps-3">
                      <strong style={{ color: "#2e1065" }}>
                        {record.punctuality?.status || "N/A"}
                      </strong>
                      <p style={{ color: "#4b5563", marginBottom: 0, fontSize: "0.875rem" }}>
                        {record.punctuality?.comments || "No comments"}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h6
                      className="card-subtitle mb-2 fw-bold"
                      style={{ color: "#2e1065" }}
                    >
                      <i
                        className="bi bi-person-workspace me-2"
                        style={{ color: "#6b7280" }}
                      ></i>
                      Classroom Behavior
                    </h6>
                    <div className="ps-3">
                      <div className="mb-2">
                        <span
                          className="badge"
                          style={{
                            backgroundColor: "#6b7280",
                            color: "#fff",
                            marginRight: "0.5rem",
                          }}
                        >
                          Rating: {record.classroomBehaviour?.rating || 0}/5
                        </span>
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`bi bi-star${
                              i < (record.classroomBehaviour?.rating || 0)
                                ? "-fill"
                                : ""
                            }`}
                            style={{ color: "#f59e0b" }}
                          ></i>
                        ))}
                      </div>
                      <p style={{ color: "#4b5563", marginBottom: 0, fontSize: "0.875rem" }}>
                        {record.classroomBehaviour?.comments || "No comments"}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h6
                      className="card-subtitle mb-2 fw-bold"
                      style={{ color: "#2e1065" }}
                    >
                      <i
                        className="bi bi-people me-2"
                        style={{ color: "#6b7280" }}
                      ></i>
                      Peer Interaction
                    </h6>
                    <div className="ps-3">
                      <strong style={{ color: "#2e1065" }}>
                        {record.peerInteraction?.quality || "N/A"}
                      </strong>
                      <p style={{ color: "#4b5563", marginBottom: 0, fontSize: "0.875rem" }}>
                        {record.peerInteraction?.comments || "No comments"}
                      </p>
                    </div>
                  </div>

                  {record.disciplineRecords?.length > 0 && (
                    <div className="mb-4">
                      <h6
                        className="card-subtitle mb-2 fw-bold"
                        style={{ color: "#2e1065" }}
                      >
                        <i
                          className="bi bi-exclamation-triangle me-2"
                          style={{ color: "#6b7280" }}
                        ></i>
                        Discipline Records
                      </h6>
                      <div className="ps-3">
                        <ul
                          className="list-group list-group-flush"
                          style={{
                            borderTop: "1px solid rgba(99, 102, 241, 0.2)",
                            borderBottom: "1px solid rgba(99, 102, 241, 0.2)",
                          }}
                        >
                          {record.disciplineRecords.map((dr, index) => (
                            <li
                              key={index}
                              className="list-group-item px-0 py-2"
                              style={{ color: "#4b5563" }}
                            >
                              <span
                                className="badge me-2"
                                style={{
                                  backgroundColor: "#b91c1c",
                                  color: "#fff",
                                }}
                              >
                                {dr.type}
                              </span>
                              {dr.description}
                              <div style={{ color: "#6b7280", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                                <i
                                  className="bi bi-calendar me-1"
                                  style={{ color: "#6b7280" }}
                                ></i>
                                {new Date(dr.date).toLocaleDateString()}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="mb-0">
                    <h6
                      className="card-subtitle mb-2 fw-bold"
                      style={{ color: "#2e1065" }}
                    >
                      <i
                        className="bi bi-chat-left-text me-2"
                        style={{ color: "#6b7280" }}
                      ></i>
                      Teacher Comments
                    </h6>
                    <div
                      className="ps-3 py-2 rounded"
                      style={{ backgroundColor: "rgba(255, 255, 255, 0.8)" }}
                    >
                      <p
                        className="mb-0 fst-italic"
                        style={{ color: "#2e1065" }}
                      >
                        {record.teacherComments || "No comments"}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className="card-footer d-flex justify-content-between align-items-center"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.8)" }}
                >
                  <small style={{ color: "#4b5563" }}>
                    <i
                      className="bi bi-person me-1"
                      style={{ color: "#6b7280" }}
                    ></i>
                    {record.recordedBy || "Unknown"}
                  </small>
                  <small style={{ color: "#4b5563" }}>
                    <i
                      className="bi bi-clock-history me-1"
                      style={{ color: "#6b7280" }}
                    ></i>
                    {new Date(record.lastUpdated).toLocaleString()}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BehavioralRecordDisplay;
