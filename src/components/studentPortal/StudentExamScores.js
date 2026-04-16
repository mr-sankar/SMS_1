import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// Custom CSS for table styling
const tableStyles = `
 .custom-table {
    width: 100%;
    max-width: clamp(300px, 90vw, 600px);
    margin: 0 auto;
    border-collapse: collapse;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: transparent;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden;
  }

  .custom-table th,
  .custom-table td {
    padding: clamp(8px, 1.5vw, 12px);
    text-align: left;
    font-size: clamp(0.75rem, 2vw, 0.9rem);
    color: #1f2937;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  .custom-table th {
    background: linear-gradient(135deg, #4C639B, #7091E6);
    color: #fff;
    font-weight: 600;
    width: 25%;
  }

  .custom-table td {
    background: rgba(255, 255, 255, 0.9);
    width: 25%;
  }

  .custom-table tr:hover td {
    background: #e0f2fe;
  }

  /* Wrapper for overflow handling on small screens */
  .table-wrapper {
    overflow-x: auto;
    width: 100%;
    padding: clamp(8px, 2vw, 16px);
  }

  /* Media Queries for Responsiveness */
  @media (max-width: 480px) {
    .custom-table {
      max-width: 100%;
    }

    .custom-table th,
    .custom-table td {
      padding: clamp(6px, 1.5vw, 8px);
      font-size: clamp(0.65rem, 2.5vw, 0.8rem);
      min-width: 80px; /* Prevent columns from collapsing too much */
    }
  }

  @media (min-width: 481px) and (max-width: 768px) {
    .custom-table th,
    .custom-table td {
      font-size: clamp(0.7rem, 2vw, 0.85rem);
      padding: clamp(8px, 1.5vw, 10px);
    }
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    .custom-table {
      max-width: clamp(400px, 80vw, 550px);
    }
  }

  @media (min-width: 1025px) {
    .custom-table {
      max-width: 600px;
    }
  }
`;

