import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import axios from "axios";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fade,
  Grow,
  Card,
  Button,
  TablePagination,
} from "@mui/material";
import {
  CalendarToday,
  Event,
  Announcement,
  ErrorOutline,
  Refresh,
  School,
  People,
  Schedule,
} from "@mui/icons-material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  LocalizationProvider,
  DateCalendar,
  PickersDay,
} from "@mui/x-date-pickers";
import {
  format,
  isSameDay,
  parseISO,
  isSameMonth,
  startOfMonth,
  getMonth,
  getYear,
  isValid,
} from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { keyframes } from "@emotion/react";
import { motion } from "framer-motion";
import { Stack } from "react-bootstrap";

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// ServerDay component
function ServerDay(props) {
  const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;

  const isHighlighted =
    !outsideCurrentMonth &&
    highlightedDays.some((date) => isValid(date) && isSameDay(date, day));

  const isToday = isSameDay(day, new Date());

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
      }}
    >
      <PickersDay
        {...other}
        outsideCurrentMonth={outsideCurrentMonth}
        day={day}
        sx={{
          width: "100%",
          height: "100%",
          minWidth: 0,
          minHeight: 0,
          margin: 0,
          padding: 0,
          fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.9rem" },
          color: "#333333",
          ...(isToday && {
            border: "none",
            background: "linear-gradient(135deg, #272d31, #0000ff, #272d31)",
            fontWeight: 700,
            color: "#ffffff",
            boxShadow: "0 0 8px rgba(76, 175, 80, 0.4)",
          }),
          ...(isHighlighted && {
            backgroundColor: "transparent",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #272d31, #0000ff, #272d31)",
              opacity: 0.3,
              zIndex: -1,
            },
            color: "#388e3c",
            fontWeight: 700,
            "&:hover": {
              backgroundColor: "transparent",
              "&::before": {
                opacity: 0.4,
              },
            },
          }),
          "&:hover": {
            transform: "scale(1.1)",
            transition: "transform 0.2s ease",
            zIndex: 2,
          },
        }}
      />
      {isHighlighted && (
        <Box
          sx={{
            position: "absolute",
            bottom: 2,
            left: "50%",
            transform: "translateX(-50%)",
            width: 5,
            height: 5,
            background: "linear-gradient(135deg, #272d31, #0000ff, #272d31)",
            borderRadius: "50%",
            boxShadow: "0 0 4px rgba(76, 175, 80, 0.6)",
            zIndex: 2,
          }}
        />
      )}
    </Box>
  );
}

// const BASE_URL =
//   process.env.NODE_ENV === "production"
//     ? process.env.REACT_APP_API_DEPLOYED_URL
//     : process.env.REACT_APP_API_URL;

const BASE_URL = process.env.REACT_APP_API_URL;

