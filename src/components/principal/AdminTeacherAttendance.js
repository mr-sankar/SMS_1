import { useEffect, useState } from "react";
import axios from "axios";

// const BASE_URL =
//   process.env.NODE_ENV === "production"
//     ? process.env.REACT_APP_API_DEPLOYED_URL
//     : process.env.REACT_APP_API_URL;

const BASE_URL = process.env.REACT_APP_API_URL;

const AdminTeacherAttendance = () => {
  const [teachers, setTeachers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [submittedAttendance, setSubmittedAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [missedDates, setMissedDates] = useState([]);
  // State for teacher attendance search
  const [searchTeacherId, setSearchTeacherId] = useState("");
  const [searchMonth, setSearchMonth] = useState(new Date().getMonth() + 1);
  const [searchYear, setSearchYear] = useState(new Date().getFullYear());
  const [teacherAttendanceStats, setTeacherAttendanceStats] = useState(null);

  const token = localStorage.getItem("token");
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/api/attendance/teachers`, config);
        console.log('Fetched teachers:', res.data);
        setTeachers(res.data);
        const initialAttendance = {};
        res.data.forEach((teacher) => {
          initialAttendance[teacher._id] = "Default";
        });
        setAttendance(initialAttendance);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching teachers");
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  // Check for missed attendance dates
  useEffect(() => {
    const checkMissedDates = async () => {
      const today = new Date();
      const missed = [];
      
      // Check last 30 days for missed attendance
      for (let i = 1; i <= 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split("T")[0];
        
        try {
          const res = await axios.get(`${BASE_URL}/api/attendance/fetch/${dateStr}`, config);
          if (!res.data || !res.data.attendanceRecords || res.data.attendanceRecords.length === 0) {
            missed.push(dateStr);
          }
        } catch (err) {
          missed.push(dateStr);
        }
      }
      setMissedDates(missed);
    };

    checkMissedDates();
  }, []);

  const handleAttendanceChange = (teacherId, status) => {
    setAttendance((prev) => ({ ...prev, [teacherId]: status }));
  };

  const submitAttendance = async () => {
    const holidays2025 = [
      "2025-01-26", // Republic Day
      "2025-03-14", // Holi
      "2025-04-10", // Good Friday
      "2025-04-14", // Ambedkar Jayanti
      "2025-08-15", // Independence Day
      "2025-10-02", // Gandhi Jayanti
      "2025-11-01", // Diwali
      "2025-12-25", // Christmas
    ];

    const selectedDateObj = new Date(date);
    if (selectedDateObj.getDay() === 0 || holidays2025.includes(date)) {
      alert("Cannot mark attendance as it is a holiday");
      return;
    }

    // Check if all teachers have valid attendance status
    const hasDefaultStatus = Object.values(attendance).some(status => status === "Default");
    if (hasDefaultStatus) {
      alert("Please mark all teachers as either Present or Absent");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const attendanceRecords = teachers.map((teacher) => ({
        teacherObjectId: teacher._id,
        teacherId: teacher.teacherId,
        teacherName: teacher.name,
        status: attendance[teacher._id],
      }));

      const payload = { date, attendanceRecords };
      await axios.post(`${BASE_URL}/api/attendance/mark`, payload, config);
      alert("Attendance marked successfully!");
      fetchAttendanceByDate(selectedDate);
      // Update missed dates
      setMissedDates(prev => prev.filter(d => d !== date));
    } catch (err) {
      setError(err.response?.data?.message || "Error marking attendance");
      alert("Error marking attendance!");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceByDate = async (dateToFetch) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        `${BASE_URL}/api/attendance/fetch/${dateToFetch}`,
        config
      );
      console.log('Fetched attendance for date:', dateToFetch, res.data);
      if (res.data && res.data.attendanceRecords) {
        setSubmittedAttendance(res.data.attendanceRecords);
      } else {
        setSubmittedAttendance([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching attendance");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherAttendanceStats = async () => {
    if (!searchTeacherId) {
      setError("Please select a teacher");
      setTeacherAttendanceStats(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const holidays2025 = [
        "2025-01-26", // Republic Day
        "2025-03-14", // Holi
        "2025-04-10", // Good Friday
        "2025-04-14", // Ambedkar Jayanti
        "2025-08-15", // Independence Day
        "2025-10-02", // Gandhi Jayanti
        "2025-11-01", // Diwali
        "2025-12-25", // Christmas
      ];

      // Calculate total days in the selected month
      const totalWorkingDays = new Date(searchYear, searchMonth, 0).getDate();
      let presentCount = 0;
      let absentCount = 0;

      for (let day = 1; day <= totalWorkingDays; day++) {
        const dateToFetch = `${searchYear}-${String(searchMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        try {
          const res = await axios.get(
            `${BASE_URL}/api/attendance/fetch/${dateToFetch}`,
            config
          );
          console.log(`Attendance for ${dateToFetch}:`, res.data);
          if (res.data && res.data.attendanceRecords && res.data.attendanceRecords.length > 0) {
            const teacherRecord = res.data.attendanceRecords.find(
              (record) => record.teacherId === searchTeacherId
            );
            if (teacherRecord && (teacherRecord.status === 'Present' || teacherRecord.status === 'Absent')) {
              if (teacherRecord.status === 'Present') {
                presentCount++;
              } else if (teacherRecord.status === 'Absent') {
                absentCount++;
              }
            }
          }
        } catch (err) {
          console.log(`No attendance data for ${dateToFetch}:`, err.response?.data?.message || err.message);
        }
      }

      const stats = { presentCount, absentCount, totalWorkingDays };
      console.log('Calculated stats:', stats);
      if (presentCount === 0 && absentCount === 0) {
        setError("No submitted attendance records found for the selected teacher and period");
        setTeacherAttendanceStats(null);
      } else {
        setTeacherAttendanceStats(stats);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching teacher attendance stats");
      console.error('Error fetching stats:', err.response || err);
      setTeacherAttendanceStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceByDate(selectedDate);
  }, [selectedDate]);

  const handleSearchAttendance = (e) => {
    e.preventDefault();
    console.log('Searching for:', { teacherId: searchTeacherId, month: searchMonth, year: searchYear });
    fetchTeacherAttendanceStats();
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay();
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  return (
    <div style={styles.container}>
      <h2 className="text-dark" style={styles.title}>
        Teacher Attendance Management
      </h2>

      {loading && <p>Loading...</p>}
      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.dateContainer}>
        <label style={styles.label}>Mark Attendance Date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={new Date().toISOString().split("T")[0]}
          style={styles.input}
        />
        <div style={styles.calendarContainer}>
          <h3 style={styles.subtitle}>Current Month Calendar</h3>
          <div style={styles.calendar}>
            {generateCalendarDays().map((day, index) => {
              if (!day) return <div key={index} style={styles.emptyDay} />;
              const dateStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isMissed = missedDates.includes(dateStr);
              const isToday = dateStr === new Date().toISOString().split("T")[0];
              return (
                <div
                  key={index}
                  style={{
                    ...styles.calendarDay,
                    ...(isMissed ? styles.missedDay : {}),
                    ...(isToday ? styles.today : {}),
                  }}
                  onClick={() => setDate(dateStr)}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {teachers.length > 0 && (
        <>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Teacher ID</th>
                  <th style={styles.th}>Teacher Name</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher, index) => (
                  <tr key={teacher._id || `teacher-fallback-${index}`}>
                    <td style={styles.td}>{teacher.teacherId}</td>
                    <td style={styles.td}>{teacher.name}</td>
                    <td style={styles.td}>
                      <select
                        value={attendance[teacher._id] || "Default"}
                        onChange={(e) => handleAttendanceChange(teacher._id, e.target.value)}
                        style={styles.select}
                      >
                        <option value="Default">Default</option>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={submitAttendance} style={styles.button} disabled={loading}>
            {loading ? "Submitting..." : "Submit Attendance"}
          </button>
        </>
      )}

      <h3 style={styles.subtitle}>View Submitted Attendance</h3>
      <div style={styles.dateContainer}>
        <label style={styles.label}>View Attendance Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={styles.input}
          max={new Date().toISOString().split("T")[0]}
        />
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Teacher ID</th>
              <th style={styles.th}>Teacher Name</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {submittedAttendance.length > 0 ? (
              submittedAttendance.map((record, index) => {
                const key =
                  record.teacherObjectId && typeof record.teacherObjectId === "object"
                    ? record.teacherObjectId._id || JSON.stringify(record.teacherObjectId)
                    : record.teacherObjectId || `fallback-${index}`;
                return (
                  <tr key={key}>
                    <td style={styles.td}>{record.teacherId}</td>
                    <td style={styles.td}>{record.teacherName}</td>
                    <td style={styles.td}>{record.status}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="3" style={styles.td}>
                  No attendance records found for this date.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h3 style={styles.subtitle}>Search Teacher Attendance by Month</h3>
      <form onSubmit={handleSearchAttendance} style={styles.searchContainer}>
        <div style={styles.searchField}>
          <label style={styles.label}>Teacher:</label>
          <select
            value={searchTeacherId}
            onChange={(e) => setSearchTeacherId(e.target.value)}
            style={styles.select}
          >
            <option value="">Select Teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher._id} value={teacher.teacherId}>
                {teacher.name} (ID: {teacher.teacherId})
              </option>
            ))}
          </select>
        </div>
        <div style={styles.searchField}>
          <label style={styles.label}>Month:</label>
          <select
            value={searchMonth}
            onChange={(e) => setSearchMonth(Number(e.target.value))}
            style={styles.select}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <option key={month} value={month}>
                {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        <div style={styles.searchField}>
          <label style={styles.label}>Year:</label>
          <select
            value={searchYear}
            onChange={(e) => setSearchYear(Number(e.target.value))}
            style={styles.select}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Searching..." : "Search Attendance"}
        </button>
      </form>

      {teacherAttendanceStats && (
        <div style={styles.statsContainer}>
          <h4 style={styles.statsTitle}>
            Attendance for {teachers.find(t => t.teacherId === searchTeacherId)?.name || 'Selected Teacher'} -{' '}
            {new Date(0, searchMonth - 1).toLocaleString('default', { month: 'long' })} {searchYear}
          </h4>
          <p>Total Days: {teacherAttendanceStats.totalWorkingDays}</p>
          <p>Present Days: {teacherAttendanceStats.presentCount}</p>
          <p>Absent Days: {teacherAttendanceStats.absentCount}</p>
        </div>
      )}

      {teacherAttendanceStats === null && !loading && !error && (
        <p style={styles.error}>No submitted attendance records found for the selected teacher and period.</p>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: "100%",
    maxWidth: "1200px",
    margin: "auto",
    padding: "20px",
    boxSizing: "border-box",
    color: "white",
  },
  title: { fontSize: "24px", fontWeight: "bold", marginBottom: "20px", textAlign: "center" },
  subtitle: { fontSize: "20px", fontWeight: "bold", margin: "20px 0", textAlign: "center", color: "black" },
  dateContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "15px",
  },
  label: { fontSize: "16px", fontWeight: "bold", marginBottom: "5px" , color: "black"},
  input: { padding: "5px", fontSize: "16px", width: "100%", maxWidth: "300px" },
  tableContainer: {
    width: "100%",
    overflowX: "auto",
    marginBottom: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "600px",
  },
  th: { borderBottom: "2px solid #000", padding: "10px", background: "#2D3A57", textAlign: "left", color: "white" },
  td: { padding: "10px", borderBottom: "1px solid #ddd", textAlign: "left",color: "black" },
  select: { padding: "5px", fontSize: "16px", width: "100%" },
  button: {
    padding: "10px 15px",
    fontSize: "16px",
    cursor: "pointer",
    background: "#2D3A57",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    width: "100%",
    maxWidth: "300px",
    margin: "0 auto",
    display: "block",
    opacity: (props) => (props.disabled ? "0.6" : "1"),
  },
  error: { color: "red", marginBottom: "15px", textAlign: "center" },
  searchContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "20px",
  },
  searchField: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "10px",
    width: "100%",
    maxWidth: "300px",
  },
  statsContainer: {
    marginTop: "20px",
    textAlign: "center",
  },
  statsTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  calendarContainer: {
    marginBottom: "20px",
    textAlign: "center",
  },
  calendar: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "5px",
    maxWidth: "400px",
    margin: "0 auto",
  },
  calendarDay: {
    padding: "10px",
    border: "1px solid #ddd",
    background: "#fff",
    color: "#000",
    textAlign: "center",
    cursor: "pointer",
  },
  missedDay: {
    background: "#8f91f0a4",
  },
  today: {
    background: "#6b6deb",
    color: "#fff",
  },
  emptyDay: {
    padding: "10px",
    border: "1px solid #ddd",
    background: "#ffffff",
  },
};

export default AdminTeacherAttendance;