// Setup Axios Interceptors for Authorization
const setupAxiosInterceptors = (navigate) => {
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

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;


export default function StudentExamScores() {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const studentId =
    user.role === "parent"
      ? localStorage.getItem("selectedChild")
      : user.role === "student"
      ? user.roleId
      : null;

  const selectedExam =
    studentData?.scores?.find((exam) => exam.examId === selectedExamId) || null;

  useEffect(() => {
    setupAxiosInterceptors(navigate);
  }, [navigate]);

  useEffect(() => {
    const fetchStudentScores = async () => {
      if (!studentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please log in to continue");
          navigate("/login");
          return;
        }

        // console.log("Fetching scores for studentId:", studentId);
        const response = await axios.get(
          `${BASE_URL}/api/student/${studentId}/scores`
        );
        // console.log("Fetched student data:", response.data);
        setStudentData(response.data);
        if (response.data.scores?.length > 0) {
          setSelectedExamId(response.data.scores[0].examId);
        }
      } catch (error) {
        // console.error(
        //   "Error fetching student scores:",
        //   error.response?.data || error.message
        // );
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            error.response?.data?.message ||
            `Failed to fetch scores for student ID: ${studentId}`,
        });
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };

    fetchStudentScores();
  }, [studentId, navigate]);

  const calculateTotal = (marks) =>
    marks?.reduce(
      (sum, sub) => sum + (typeof sub.marks === "number" ? sub.marks : 0),
      0
    ) || 0;

  const calculatePercentage = (total) =>
    selectedExam?.subjects?.length && selectedExam?.maxMarks
      ? (
          (total / (selectedExam.subjects.length * selectedExam.maxMarks)) *
          100
        ).toFixed(2)
      : "0.00";

  const calculateGrade = (marks, maxMarks) => {
    if (!marks || !maxMarks) return "-";
    const percentage = (marks / maxMarks) * 100;
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 68) return "B";
    if (percentage >= 55) return "C";
    if (percentage >= 30) return "D";
    return "F";
  };

  const calculateTotalGrade = (percentage) => {
    if (!percentage || isNaN(percentage)) return "-";
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 68) return "B";
    if (percentage >= 55) return "C";
    if (percentage >= 30) return "D";
    return "F";
  };

  if (loading) {
    return (
      <div className="container my-4 text-center">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "50vh" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading exam scores...</p>
        </div>
      </div>
    );
  }

  if (!studentId) {
    return (
      <div className="container my-4 text-center">
        <div className="alert alert-warning">
          No student ID provided. Please select a student or log in as a student.
        </div>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <style>{tableStyles}</style>
      <div className="card shadow-sm p-3"
      style={{
        backgroundColor: "transparent",
        color: "#0000ff"
      }} >
        <h3 className="text-center mb-4 fw-bold">
          Student Scorecard
        </h3>

        {studentData?.student && (
          <div className="mb-4">
            <div className="table-wrapper">
  <table className="custom-table">
    <tbody>
      <tr>
        <th scope="row">Student ID</th>
        <td>{studentData.student.admissionNo}</td>
        <th scope="row">Name</th>
        <td>{studentData.student.name}</td>
      </tr>
      <tr>
        <th scope="row">Class</th>
        <td>{studentData.student.className}</td>
        <th scope="row">Section</th>
        <td>{studentData.student.section}</td>
      </tr>
    </tbody>
  </table>
</div>
          </div>
        )}

        {studentData?.scores?.length > 0 && (
          <div className="mb-4 text-center">
            <h5 className="fw-semibold text-white mb-2">Select an Exam</h5>
            <div className="d-flex flex-wrap justify-content-center gap-2">
              {studentData.scores.map((exam) => (
                <button
                  key={exam.examId}
                  className={`btn btn-sm ${
                    selectedExamId === exam.examId
                      ? "btn-success"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => setSelectedExamId(exam.examId)}
                  style={{
                  
                    color: "white"
                  }}
                >
                  {exam.examName}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedExam && selectedExam.subjects && selectedExam.marks ? (
          <div className="card p-3  shadow-sm"  style={{
            backgroundColor: "transparent",
            color: "white",
            border:'none'
          }}
          
          >
            <h5 className="fw-semibold text-white text-center mb-4">
              {selectedExam.examName}
            </h5>
            
            {/* Marks Table (Vertical) */}
            <div className="table-responsive mb-4"
             
            >
              <table
                className="table custom-table"
                style={{ maxWidth: "450px", margin: "0 auto" }}
              >
                <thead
                >
                  <tr  style={{
                  backgroundColor: "#2D3A57",
                  color: "white"
                }}>
                    <th scope="col" style={{ width: "40%" }}>Subject</th>
                    <th scope="col" style={{ width: "30%" }}>Marks</th>
                    <th scope="col" style={{ width: "30%" }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedExam.subjects.map((subject, i) => (
                    <tr key={i}>
                      <th scope="row">{subject}</th>
                      <td>
                        {selectedExam.marks[i]?.marks === undefined || selectedExam.marks[i].marks === 0
                          ? "-"
                          : `${selectedExam.marks[i].marks} / ${selectedExam.maxMarks}`}
                      </td>
                      <td>
                        {selectedExam.marks[i]?.marks === undefined || selectedExam.marks[i].marks === 0
                          ? "-"
                          : calculateGrade(selectedExam.marks[i].marks, selectedExam.maxMarks)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Results Table (Horizontal) */}
            <div className="table-responsive">
              <table
                className="table custom-table"
                style={{ maxWidth: "650px", margin: "0 auto" }}
              >
                <thead>
                  <tr>
                    <th scope="col" style={{ width: "25%" }}>Student ID</th>
                    <th scope="col" style={{ width: "25%" }}>Total Marks</th>
                    <th scope="col" style={{ width: "25%" }}>Percentage</th>
                    <th scope="col" style={{ width: "25%" }}>Overall Grade</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{studentData.student.admissionNo}</td>
                    <td>
                      {calculateTotal(selectedExam.marks)} /{" "}
                      {selectedExam.subjects.length * selectedExam.maxMarks}
                    </td>
                    <td>
                      {calculateTotal(selectedExam.marks) > 0
                        ? `${calculatePercentage(calculateTotal(selectedExam.marks))}%`
                        : "-"}
                    </td>
                    <td>
                      {calculateTotal(selectedExam.marks) > 0
                        ? calculateTotalGrade(
                            calculatePercentage(calculateTotal(selectedExam.marks))
                          )
                        : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          selectedExam && (
            <div className="text-center mt-3">
              <p className="text-muted">
                Exam data is incomplete. Please check the server response.
              </p>
            </div>
          )
        )}

        {studentData && studentData.scores?.length === 0 && (
          <div className="text-center mt-3">
            <p className="text-muted">
              No exam scores available for this student.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}