const TeacherDashboard = () => {
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [loading, setLoading] = useState({ main: true, teacherData: true });
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [teacherClass, setTeacherClass] = useState("N/A");
  const [teacherSection, setTeacherSection] = useState("N/A");
  const [timetable, setTimetable] = useState([]);
  const [examData, setExamData] = useState([]);
  const [exams, setExams] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const isMounted = useRef(true);

  const user = useMemo(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  }, []);

  const token = localStorage.getItem("token");
  const email = user?.email;

  // Axios instance
  const api = useMemo(
    () =>
      axios.create({
        baseURL: BASE_URL,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    [token]
  );

  const fetchEvents = useCallback(async () => {
    try {
      const response = await api.get("/api/events");
      return response.data.map((event) => ({
        ...event,
        date: parseISO(event.date),
      }));
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch events."
      );
    }
  }, [api]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await api.get("/api/announcements");
      return response.data.map((announcement) => ({
        ...announcement,
        announcementDate: parseISO(announcement.announcementDate),
      }));
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch announcements."
      );
    }
  }, [api]);

  const fetchData = useCallback(async () => {
    if (!token || !email) {
      setError("Please log in to view events and announcements.");
      return;
    }
    setLoading((prev) => ({ ...prev, main: true }));
    setError(null);
    try {
      const [eventsData, announcementsData] = await Promise.all([
        fetchEvents(),
        fetchAnnouncements(),
      ]);
      if (isMounted.current) {
        setEvents(eventsData);
        setAnnouncements(announcementsData);
      }
    } catch (error) {
      if (isMounted.current) {
        setError(error.message);
      }
    } finally {
      if (isMounted.current) {
        setLoading((prev) => ({ ...prev, main: false }));
      }
    }
  }, [fetchEvents, fetchAnnouncements, token, email]);

  const fetchTeacherData = useCallback(async () => {
    if (!email || !token) {
      setError("Please log in to view teacher data.");
      return;
    }
    setLoading((prev) => ({ ...prev, teacherData: true }));
    setError(null);
    try {
      const teacherResponse = await api.get(`/api/teacher/${email}`);
      const teacherData = teacherResponse.data;
      if (isMounted.current) {
        setTeacherClass(teacherData.classTeacherFor || "N/A");
        setTeacherSection(teacherData.section || "N/A");
        setTimetable(teacherData.timetable || []);
      }
    } catch (error) {
      if (isMounted.current) {
        setError(
          error.response?.data?.message || "Failed to load teacher data."
        );
      }
    } finally {
      if (isMounted.current) {
        setLoading((prev) => ({ ...prev, teacherData: false }));
      }
    }
  }, [email, token, api]);

  const fetchExamResults = useCallback(async () => {
    if (!email || !token) return;
    try {
      const examsResponse = await api.get(`/api/exams/${email}`);
      const fetchedExams = examsResponse.data;
      if (isMounted.current) {
        setExams(fetchedExams);
      }

      const results = fetchedExams.map((exam) => {
        let passCount = 0;
        let failCount = 0;
        let validStudents = 0;

        const studentMarks = Array.isArray(exam.marks) ? exam.marks : [];
        studentMarks.forEach((studentMark) => {
          const marks = Array.isArray(studentMark.marks)
            ? studentMark.marks
            : [];
          if (marks.length === 0) return;

          validStudents++;
          const totalMarks = marks.reduce(
            (sum, mark) => sum + (Number(mark.marks) || 0),
            0
          );
          const maxPossibleMarks = exam.maxMarks * exam.subjects.length;
          const percentage =
            maxPossibleMarks > 0 ? (totalMarks / maxPossibleMarks) * 100 : 0;

          if (percentage >= 30) passCount++;
          else failCount++;
        });

        const passPercentage =
          validStudents > 0 ? (passCount / validStudents) * 100 : 0;
        const failPercentage =
          validStudents > 0 ? (failCount / validStudents) * 100 : 0;

        return {
          examType: exam.name,
          pass: passPercentage,
          fail: failPercentage,
          passCount,
          failCount,
        };
      });

      if (isMounted.current) {
        setExamData(results);
      }
    } catch (error) {
      if (isMounted.current) {
        setError(
          error.response?.data?.message ||
          "Failed to load exam performance data."
        );
      }
    }
  }, [email, token, api]);

  const fetchLeaveRequests = useCallback(async () => {
    if (!email || !token) return;
    try {
      const response = await api.get(`/api/teacher/leave-requests/${email}`);
      const fetchedRequests = response.data.leaveRequests || [];
      if (isMounted.current) {
        setLeaveRequests(fetchedRequests);
      }
    } catch (error) {
      if (isMounted.current) {
        setError(
          error.response?.data?.message || "Failed to load leave requests."
        );
      }
    }
  }, [email, token, api]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    fetchTeacherData();
    fetchExamResults();
    fetchLeaveRequests();

    const interval = setInterval(() => {
      if (isMounted.current) {
        fetchData();
        fetchTeacherData();
        fetchExamResults();
        fetchLeaveRequests();
      }
    }, 300000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [
    fetchData,
    fetchTeacherData,
    fetchExamResults,
    fetchLeaveRequests,
    refreshKey,
  ]);

  const handleLeaveRequestAction = async (id, status) => {
    if (!email || !token) return;
    try {
      setLeaveRequests((prev) =>
        prev.map((req) => (req._id === id ? { ...req, status } : req))
      );
      await api.put(`/api/teacher/leave-request/${id}`, { status, email });
      await fetchLeaveRequests();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to update leave request."
      );
    }
  };

  const handleMonthChange = (date) => setCurrentMonth(startOfMonth(date));

  const highlightedDays = useMemo(() => {
    const currentMonthEvents = events.filter(
      (event) =>
        isSameMonth(event.date, currentMonth) &&
        getMonth(event.date) === getMonth(currentMonth) &&
        getYear(event.date) === getYear(currentMonth)
    );
    const currentMonthAnnouncements = announcements.filter(
      (announcement) =>
        isSameMonth(announcement.announcementDate, currentMonth) &&
        getMonth(announcement.announcementDate) === getMonth(currentMonth) &&
        getYear(announcement.announcementDate) === getYear(currentMonth)
    );
    return [
      ...currentMonthEvents.map((event) => event.date),
      ...currentMonthAnnouncements.map(
        (announcement) => announcement.announcementDate
      ),
    ];
  }, [events, announcements, currentMonth]);

  const getSelectedDateItems = useCallback(() => {
    const dayEvents = events.filter((event) =>
      isSameDay(event.date, selectedDate)
    );
    const dayAnnouncements = announcements.filter((announcement) =>
      isSameDay(announcement.announcementDate, selectedDate)
    );
    return { dayEvents, dayAnnouncements };
  }, [events, announcements, selectedDate]);

  const barData = useMemo(
    () =>
      examData.map((exam) => ({
        name: exam.examType,
        pass: exam.pass,
        fail: exam.fail,
        passCount: exam.passCount,
        failCount: exam.failCount,
      })),
    [examData]
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            background: "rgba(0, 0, 0, 0.9)",
            borderRadius: "10px",
            p: "12px",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.25)",
            border: "1px solid #f5f5f5",
          }}
        >
          <Typography sx={{ fontWeight: "bold", color: "#f5f5f5", mb: "8px" }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography
              key={index}
              sx={{ color: entry.color, my: "4px", fontWeight: 500 }}
            >
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading.main || loading.teacherData) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",

        }}
      >
        <Fade in={true}>
          <Box sx={{ textAlign: "center", color: "#f5f5f5" }}>
            <CircularProgress color="inherit" />
            <Typography sx={{ mt: 2 }}>Loading teacher dashboard...</Typography>
          </Box>
        </Fade>
      </Box>
    );
  }

  if (!user || !email || !token) {
    return (
      <Box sx={{ textAlign: "center", p: 3, color: "#0000ff" }}>
        <Fade in={true}>
          <Typography>Please log in to view the dashboard.</Typography>
        </Fade>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",

        p: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Fade in={true} timeout={1000}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: "#0000ff",
              animation: `${pulse} 2s infinite`,
            }}
          >
            Teacher Dashboard
          </Typography>
          <IconButton
            onClick={handleRefresh}
            sx={{ color: "#0000ff" }}
            aria-label="Refresh dashboard"
          >
            <Refresh />
          </IconButton>
        </Box>
      </Fade>

      {error && (
        <Grow in={true} timeout={500}>
          <Alert
            severity="error"
            sx={{
              mb: 3,
              bgcolor: "#f5f5f5",
              color: "#000",
            }}
            action={
              <IconButton
                color="inherit"
                size="small"
                onClick={handleRefresh}
                aria-label="Retry loading"
              >
                <ErrorOutline />
              </IconButton>
            }
          >
            {error}
          </Alert>
        </Grow>
      )}

      <Grid container spacing={2} sx={{ justifyContent: "center", mb: 3 }}>
        {[
          { icon: <School />, label: "Class", value: teacherClass },
          { icon: <People />, label: "Section", value: teacherSection },
        ].map((item, index) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            key={index}
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <Grow in={true} timeout={500 + index * 200}>
              <Paper
                sx={{
                  width: { xs: 120, sm: 130, md: 140 },
                  height: { xs: 120, sm: 130, md: 140 },
                  borderRadius: "50%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: index === 0 ? "#4C91B6" : "#4C91B6",
                  color: "#ffffff",
                  boxShadow: "0 6px 15px rgba(76, 175, 80, 0.3)",
                  transition: "transform 0.3s ease",
                  "&:hover": {
                    transform: "scale(1.05)",
                  },
                  p: { xs: 1.5, sm: 2 },
                  animation: `${fadeIn} 0.5s ease-in-out`,
                }}
              >
                <Box sx={{ mb: { xs: 0.5, sm: 1 } }}>
                  {React.cloneElement(item.icon, {
                    sx: {
                      fontSize: { xs: 28, sm: 32, md: 36 },

                      color: "#ffffff",
                    },
                  })}
                </Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.9rem" },
                    textAlign: "center",
                  }}
                >
                  {item.label}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    mt: { xs: 0.5, sm: 0.5 },
                    fontSize: (theme) => {
                      const valueLength = String(item.value).length;
                      return valueLength > 5
                        ? { xs: "1rem", sm: "1.2rem", md: "1.4rem" }
                        : { xs: "1.5rem", sm: "1.75rem", md: "2rem" };
                    },
                    textAlign: "center",
                    wordBreak: "break-word",
                    maxWidth: "80%",
                  }}
                >
                  {item.value}
                </Typography>
              </Paper>
            </Grow>
          </Grid>
        ))}

        <Grid container spacing={2} sx={{ mt: { xs: 2, sm: 3 } }}>
          {/* Exam Performance Grid */}
          <Grid item xs={12} sm={6} md={6}>
            <Grow in={true} timeout={900}>
              <Paper
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 3,
                  color: "#333333",
                  boxShadow: "0 6px 20px rgba(76, 175, 80, 0.15)",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 10px 30px rgba(76, 175, 80, 0.2)",
                  },
                  position: "relative",
                  overflow: "hidden",
                  maxHeight: { xs: 400, sm: 450 }, // Consistent height
                  minHeight: { xs: 400, sm: 450 }, // Consistent height
                  overflowY: "auto",
                  "&:before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2, zIndex: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "black",
                      fontWeight: 800,
                      letterSpacing: "0.6px",
                      textShadow: "0 1px 4px rgba(76, 175, 80, 0.2)",
                      fontSize: { xs: "1rem", sm: "1.4rem" },
                    }}
                  >
                    Exam Performance
                  </Typography>
                </Box>

                {exams.length > 0 ? (
                  barData.length > 0 &&
                    barData.some((d) => d.pass > 0 || d.fail > 0) ? (
                    <Box sx={{ width: "100%", height: { xs: 280, sm: 320 } }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={barData}
                          margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="4 4"
                            stroke="rgba(76, 175, 80, 0.15)"
                          />
                          <XAxis
                            dataKey="name"
                            stroke="#4C91B6"
                            tick={{
                              fill: "#4C91B6",
                              fontSize: { xs: 10, sm: 11 },
                              fontWeight: 600,
                            }}
                          />
                          <YAxis
                            stroke="#4C91B6"
                            tick={{
                              fill: "#4C91B6",
                              fontSize: { xs: 10, sm: 11 },
                              fontWeight: 600,
                            }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar
                            dataKey="pass"
                            fill="#4C91B6"
                            name="Pass"
                            radius={[4, 4, 0, 0]}
                            animationDuration={1000}
                          />
                          <Bar
                            dataKey="fail"
                            fill="#f44336"
                            name="Fail"
                            radius={[4, 4, 0, 0]}
                            animationDuration={1000}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Typography
                      sx={{
                        color: "#333333",
                        opacity: 0.8,
                        fontStyle: "italic",
                        textAlign: "center",
                        py: 3,
                        fontSize: { xs: "0.85rem", sm: "1rem" },
                      }}
                    >
                      {barData.length === 0
                        ? "No performance data available."
                        : "All students have 0% pass/fail rates."}
                    </Typography>
                  )
                ) : (
                  <Typography
                    sx={{
                      color: "#333333",
                      opacity: 0.8,
                      fontStyle: "italic",
                      textAlign: "center",
                      py: 3,
                      fontSize: { xs: "0.85rem", sm: "1rem" },
                    }}
                  >
                    No exams available yet.
                  </Typography>
                )}
              </Paper>
            </Grow>
          </Grid>

          {/* Timetable Grid */}
          <Grid item xs={12} sm={6} md={6}>
            <Grow in={true} timeout={1100}>
              <Paper
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  bgcolor: "#ffffff",
                  borderRadius: 3,
                  color: "#333333",
                  boxShadow: "0 6px 20px rgba(76, 175, 80, 0.15)",
                  maxHeight: { xs: 400, sm: 450 }, // Consistent height
                  minHeight: { xs: 400, sm: 450 }, // Consistent height
                  overflowY: "auto",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Schedule sx={{ mr: 0.5, color: "#4C639B", fontSize: { xs: 18, sm: 24 } }} />
                  <Typography
                    variant="h6"
                    sx={{
                      color: "#4C639B",
                      fontWeight: "bold",
                      fontSize: { xs: "1rem", sm: "1.4rem" },
                    }}
                  >
                    Timetable
                  </Typography>
                </Box>

                {timetable.length > 0 ? (
                  <TableContainer
                    sx={{
                      px: { xs: 0.5, sm: 1 },
                      py: { xs: 1, sm: 1.5 },
                      borderRadius: 2,
                      boxShadow: "0px 3px 8px rgba(76, 175, 80, 0.1)",
                    }}
                  >
                    <Table
                      sx={{
                        borderRadius: "12px",
                        overflow: "hidden",
                        minWidth: { xs: 180, sm: 220 },
                      }}
                    >
                      <TableHead>
                        <TableRow
                          sx={{
                            background: "linear-gradient(135deg, #f3f3f3, #0000ff, #f3f3f3)",
                            "& th": {
                              fontSize: { xs: "0.65rem", sm: "0.8rem" },
                              fontWeight: "bold",
                              padding: { xs: "0.3rem", sm: "0.6rem" },
                              textTransform: "uppercase",
                              letterSpacing: "0.4px",
                              textAlign: "center",
                              color: "#000",
                            },
                          }}
                        >
                          <TableCell>Time</TableCell>
                          <TableCell>Class</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {timetable.map((slot, index) => (
                          <TableRow
                            key={index}
                            sx={{
                              backgroundColor: slot.class.toLowerCase() === "break" ? "#f1f8f4" : "#ffffff",
                              transition: "all 0.3s ease-in-out",
                              "&:hover": {
                                backgroundColor: "linear-gradient(135deg, #f3f3f3, #0000ff, #f3f3f3)",
                                transform: "scale(1.01)",
                                boxShadow: "0px 4px 8px rgba(76, 175, 80, 0.1)",
                              },
                            }}
                          >
                            <TableCell
                              sx={{
                                py: { xs: 0.3, sm: 0.8 },
                                px: { xs: 0.3, sm: 0.8 },
                                color: "#4C639B",
                                fontWeight: 500,
                                fontSize: { xs: "0.7rem", sm: "0.85rem" },
                                textAlign: "center",
                                borderBottom: "1px solid #c8e6c9",
                              }}
                            >
                              {slot.time}
                            </TableCell>
                            <TableCell
                              sx={{
                                py: { xs: 0.3, sm: 0.8 },
                                px: { xs: 0.3, sm: 0.8 },
                                color: "#4C639B",
                                fontWeight: 500,
                                fontSize: { xs: "0.7rem", sm: "0.85rem" },
                                textAlign: "center",
                                borderBottom: "1px solid #c8e6c9",
                              }}
                            >
                              {slot.class}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography
                    sx={{
                      mt: 1,
                      textAlign: "center",
                      fontSize: { xs: "0.8rem", sm: "0.9rem" },
                      color: "#333333",
                    }}
                  >
                    No timetable available.
                  </Typography>
                )}
              </Paper>
            </Grow>
          </Grid>
        </Grid>

        <Grid item xs={12} md={12}>
          <Grow in={true} timeout={1300}>
            <Box
              sx={{


                p: { xs: 1, sm: 2, md: 3 },
                mb: 3,
                borderRadius: 3,
                boxShadow: "0 4px 16px rgba(76, 175, 80, 0.1)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: { xs: 1, sm: 2 },
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontSize: { xs: "1.3rem", sm: "1.7rem", md: "2rem" },
                    fontWeight: 700,
                    background: "#0000ff",
                    color: "white",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Calendar & Events
                </Typography>
                <IconButton
                  onClick={handleRefresh}
                  sx={{
                    color: "#1d4261",
                    background: "rgba(76, 175, 80, 0.2)",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "rotate(180deg)",
                      background: "#4C639B",
                      color: "#f5f5f5",
                    },
                  }}
                  aria-label="Refresh calendar"
                >
                  <Refresh />
                </IconButton>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: { xs: 2, sm: 3, md: 4 },
                  p: { xs: 1, sm: 2, md: 3 },
                  background: "#f5f5f5",
                  borderRadius: 3,
                  boxShadow: "0 4px 16px rgba(29, 53, 192, 0.62)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid rgba(27, 40, 155, 0.72)",
                  maxWidth: "1200px",
                  mx: "auto",
                  color: "#f5f5f5"
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1, sm: 2, md: 3 },
                    background: "rgba(76, 83, 175, 0.1)",
                    width: { xs: "100%", md: "50%" },
                    maxWidth: { xs: "100%", sm: "400px", md: "450px" },
                    mx: "auto",
                    borderRadius: 3,
                    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
                    border: "1px solid rgba(47, 71, 175, 0.81)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow:
                        "0 8px 24px rgba(0, 0, 0, 0.15), 0 0 6px rgba(57, 59, 177, 0.3)",
                    },
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      mb: { xs: 1, sm: 2 },
                      display: "flex",
                      alignItems: "center",
                      fontSize: { xs: "1rem", sm: "1.2rem", md: "1.3rem" },
                      fontWeight: 700,
                      color: "#4C91B6  !important",
                      // background: "linear-gradient(135deg, #272d31, #0000ff, #272d31)",
                      WebkitBackgroundClip: "text",
                      // WebkitTextFillColor: "transparent",
                      letterSpacing: "0.03em",
                    }}
                  >
                    <CalendarToday
                      sx={{
                        mr: 1,
                        fontSize: { xs: 20, sm: 22, md: 24 },
                        color: "#4C91B6 !important",
                        // filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))",
                      }}
                    />
                    Calendar - {format(currentMonth, "MMMM yyyy")}
                  </Typography>

                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateCalendar
                      value={selectedDate}
                      onChange={(newDate) => setSelectedDate(newDate)}
                      onMonthChange={handleMonthChange}
                      slots={{ day: ServerDay }}
                      slotProps={{
                        day: {
                          highlightedDays,
                        },
                      }}
                      sx={{
                        width: "100%",
                        maxWidth: "100%",
                        height: "auto",
                        background: "rgba(236, 243, 236, 0.05)",
                        borderRadius: 2,
                        p: { xs: 0.5, sm: 1, md: 1.5 },
                        boxShadow: "inset 0 1px 4px rgba(0, 0, 0, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        "& .MuiDateCalendar-root": {
                          width: "100%",
                          minHeight: {
                            xs: "280px",
                            sm: "320px",
                            md: "340px",
                          },
                        },
                        "& .MuiPickersDay-root": {
                          fontSize: {
                            xs: "0.7rem",
                            sm: "0.8rem",
                            md: "0.85rem",
                          },
                          width: { xs: "28px", sm: "32px", md: "36px" },
                          height: { xs: "28px", sm: "32px", md: "36px" },
                          borderRadius: "50%",
                          margin: "0 auto",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          "&.Mui-selected": {
                            background: "linear-gradient(135deg, #f3f3f3, #0000ff, #272d31)",
                            color: "black",
                            fontWeight: 700,
                            boxShadow: "0 2px 8px rgba(76, 99, 175, 0.5)",
                            "&:hover": {
                              background: "linear-gradient(135deg, #272d31, #0000ff, #272d31)",
                            },
                          },
                        },
                        "& .MuiDayCalendar-weekDayLabel": {
                          fontSize: {
                            xs: "0.65rem",
                            sm: "0.75rem",
                            md: "0.8rem",
                          },
                          width: { xs: "28px", sm: "32px", md: "36px" },
                          height: { xs: "24px", sm: "28px", md: "30px" },
                          color: "black",
                          fontWeight: 600,
                          letterSpacing: "0.05em",
                          margin: "0 auto",
                        },
                        "& .MuiPickersCalendarHeader-label": {
                          fontSize: {
                            xs: "0.8rem",
                            sm: "0.95rem",
                            md: "1.05rem",
                          },
                          color: "black",
                          fontWeight: 700,
                          background: "linear-gradient(135deg, #272d31, #0000ff, #272d31)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        },
                        "& .MuiDayCalendar-slideTransition": {
                          minHeight: {
                            xs: "180px",
                            sm: "220px",
                            md: "240px",
                          },
                        },
                        "& .MuiPickersArrowSwitcher-root": {
                          "& .MuiIconButton-root": {
                            color: "#f5f5f5",
                            background: "rgba(34, 101, 202, 0.57)",
                            borderRadius: "50%",
                            padding: { xs: "4px", sm: "6px", md: "8px" },
                            transition: "all 0.3s ease",
                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                            "&:hover": {
                              background: "linear-gradient(135deg, #272d31, #0000ff, #272d31)",
                              color: "#4C91B6",
                              boxShadow: "0 2px 8px rgba(76, 175, 80, 0.3)",
                              transform: "scale(1.1)",
                            },
                          },
                        },
                        "& .MuiDayCalendar-weekContainer": {
                          margin: { xs: "1px 0", sm: "2px 0" },
                          justifyContent: "space-around",
                        },
                        "& .MuiPickersCalendarHeader-root": {
                          padding: { xs: "4px", sm: "8px", md: "10px" },
                          marginTop: { xs: "2px", sm: "4px", md: "6px" },
                          marginBottom: { xs: "4px", sm: "6px", md: "8px" },
                        },
                        // Add styles for the YearPicker to display in one column on mobile
                        "& .MuiYearCalendar-root": {
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" }, // Single column on mobile, multi-column on larger screens
                          gap: { xs: "8px", sm: "12px" },
                          padding: { xs: "8px", sm: "12px" },
                          justifyItems: "center",
                          maxWidth: { xs: "200px", sm: "100%" }, // Limit width on mobile for better centering
                          mx: { xs: "auto", sm: 0 }, // Center on mobile
                        },
                        "& .MuiPickersYear-yearButton": {
                          fontSize: { xs: "0.9rem", sm: "1rem" },
                          width: { xs: "100%", sm: "auto" },
                          padding: { xs: "8px", sm: "10px" },
                          borderRadius: "8px",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            background: "rgba(76, 175, 80, 0.2)",
                            transform: "scale(1.05)",
                          },
                          "&.Mui-selected": {
                            background: "linear-gradient(135deg, #272d31, #0000ff, #272d31)",
                            color: "black",
                            fontWeight: 700,
                            "&:hover": {
                              background: "linear-gradient(135deg, #272d31, #0000ff, #272d31)",
                            },
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 2,
                      mt: 1.5,
                      p: 1,
                      borderRadius: 2,
                      background: "rgba(55, 85, 168, 0.1)",
                      border: "1px solid rgba(76, 175, 80, 0.2)",
                      boxShadow: "0 1px 4px rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #272d31, #0000ff, #272d31)",
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: { xs: "0.65rem", sm: "0.7rem" },
                          color: "black",
                        }}
                      >
                        Events
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #272d31, #0000ff, #272d31)",
                          border: "1px solid #f5f5f5",
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: { xs: "0.65rem", sm: "0.7rem" },
                          color: "#4C91B6",
                        }}
                      >
                        Today
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1, sm: 2, md: 3 },
                    maxHeight: { xs: "300px", sm: "350px", md: "400px" },
                    overflow: "auto",
                    background: "rgba(92, 76, 175, 0.1)",
                    width: { xs: "100%", md: "50%" },
                    borderRadius: 3,
                    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
                    border: "1px solid rgba(76, 175, 80, 0.3)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow:
                        "0 8px 24px rgba(0, 0, 0, 0.15), 0 0 6px rgba(76, 175, 80, 0.3)",
                    },
                    "&::-webkit-scrollbar": {
                      width: "4px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "rgba(76, 117, 175, 0.2)",
                      borderRadius: "2px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "linear-gradient(135deg, #272d31, #0000ff, #272d31)",
                      borderRadius: "2px",
                      border: "1px solid rgba(76, 175, 80, 0.5)",
                    },
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      fontSize: { xs: "1rem", sm: "1.2rem", md: "1.3rem" },
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      color: "#4C91B6",
                      background: "linear-gradient(135deg, #272d31, #0000ff, #272d31)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      letterSpacing: "0.03em",
                      pb: 0.5,
                      borderBottom: "1px solid rgba(76, 81, 175, 0.2)",
                      mb: 1.5,
                    }}
                  >
                    <CalendarToday
                      sx={{
                        fontSize: { xs: 18, sm: 20, md: 22 },
                        color: "#4C91B6",
                        filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))",
                      }}
                    />
                    {format(selectedDate, "MMMM d, yyyy")}
                  </Typography>

                  <List sx={{ p: 0 }}>
                    <motion.div>
                      {getSelectedDateItems().dayEvents.length > 0 && (
                        <Box mb={1.5}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontSize: { xs: "0.85rem", sm: "0.9rem" },
                              fontWeight: 600,
                              color: "#4C91B6",
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              pl: 0.5,
                              mb: 0.5,
                            }}
                          >
                            <Event sx={{ color: "#4C91B6" }} fontSize="small" />
                            Events
                          </Typography>
                          {getSelectedDateItems().dayEvents.map((event) => (
                            <motion.div
                              key={event._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                              <ListItem
                                sx={{
                                  mb: 1,
                                  bgcolor: "rgba(76, 102, 175, 0.1))",
                                  borderRadius: 2,
                                  border: "1px solid rgba(76, 175, 80, 0.2)",
                                  p: { xs: 1, sm: 1.5 },
                                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                                  transition: "all 0.3s ease",
                                  "&:hover": {
                                    bgcolor: "rgba(76, 102, 175, 0.2)",
                                    borderColor: "rgba(84, 76, 175, 0.4)",
                                    boxShadow:
                                      "0 4px 16px rgba(76, 175, 80, 0.15)",
                                    transform: "translateY(-1px) scale(1.01)",
                                  },
                                }}
                              >
                                <ListItemText
                                  primary={
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        mb: 0.25,
                                      }}
                                    >
                                      <motion.div>
                                        <Event
                                          sx={{
                                            fontSize: { xs: 16, sm: 18 },
                                            color: "#4C91B6",
                                            filter:
                                              "drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2))",
                                          }}
                                        />
                                      </motion.div>
                                      <Typography
                                        variant="subtitle1"
                                        sx={{
                                          fontSize: {
                                            xs: "0.8rem",
                                            sm: "0.85rem",
                                            md: "0.9rem",
                                          },
                                          fontWeight: 600,
                                          background:
                                            "linear-gradient(135deg, #272d31, #0000ff, #272d31)",
                                          WebkitBackgroundClip: "text",
                                          WebkitTextFillColor: "transparent",
                                        }}
                                      >
                                        {event.name}
                                      </Typography>
                                    </Box>
                                  }
                                  secondary={
                                    event.img && (
                                      <Typography component="div" sx={{ mt: 1.5 }}>
                                        <motion.img
                                          src={event.img || '/placeholder.svg'}
                                          alt={event.name}
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          transition={{ duration: 0.4 }}
                                          style={{
                                            width: '100%',
                                            maxWidth: { xs: 150, sm: 200 },
                                            height: 'auto',
                                            borderRadius: '8px',
                                            objectFit: 'cover',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                                          }}
                                        />
                                      </Typography>
                                    )
                                  }
                                />
                              </ListItem>
                            </motion.div>
                          ))}
                        </Box>
                      )}

                      {getSelectedDateItems().dayAnnouncements.length > 0 && (
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontSize: { xs: "0.85rem", sm: "0.9rem" },
                              fontWeight: 600,
                              color: "#4C91B6",
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              pl: 0.5,
                              mb: 0.5,
                            }}
                          >
                            <Announcement
                              fontSize="small"
                              sx={{ color: "#4C91B6" }}
                            />
                            Announcements
                          </Typography>
                          {getSelectedDateItems().dayAnnouncements.map(
                            (announcement) => (
                              <motion.div
                                key={announcement._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{
                                  duration: 0.3,
                                  ease: "easeOut",
                                }}
                              >
                                <ListItem
                                  sx={{
                                    mb: 1,
                                    bgcolor: "rgba(59, 67, 175, 0.1)",
                                    borderRadius: 2,
                                    border: "1px solid rgba(76, 175, 80, 0.2)",
                                    p: { xs: 1, sm: 1.5 },
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                      bgcolor: "rgba(84, 76, 175, 0.2)",
                                      borderColor: "rgba(76, 76, 175, 0.4)",
                                      boxShadow:
                                        "0 4px 16px rgba(76, 79, 175, 0.15)",
                                      transform: "translateY(-1px) scale(1.01)",
                                    },
                                  }}
                                >
                                  <ListItemText
                                    primary={
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 1,
                                          mb: 0.25,
                                        }}
                                      >
                                        <Announcement
                                          sx={{
                                            fontSize: { xs: 16, sm: 18 },
                                            color: "#4C91B6",
                                            filter:
                                              "drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2))",
                                          }}
                                        />
                                        <Typography
                                          variant="subtitle1"
                                          sx={{
                                            fontSize: {
                                              xs: "0.8rem",
                                              sm: "0.85rem",
                                              md: "0.9rem",
                                            },
                                            fontWeight: 600,
                                            background:
                                              "linear-gradient(135deg, #272d31, #0000ff, #272d31)",
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent",
                                          }}
                                        >
                                          {announcement.title}
                                        </Typography>
                                      </Box>
                                    }
                                    secondary={
                                      <Typography
                                        sx={{
                                          fontSize: {
                                            xs: "0.7rem",
                                            sm: "0.75rem",
                                            md: "0.8rem",
                                          },
                                          color: "black",
                                          mt: 0.75,
                                          lineHeight: 1.5,
                                          pl: 0.5,
                                          borderLeft:
                                            "2px solid rgba(76, 175, 80, 0.3)",
                                        }}
                                      >
                                        {announcement.message}
                                      </Typography>
                                    }
                                  />
                                </ListItem>
                              </motion.div>
                            )
                          )}
                        </Box>
                      )}

                      {getSelectedDateItems().dayEvents.length === 0 &&
                        getSelectedDateItems().dayAnnouncements.length ===
                        0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Box
                              sx={{
                                textAlign: "center",
                                py: 4,
                                px: 1.5,
                                background: "rgba(76, 175, 80, 0.1)",
                                borderRadius: 2,
                                border: "1px dashed rgba(86, 101, 194, 0.3)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 1.5,
                              }}
                            >
                              <Typography
                                sx={{
                                  color: "#4C91B6",
                                  fontSize: { xs: "0.8rem", sm: "0.85rem" },
                                  fontWeight: 500,
                                }}
                              >
                                No events or announcements for this date
                              </Typography>
                            </Box>
                          </motion.div>
                        )}
                    </motion.div>
                  </List>
                </Paper>
              </Box>
            </Box>
          </Grow>
        </Grid>

        <Grid item xs={12}>
          <Box
            sx={{
              mt: 4,
              bgcolor: "#ffffff",
              borderRadius: "1rem",
              boxShadow: "0 4px 12px rgba(76, 175, 80, 0.2)",
              overflow: "hidden",
            }}
          >
            <Box sx={{ p: 2, borderBottom: "1px solid #e8f5e9" }}>
              <Typography
                variant="h6"
                sx={{ color: "#4C91B6", fontWeight: 600 }}
              >
                🕒 Leave Requests
              </Typography>
            </Box>

            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                backgroundColor: "#f1f8e9",
                p: 2,
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{
                      background: "linear-gradient(135deg, #272d31, #0000ff, #272d31)",
                      "& th": {
                        color: "#ffffff",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        padding: "0.75rem",
                      },
                    }}
                  >
                    <TableCell>Student</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaveRequests
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((request) => (
                      <TableRow
                        key={request._id}
                        sx={{
                          "&:hover": {
                            backgroundColor: "#e8f5e9",
                          },
                        }}
                      >
                        <TableCell
                          sx={{ fontSize: "0.85rem", color: "#4C91B6" }}
                        >
                          {request.studentId?.name || "N/A"}
                        </TableCell>
                        <TableCell
                          sx={{ fontSize: "0.85rem", color: "#4C91B6" }}
                        >
                          {request.reason || "N/A"}
                        </TableCell>
                        <TableCell
                          sx={{ fontSize: "0.85rem", color: "#4C91B6" }}
                        >
                          {request.fromDate
                            ? new Date(request.fromDate).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell
                          sx={{ fontSize: "0.85rem", color: "#4C91B6" }}
                        >
                          {request.toDate
                            ? new Date(request.toDate).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.85rem" }}>
                          <Chip
                            label={request.status}
                            size="small"
                            sx={{
                              fontSize: "0.7rem",
                              fontWeight: "500",
                              borderRadius: "1rem",
                              color:
                                request.status === "pending"
                                  ? "#333"
                                  : "#ffffff",
                              backgroundColor:
                                request.status === "approved"
                                  ? "black"
                                  : request.status === "rejected"
                                    ? "#f44336"
                                    : "#fff176",
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {request.status === "pending" && (
                            <Stack
                              direction="row"
                              spacing={1}
                              justifyContent="center"
                              alignItems="center"
                            >
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                sx={{
                                  textTransform: "none",
                                  fontSize: "0.75rem",
                                  px: 1.5,
                                  py: 0.5,
                                  mb: 0.5,
                                }}
                                onClick={() =>
                                  handleLeaveRequestAction(
                                    request._id,
                                    "approved"
                                  )
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                variant="contained"
                                color="error"
                                size="small"
                                sx={{
                                  textTransform: "none",
                                  fontSize: "0.75rem",
                                  px: 1.5,
                                  py: 0.5,
                                }}
                                onClick={() =>
                                  handleLeaveRequestAction(
                                    request._id,
                                    "rejected"
                                  )
                                }
                              >
                                Reject
                              </Button>
                            </Stack>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10]}
                component="div"
                count={leaveRequests.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows":
                  {
                    fontSize: "0.75rem",
                    color: "#4C91B6",
                  },
                  ".MuiTablePagination-select": {
                    fontSize: "0.75rem",
                    color: "#4C91B6",
                  },
                  ".MuiTablePagination-actions button": {
                    color: "#4C91B6",
                    "&:hover": {
                      backgroundColor: "linear-gradient(135deg, #272d31, #0000ff, #272d31)",
                    },
                  },
                }}
              />
            </TableContainer>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeacherDashboard;
