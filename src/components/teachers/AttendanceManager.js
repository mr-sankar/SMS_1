import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import React, { useEffect, useState } from "react";
import { FaCheck, FaDownload } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./AttendenceMan.css";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const StudManage = ({ teacherEmail }) => {
  const [attendance, setAttendance] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Fetch previous attendance records
  useEffect(() => {
    if (!user?.email || !token) {
      setError("Please log in to access this page.");
      setLoading(false);
      navigate("/login");
      return;
    }

    const fetchAttendanceRecords = async () => {
      setLoading(true);
      try {
        // console.log("🔄 Fetching attendance for:", user.email);
        const response = await axios.get(
          `${BASE_URL}/teacher-attendance/${user.email}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // console.log("✅ API Response:", response.data);

        if (!response.data.success || response.data.records.length === 0) {
          setError("No attendance records found.");
          setAttendanceRecords([]);
        } else {
          setAttendanceRecords(response.data.records);
        }
      } catch (err) {
        // console.error(
        //   "❌ Error fetching attendance records:",
        //   err.response?.data || err.message
        // );
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceRecords();
  }, [user?.email, token, navigate]);

  // Fetch current attendance (students for today)
  useEffect(() => {
    if (!user?.email || !token) return;

    const fetchStudents = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${BASE_URL}/attendanceStatus/${user.email}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        // console.log("✅ Fetched students for today:", response.data);
        const students = response.data.students.map((student) => ({
          ...student,
          attendanceStatus: "",
          reason: "",
        }));
        setAttendance(students);
      } catch (error) {
        // console.error(
        //   "❌ Error fetching students:",
        //   error.response?.data || error.message
        // );
        setError(
          error.response?.status === 404
            ? "No students found for this teacher."
            : "Failed to fetch students for attendance."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [user?.email, token]);

  const handleChange = (index, value) => {
    const updatedAttendance = [...attendance];
    updatedAttendance[index].attendanceStatus = value;
    setAttendance(updatedAttendance);
  };

  const handleRequestReason = (student) => {
    if (!student?.attendanceStatus || student?.attendanceStatus === "Present") {
      return;
    }
    alert(
      `Message sent to parent & student: "Reason for ${student?.attendanceStatus} is not mentioned."`
    );
  };

  const handleSubmit = async () => {
    if (!attendance.every((student) => student?.attendanceStatus)) {
      alert("Please mark attendance for all students before submitting.");
      return;
    }

    try {
      const formattedAttendance = {
        teacherEmail: user.email,
        attendanceRecords: attendance.map((student) => ({
          rollNumber: student.rollNumber,
          admissionNo: student.admissionNo,
          name: student.name,
          attendanceStatus: student?.attendanceStatus,
          reason: student.reason || "",
        })),
      };

      const response = await axios.post(
        `${BASE_URL}/attendance`,
        formattedAttendance,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert("Attendance submitted successfully!");
        const updatedRecords = await axios.get(
          `${BASE_URL}/teacher-attendance/${user.email}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAttendanceRecords(updatedRecords.data.records || []);
      }
    } catch (error) {
      // console.error(
      //   "❌ Error submitting attendance:",
      //   error.response?.data || error.message
      // );
      alert(
        error.response?.status === 401 || error.response?.status === 403
          ? "Access denied. Please log in again."
          : "Something went wrong while submitting attendance."
      );
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.clear();
        navigate("/login");
      }
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Attendance Report", 14, 20);
    const filteredRecords = attendanceRecords
      .filter((record) => !selectedDate || record.date === selectedDate)
      .flatMap((record) => record.attendanceRecords);
    const tableData = filteredRecords
      .filter((student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((student, index) => [
        index + 1,
        new Date(selectedDate).toLocaleDateString(),
        student.rollNumber || "N/A",
        student.admissionNo || "N/A",
        student.name || "Unknown",
        student?.attendanceStatus || "N/A",
      ]);
    autoTable(doc, {
      head: [
        [
          "S. No",
          "Date",
          "Roll Number",
          "Admission No",
          "Student Name",
          "Status",
        ],
      ],
      body: tableData,
      startY: 30,
      theme: "grid",
      headStyles: {
        fillColor: "#4C91B6",
        textColor: "#ffffff",
        fontSize: 10,
      },
      bodyStyles: {
        fillColor: "#4C91B6",
        textColor: "#ffffff",
        fontSize: 9,
      },
      styles: {
        cellPadding: 3,
        lineColor: "#272d31",
        lineWidth: 0.1,
      },
    });
    doc.save(`attendance_report_${selectedDate || "all_dates"}.pdf`);
  };

  const tableHeaderStyle = {
    padding: "12px",
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#ffffff",
    backgroundColor: "#4C91B6",
  };

  const tableCellStyle = {
    padding: "10px",
    fontSize: "14px",
    textAlign: "center",
    color: "#ffffff",
    borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
  };

  return (
    <div
      className="container my-5 p-4 rounded-lg stud-container"
      style={{
        background: "transparent",
        color: "#ffffff",
      }}
    >
      <h3
        className="Kaani animate-fade-in mb-4"
        style={{ color: "#0000ff", fontWeight: "bold" }}
      >
        📅 Student Attendance
      </h3>

      {/* Current Attendance Section */}
      <div className="mb-5 Ka-stu">
        <h2
          className="mb-3 Ka-mark"
          style={{ color: "#0000ff", fontSize: "1.8rem" }}
        >
          Mark Today's Attendance
        </h2>
        {loading && (
          <p
            className="text-center"
            style={{
              color: "#000",
              fontSize: "1.1rem",
              fontStyle: "italic",
              opacity: 0.8,
            }}
          >
            Loading...
          </p>
        )}
        {error && (
          <p
            style={{
              color: "#000",
              textAlign: "center",
              backgroundColor: "rgba(255, 0, 0, 0.3)",
              padding: "10px",
              borderRadius: "5px",
              margin: "10px 0",
            }}
          >
            {error}
          </p>
        )}
        {!loading && !error && (
          <>
            <div className="table-responsive" style={{ overflowX: "auto" }}>
              <table
                className="table text-center stud-table Ka-table"
                style={{
                  borderRadius: "8px",
                }}
              >
                <thead
                  className="thead-custom Ka-cus"
                  style={{ backgroundColor: "#4C91B6 !important" }}
                >
                  <tr>
                    <th className="Ka-th" >S. No</th>
                    <th className="Ka-th">Roll Number</th>
                    <th className="Ka-th">Admission No</th>
                    <th className="Ka-th">Date</th>
                    <th className="Ka-th">Student Name</th>
                    <th className="Ka-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="Ka-td"
                        style={{
                          padding: "15px",
                          fontStyle: "italic",
                        }}
                      >
                        No students available to mark attendance.
                      </td>
                    </tr>
                  ) : (
                    attendance.map((student, index) => (
                      <tr
                        key={index}
                        className={`row-${
                          student?.attendanceStatus?.toLowerCase() || ""
                        }`}
                        style={{
                          transition: "background-color 0.3s",
                        }}
                      >
                        <td className="Ka-td">{index + 1}</td>
                        <td className="Ka-td">{student.rollNumber}</td>
                        <td className="Ka-td">{student.admissionNo}</td>
                        <td className="Ka-td">
                          {new Date().toISOString().split("T")[0]}
                        </td>
                        <td className="Ka-td">{student.name}</td>
                        <td className="Ka-td">
                          <select
                            className="form-select attendance-dropdown Ka-P"
                            value={student.attendanceStatus || ""}
                            onChange={(e) =>
                              handleChange(index, e.target.value)
                            }
                            style={{
                              width: "150px",
                              margin: "0 auto",
                              borderRadius: "4px",
                              padding: "5px",
                            }}
                          >
                            <option value="" className="Ka-P">
                              Select
                            </option>
                            <option value="Present" className="Ka-P">
                              ✅ Present
                            </option>
                            <option value="Absent" className="Ka-P">
                              ❌ Absent
                            </option>
                            <option value="Half Day" className="Ka-P">
                              ⏳ Half Day
                            </option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <button
              className="btn d-block mx-auto mt-4 Ka-S"
              onClick={handleSubmit}
              disabled={loading || attendance.length === 0}
            >
              <FaCheck style={{ marginRight: "5px" }} /> Submit Attendance
            </button>
          </>
        )}
      </div>

      {/* Previous Attendance Records Section */}
      <div className="mt-5">
        <h2
          style={{
            fontSize: "1.8rem",
            color: "#0000ff",
            marginBottom: "1.5rem",
          }}
        >
          Previous Attendance Records
        </h2>
        <div className="row mb-3">
          <div className="col-md-6 mt-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search Student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                backgroundColor: "#7091E6",
                color: "#ffffff",
                border: "1px solid #4C91B6",
                borderRadius: "5px",
                padding: "8px",
                "::placeholder": { color: "#ffffff", opacity: 0.7 },
              }}
            />
          </div>
          <div className="col-md-6 mt-3">
            <input
              type="date"
              className="form-control"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              style={{
                backgroundColor: "#7091E6",
                color: "#ffffff",
                border: "1px solid #4c58b6",
                borderRadius: "5px",
                padding: "8px",
              }}
            />
          </div>
        </div>
        <button
          className="btn mb-3"
          onClick={generatePDF}
          disabled={attendanceRecords.length === 0}
          style={{
            backgroundColor: "#2c468c",
            color: "#ffffff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "5px",
            fontWeight: "bold",
            transition: "background-color 0.3s",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#353c9d")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#4C91B6")}
        >
          <FaDownload style={{ marginRight: "5px" }} /> Download PDF
        </button>

        {loading && (
          <p
            style={{
              color: "#000",
              textAlign: "center",
              fontSize: "1.1rem",
              opacity: 0.8,
            }}
          >
            Loading...
          </p>
        )}
        {error && (
          <p
            style={{
              color: "#000",
              textAlign: "center",
              backgroundColor: "rgba(255, 0, 0, 0.3)",
              padding: "10px",
              borderRadius: "5px",
            }}
          >
            {error}
          </p>
        )}
        {!loading && !error && (
          <div className="table-responsive">
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "20px",
                backgroundColor: "rgba(39, 45, 49, 0.8)",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>S. No</th>
                  <th style={tableHeaderStyle}>Date</th>
                  <th style={tableHeaderStyle}>Roll Number</th>
                  <th style={tableHeaderStyle}>Admission No</th>
                  <th style={tableHeaderStyle}>Student Name</th>
                  <th style={tableHeaderStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords
                  .filter(
                    (record) => !selectedDate || record.date === selectedDate
                  )
                  .flatMap((record) =>
                    record.attendanceRecords
                      .filter((student) =>
                        student.name
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase())
                      )
                      .map((student, index) => (
                        <tr key={index}>
                          <td style={tableCellStyle}>{index + 1}</td>
                          <td style={tableCellStyle}>
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td style={tableCellStyle}>
                            {student.rollNumber || "N/A"}
                          </td>
                          <td style={tableCellStyle}>
                            {student.admissionNo || "N/A"}
                          </td>
                          <td style={tableCellStyle}>
                            {student.name || "Unknown"}
                          </td>
                          <td style={tableCellStyle}>
                            <span
                              style={{
                                padding: "5px 10px",
                                borderRadius: "5px",
                                fontWeight: "bold",
                                color: "#ffffff",
                                backgroundColor:
                                  student.attendanceStatus === "Present"
                                    ? "#4C91B6"
                                    : student.attendanceStatus === "Absent"
                                    ? "#ff6347"
                                    : "#ffa500",
                              }}
                            >
                              {student.attendanceStatus || "N/A"}
                            </span>
                          </td>
                        </tr>
                      ))
                  )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudManage;