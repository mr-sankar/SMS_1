import {
  Mode,
  Announcement,
  CalendarToday,
  Event,
  Refresh,
} from "@mui/icons-material";
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";

import {
  DateCalendar,
  LocalizationProvider,
  PickersDay,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import axios from "axios";
import { motion } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Table,
} from "react-bootstrap";
import {
  FaBook,
  FaCalendarAlt,
  FaCalendarCheck,
  FaClock,
  FaMedal,
  FaTrophy,
  FaTrash,
} from "react-icons/fa";
import Swal from "sweetalert2";
import {
  format,
  getMonth,
  getYear,
  isSameDay,
  isSameMonth,
  isValid,
  parseISO,
  startOfMonth,
} from "date-fns";

// ServerDay component with improved event highlighting
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

          // Today's date styling
          ...(isToday && {
            border: "none",
            background: "linear-gradient(145deg, #fef3c7, #fef9c3)",
            fontWeight: 700,
            color: "#d97706",
            boxShadow: "0 0 8px rgba(234, 179, 8, 0.4)",
          }),

          // Event date styling
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
              background: "linear-gradient(145deg, #6366f1, #a855f7)",
              opacity: 0.2,
              zIndex: -1,
            },
            color: "#4338ca",
            fontWeight: 700,
            "&:hover": {
              backgroundColor: "transparent",
              "&::before": {
                opacity: 0.3,
              },
            },
          }),

          // Consistent hover effect for all days
          "&:hover": {
            transform: "scale(1.1)",
            transition: "transform 0.2s ease",
            zIndex: 2,
          },
        }}
      />

      {/* Indicator dot for events */}
      {isHighlighted && (
        <Box
          sx={{
            position: "absolute",
            bottom: 2,
            left: "50%",
            transform: "translateX(-50%)",
            width: 5,
            height: 5,
            background: "linear-gradient(145deg, #6366f1, #a855f7)",
            borderRadius: "50%",
            boxShadow: "0 0 4px rgba(99, 102, 241, 0.6)",
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

function StudentDashboard() {
  const [stats, setStats] = useState({
    attendance: 0,
    assignments: 0,
    averageGrade: 0,
    badge: { name: "None", class: "bg-light text-muted" },
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [timetableLoading, setTimetableLoading] = useState(true);
  const [timetableError, setTimetableError] = useState("");
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveRequest, setLeaveRequest] = useState({
    fromDate: "",
    toDate: "",
    reason: "",
  });

  // Calendar and Events/Announcements State
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const user = useMemo(() => JSON.parse(localStorage.getItem("user")), []);

  // Setup Axios interceptors for authorization
  useEffect(() => {
    const token = localStorage.getItem("token");

    axios.interceptors.request.use(
      (config) => {
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
          Swal.fire({
            icon: "error",
            title: "Session Expired",
            text: "Please log in again.",
          }).then(() => {
            localStorage.clear();
            window.location.href = "/login";
          });
        } else if (error.response?.status === 403) {
          Swal.fire({
            icon: "error",
            title: "Access Denied",
            text: "You don’t have permission to view this data.",
          });
        }
        return Promise.reject(error);
      }
    );
  }, []);

  // Fetch calendar-related data
  const fetchEvents = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/events`);
      return response.data.map((event) => ({
        ...event,
        date: parseISO(event.date),
      }));
    } catch (error) {
      console.error("Error fetching events:", error);
      throw error.response?.data?.message || "Failed to fetch events";
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/announcements`);
      return response.data.map((announcement) => ({
        ...announcement,
        announcementDate: parseISO(announcement.announcementDate),
      }));
    } catch (error) {
      console.error("Error fetching announcements:", error);
      throw error.response?.data?.message || "Failed to fetch announcements";
    }
  }, []);

  const fetchCalendarData = useCallback(async () => {
    setCalendarLoading(true);
    setCalendarError(null);
    try {
      const [eventsData, announcementsData] = await Promise.all([
        fetchEvents(),
        fetchAnnouncements(),
      ]);
      setEvents(eventsData);
      setAnnouncements(announcementsData);
    } catch (error) {
      setCalendarError(
        "Failed to load events and announcements. Please try again later."
      );
    } finally {
      setCalendarLoading(false);
    }
  }, [fetchEvents, fetchAnnouncements]);

  useEffect(() => {
    if (!user || user.role !== "student" || !user.email) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please log in as a student to view the dashboard",
      });
      return;
    }
    fetchDashboardData1();
    fetchTimetableData();
    fetchCalendarData(); // Fetch calendar data
    const interval = setInterval(fetchCalendarData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [user, fetchCalendarData]);

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

  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  const fetchDashboardData1 = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const email = user?.email;
    try {
      const response = await axios.get(
        `${BASE_URL}/api/student/dashboard/${encodeURIComponent(email)}`
      );
      setStats(response.data.stats);
      setRecentActivities(response.data.recentActivities);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const fetchTimetableData = async () => {
    try {
      const studentResponse = await axios.get(
        `${BASE_URL}/api/student/${user.email}`
      );
      const timetableResponse = await axios.get(
        `${BASE_URL}/api/timetable/${studentResponse.data.className}/${studentResponse.data.section}`
      );
      let scheduleData = [];
      if (
        timetableResponse.data.success &&
        Array.isArray(timetableResponse.data.data)
      ) {
        scheduleData = timetableResponse.data.data.flatMap((timetable) =>
          timetable.schedule.map((entry) => ({
            examName: timetable.examName,
            date: entry.date,
            day: entry.day,
            from: entry.from,
            to: entry.to,
            subject: entry.subject,
          }))
        );
      } else {
        setTimetableError("Unexpected timetable response structure.");
        return;
      }
      setTimetable(scheduleData);
      if (scheduleData.length === 0) {
        setTimetableError("No timetable entries found for this class.");
      } else {
        setTimetableError("");
      }
    } catch (err) {
      setTimetableError(
        err.response?.data?.message || "Failed to load timetable details."
      );
    } finally {
      setTimetableLoading(false);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("user"));
    const email = user?.email;
    if (!email) return;
    try {
      await axios.post(
        `${BASE_URL}/api/student/leave-request/${encodeURIComponent(email)}`,
        leaveRequest
      );
      setShowLeaveModal(false);
      setLeaveRequest({ fromDate: "", toDate: "", reason: "" });
      fetchDashboardData1();
    } catch (error) {
      console.error("Error submitting leave request:", error);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to delete this leave request?"))
      return;
    const user = JSON.parse(localStorage.getItem("user"));
    const email = user?.email;
    if (!email) return;
    try {
      await axios.delete(
        `${BASE_URL}/api/student/leave-request/${encodeURIComponent(
          email
        )}/${requestId}`
      );
      fetchDashboardData1();
    } catch (error) {
      console.error("Error deleting leave request:", error);
    }
  };

  if (!user || user.role !== "student") {
    return (
      <div className="text-center p-3 text-muted">
        Please log in as a student to view the dashboard.
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      {/* Calendar and Events/Announcements Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #0B0E10, #7091E6, #0B0E10)",
          p: { xs: 1, sm: 2, md: 3 },
          mb: 3,
          borderRadius: 3,
          boxShadow: "0 4px 16px rgba(31, 38, 135, 0.1)",
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

              // background: "linear-gradient(90deg, #2e1065, #4338ca)",
              color: "#0000ff",
              // WebkitBackgroundClip: "text",
              // WebkitTextFillColor: "transparent",
            }}
          >
            Student Dashboard
          </Typography>
          <IconButton
            onClick={handleRefresh}
            color="primary"
            sx={{
              background: "rgba(255, 255, 255, 0.8)",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "rotate(180deg)",
                // background: "linear-gradient(145deg, #6366f1, #a855f7)",
                color: "white",
              },
            }}
          >
            <Refresh />
          </IconButton>
        </Box>

        {calendarLoading ? (
          <Box
            sx={{
              textAlign: 'center',
              p: { xs: 2, sm: 3 },
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: '0.85rem', sm: '1rem' },
                fontWeight: 500,
                color: '#4338ca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              >
                <Refresh color='primary' />
              </motion.div>
              Loading calendar...
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 2, sm: 3, md: 4 },
              p: { xs: 1, sm: 2, md: 3 },
              background: 'linear-gradient(135deg, #0B0E10, #7091E6, #0B0E10)',
              borderRadius: 3,
              boxShadow: '0 4px 16px rgba(31, 38, 135, 0.15)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              maxWidth: { xs: '100%', sm: '90%', md: '1200px' },
              mx: 'auto',
            }}
          >
            {/* Calendar Side */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1, sm: 2, md: 3 },
                background: 'rgba(255, 255, 255, 0.7)',
                width: { xs: '100%', md: '50%' },
                maxWidth: { xs: '100%', sm: '400px', md: '450px' },
                mx: 'auto',
                borderRadius: 3,
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow:
                    '0 8px 24px rgba(0, 0, 0, 0.15), 0 0 6px rgba(99, 102, 241, 0.3)',
                },
              }}
            >
              <Typography
                variant='h6'
                sx={{
                  mb: { xs: 1, sm: 2 },
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                  fontWeight: 700,
                  color: '#2e1065',
                  background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '0.03em',
                }}
              >
                <CalendarToday
                  sx={{
                    mr: 1,
                    fontSize: { xs: 18, sm: 20, md: 22 },
                    color: '#6366f1',
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
                  }}
                />
                Calendar - {format(currentMonth, 'MMMM yyyy')}
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
                                      background: "rgba(76, 175, 80, 0.05)",
                                      borderRadius: 2,
                                      p: { xs: 0.5, sm: 1, md: 1.5 },
                                      boxShadow: "inset 0 1px 4px rgba(0, 0, 0, 0.03)",
                                      border: "1px solid rgba(76, 175, 80, 0.3)",
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
                                          background: "linear-gradient(135deg, #272d31, #7091E6, #272d31)",
                                          color: "black",
                                          fontWeight: 700,
                                          boxShadow: "0 2px 8px rgba(76, 175, 80, 0.5)",
                                          "&:hover": {
                                            background: "linear-gradient(135deg, #272d31, #7091E6, #272d31)",
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
                                        background: "linear-gradient(135deg, #272d31, #7091E6, #272d31)",
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
                                            background: "linear-gradient(135deg, #272d31, #7091E6, #272d31)",
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
                                          background: "linear-gradient(135deg, #272d31, #7091E6, #272d31)",
                                          color: "black",
                                          fontWeight: 700,
                                          "&:hover": {
                                            background: "linear-gradient(135deg, #272d31, #7091E6, #272d31)",
                                          },
                                        },
                                      },
                                    }}
                                  />
                                </LocalizationProvider>

              {/* Event legends */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 2,
                  mt: 1.5,
                  p: 1,
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'linear-gradient(145deg, #6366f1, #a855f7)',
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' },
                      color: '#4b5563',
                    }}
                  >
                    Events
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'linear-gradient(145deg, #fef3c7, #fef9c3)',
                      border: '1px solid #d97706',
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' },
                      color: '#4b5563',
                    }}
                  >
                    Today
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Events and Announcements Side */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1, sm: 2, md: 3 },
                maxHeight: { xs: 'auto', sm: '350px', md: '400px' },
                overflow: 'auto',
                background: 'rgba(255, 255, 255, 0.7)',
                width: { xs: '100%', md: '50%' },
                borderRadius: 3,
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow:
                    '0 8px 24px rgba(0, 0, 0, 0.15), 0 0 6px rgba(99, 102, 241, 0.3)',
                },
                '&::-webkit-scrollbar': {
                  width: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(241, 245, 249, 0.8)',
                  borderRadius: '2px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'linear-gradient(145deg, #a855f7, #6366f1)',
                  borderRadius: '2px',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                },
              }}
            >
              <Typography
                variant='h6'
                gutterBottom
                sx={{
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: '#2e1065',
                  background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '0.03em',
                  pb: 0.5,
                  borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
                  mb: 1.5,
                }}
              >
                <CalendarToday
                  sx={{
                    fontSize: { xs: 16, sm: 18, md: 20 },
                    color: '#6366f1',
                    filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
                  }}
                />
                {format(selectedDate, 'MMMM d, yyyy')}
              </Typography>

              <List sx={{ p: 0 }}>
                <motion.div>
                  {/* Events for selected day */}
                  {getSelectedDateItems().dayEvents.length > 0 && (
                    <Box mb={1.5}>
                      <Typography
                        variant='subtitle1'
                        sx={{
                          fontSize: {
                            xs: '0.8rem',
                            sm: '0.85rem',
                            md: '0.9rem',
                          },
                          fontWeight: 600,
                          color: '#4338ca',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          pl: 0.5,
                          mb: 0.5,
                        }}
                      >
                        <Event color='primary' fontSize='small' />
                        Events
                      </Typography>

                      {getSelectedDateItems().dayEvents.map((event) => (
                        <motion.div
                          key={event._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                          <ListItem
                            sx={{
                              mb: 1,
                              bgcolor: 'rgba(255, 255, 255, 0.8)',
                              borderRadius: 2,
                              border: '1px solid rgba(99, 102, 241, 0.2)',
                              p: { xs: 1, sm: 1.5 },
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 1)',
                                borderColor: 'rgba(99, 102, 241, 0.4)',
                                boxShadow:
                                  '0 4px 16px rgba(99, 102, 241, 0.15)',
                                transform: 'translateY(-1px) scale(1.01)',
                              },
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    mb: 0.25,
                                  }}
                                >
                                  <Event
                                    sx={{
                                      fontSize: { xs: 14, sm: 16, md: 18 },
                                      color: '#6366f1',
                                      filter:
                                        'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2))',
                                    }}
                                  />
                                  <Typography
                                    variant='subtitle1'
                                    sx={{
                                      fontSize: {
                                        xs: '0.75rem',
                                        sm: '0.8rem',
                                        md: '0.85rem',
                                      },
                                      fontWeight: 600,
                                      background:
                                        'linear-gradient(90deg, #4f46e5, #8b5cf6)',
                                      WebkitBackgroundClip: 'text',
                                      WebkitTextFillColor: 'transparent',
                                    }}
                                  >
                                    {event.name}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                event.img && (
                                  <Box sx={{ mt: 1, textAlign: 'center' }}>
                                    <Box
                                      component='img'
                                      src={event.img || '/placeholder.svg'}
                                      alt={event.name}
                                      sx={{
                                        width: '100%',
                                        maxWidth: { xs: 120, sm: 150, md: 180 },
                                        height: 'auto',
                                        borderRadius: 2,
                                        boxShadow:
                                          '0 2px 8px rgba(0, 0, 0, 0.08)',
                                        transition:
                                          'transform 0.3s ease, box-shadow 0.3s ease',
                                        '&:hover': {
                                          transform: 'scale(1.03)',
                                          boxShadow:
                                            '0 4px 16px rgba(99, 102, 241, 0.2)',
                                        },
                                      }}
                                    />
                                  </Box>
                                )
                              }
                            />
                          </ListItem>
                        </motion.div>
                      ))}
                    </Box>
                  )}

                  {/* Announcements for selected day */}
                  {getSelectedDateItems().dayAnnouncements.length > 0 && (
                    <Box>
                      <Typography
                        variant='subtitle1'
                        sx={{
                          fontSize: {
                            xs: '0.8rem',
                            sm: '0.85rem',
                            md: '0.9rem',
                          },
                          fontWeight: 600,
                          color: '#6d28d9',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          pl: 0.5,
                          mb: 0.5,
                        }}
                      >
                        <Announcement
                          fontSize='small'
                          sx={{ color: '#8b5cf6' }}
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
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                          >
                            <ListItem
                              sx={{
                                mb: 1,
                                bgcolor: 'rgba(255, 255, 255, 0.8)',
                                borderRadius: 2,
                                border: '1px solid rgba(168, 85, 247, 0.2)',
                                p: { xs: 1, sm: 1.5 },
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  bgcolor: 'rgba(255, 255, 255, 1)',
                                  borderColor: 'rgba(168, 85, 247, 0.4)',
                                  boxShadow:
                                    '0 4px 16px rgba(168, 85, 247, 0.15)',
                                  transform: 'translateY(-1px) scale(1.01)',
                                },
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                      mb: 0.25,
                                    }}
                                  >
                                    <Announcement
                                      sx={{
                                        fontSize: { xs: 14, sm: 16, md: 18 },
                                        color: '#a855f7',
                                        filter:
                                          'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2))',
                                      }}
                                    />
                                    <Typography
                                      variant='subtitle1'
                                      sx={{
                                        fontSize: {
                                          xs: '0.75rem',
                                          sm: '0.8rem',
                                          md: '0.85rem',
                                        },
                                        fontWeight: 600,
                                        background:
                                          'linear-gradient(90deg, #8b5cf6, #4f46e5)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
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
                                        xs: '0.65rem',
                                        sm: '0.7rem',
                                        md: '0.75rem',
                                      },
                                      color: '#4b5563',
                                      mt: 0.75,
                                      lineHeight: 1.5,
                                      pl: 0.5,
                                      borderLeft:
                                        '2px solid rgba(168, 85, 247, 0.3)',
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

                  {/* No events or announcements message */}
                  {getSelectedDateItems().dayEvents.length === 0 &&
                    getSelectedDateItems().dayAnnouncements.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Box
                          sx={{
                            textAlign: 'center',
                            py: { xs: 3, sm: 4 },
                            px: 1.5,
                            background: 'rgba(255, 255, 255, 0.7)',
                            borderRadius: 2,
                            border: '1px dashed rgba(99, 102, 241, 0.3)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1.5,
                          }}
                        >
                          <Mode
                            sx={{
                              fontSize: { xs: 24, sm: 28, md: 32 },
                              color: '#d1d5db',
                              opacity: 0.8,
                            }}
                          />
                          <Typography
                            sx={{
                              color: '#6b7280',
                              fontSize: {
                                xs: '0.75rem',
                                sm: '0.8rem',
                                md: '0.85rem',
                              },
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
        )}

        {calendarError && (
          <Box
            sx={{
              mt: 1.5,
              p: 1.5,
              borderRadius: 2,
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            <Typography
              color="error"
              sx={{
                fontSize: { xs: "0.8rem", sm: "0.85rem" },
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <span role="img" aria-label="warning">
                ⚠️
              </span>
              {calendarError}
            </Typography>
          </Box>
        )}
      </Box>
      <Button
        variant=""
        onClick={() => setShowLeaveModal(true)}
        className="mb-4"
        style={{ backgroundColor: '#4C91B6', color: 'white' }}
      >
        Request Leave
      </Button>


      <Modal show={showLeaveModal} onHide={() => setShowLeaveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Leave Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleLeaveSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>From Date</Form.Label>
              <Form.Control
                type="date"
                value={leaveRequest.fromDate}
                onChange={(e) =>
                  setLeaveRequest({ ...leaveRequest, fromDate: e.target.value })
                }
                min={today}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>To Date</Form.Label>
              <Form.Control
                type="date"
                value={leaveRequest.toDate}
                onChange={(e) =>
                  setLeaveRequest({ ...leaveRequest, toDate: e.target.value })
                }
                min={today}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reason</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={leaveRequest.reason}
                onChange={(e) =>
                  setLeaveRequest({ ...leaveRequest, reason: e.target.value })
                }
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Submit
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
      <Card
        style={{
          background: "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          borderRadius: "1.2rem",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
          transition: "transform 0.3s ease",
        }}
      >
        <Card.Header
          style={{
            background: '#2D3A57',
            color: 'white',
            padding: "1rem 1.5rem",
            fontWeight: "600",
            fontSize: "1.3rem",
            letterSpacing: "0.5px",
            borderBottom: "none",
            boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.2)",
          }}
        >
          <h5
            className="mb-0"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <span role="img" aria-label="clock">
              🕒
            </span>{" "}
            Recent Activities
          </h5>
        </Card.Header>

        <Card.Body
          style={{ padding: "1.8rem 1.5rem", backgroundColor: "#fdfdff" }}
        >
          <Table
            responsive
            hover
            bordered
            style={{
              borderRadius: "0.8rem",
              overflow: "hidden",
              background: "#ffffff",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            }}
          >
            <thead
              style={{
                background: "linear-gradient(90deg, #5f2c82, #49a09d)",
                color: "#ffffff",
                fontSize: "0.95rem",
                fontWeight: "600",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                boxShadow: "inset 0 -2px 0 rgba(255, 255, 255, 0.1)",
              }}
            >
              <tr>
                <th style={{ padding: "0.9rem 1rem" }}>From Date</th>
                <th style={{ padding: "0.9rem 1rem" }}>To Date</th>
                <th style={{ padding: "0.9rem 1rem" }}>Reason</th>
                <th style={{ padding: "0.9rem 1rem" }}>Status</th>
                <th style={{ padding: "0.9rem 1rem" }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {recentActivities.map((activity) => (
                <tr
                  key={activity._id}
                  style={{
                    transition: "all 0.3s ease",
                    borderBottom: "1px solid #dee2e6",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f1f3f5";
                    e.currentTarget.style.transform = "scale(1.01)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(0,0,0,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <td style={{ padding: "0.8rem 1rem" }}>
                    {new Date(activity.fromDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "0.8rem 1rem" }}>
                    {new Date(activity.toDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "0.8rem 1rem" }}>
                    {activity.description || activity.reason}
                  </td>
                  <td style={{ padding: "0.8rem 1rem" }}>
                    <span
                      className={`badge bg-${activity.status === "completed" ||
                        activity.status === "approved"
                        ? "success"
                        : activity.status === "rejected"
                          ? "danger"
                          : "warning"
                        }`}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        textTransform: "capitalize",
                        fontWeight: 500,
                      }}
                    >
                      {activity.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.8rem 1rem" }}>
                    {activity.status === "pending" && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteRequest(activity._id)}
                        style={{
                          borderRadius: "6px",
                          transition: "transform 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.transform = "scale(1.1)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }
                      >
                        <FaTrash />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-4"
      >
        <Container className="timetable-container p-4 bg-light rounded-4 shadow-lg">
          <h3
            className="text-center mb-4 "
            style={{
              fontWeight: "800",
              fontSize: "2.2rem",
              textTransform: "uppercase",
              letterSpacing: "1px",
                       color: "#0000ff",

              // background: "linear-gradient(to right, #007bff, #00c6ff)",
              // WebkitBackgroundClip: "text",
              // WebkitTextFillColor: "transparent",
              // textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            <FaCalendarAlt className="me-2 text-primary" />
            Time Table
          </h3>

          <Card
            className="shadow"
            style={{
              background: "rgba(255, 255, 255, 0.75)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px",
              border: "1px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            <Card.Body className="p-4">
              <h5
                className="card-title  mb-4"
                style={{
                  fontWeight: "700",
                  fontSize: "1.5rem",
                  color: "#2D3A57",
                  borderBottom: "2px solid #0d6efd",
                  paddingBottom: "0.5rem",
                }}
              >
                <FaBook className="me-2" />
                Exam Timetable
              </h5>

              {timetableLoading ? (
                <div className="text-center">
                  <p style={{ fontSize: "1.2rem", color: "#6c757d" }}>
                    Loading timetable...
                  </p>
                </div>
              ) : timetableError ? (
                <div
                  className="text-center text-danger"
                  style={{ fontSize: "1.2rem" }}
                >
                  {timetableError}
                </div>
              ) : timetable.length > 0 ? (
                <Table
                  bordered
                  hover
                  responsive
                  className="mt-3"
                  style={{
                    borderRadius: "12px",
                    overflow: "hidden",
                    fontSize: "1.05rem",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                >
                  <thead
                    className="table-primary"
                    style={{
                      background: "linear-gradient(to right, #6a11cb, #2575fc)",
                      color: "#fff",
                      textAlign: "center",
                      fontWeight: "bold",
                      fontSize: "1.1rem",
                      letterSpacing: "0.5px",
                    }}
                  >
                    <tr style={{
                      background: "#2D3A57 !important",
                      color: "#fff",
                      textAlign: "center",
                      fontWeight: "bold",
                      fontSize: "1.1rem",
                      letterSpacing: "0.5px",
                    }}>
                      <th>
                        <FaCalendarAlt className="me-2" />
                        Exam Name
                      </th>
                      <th>
                        <FaCalendarAlt className="me-2" />
                        Date
                      </th>
                      <th>Day</th>
                      <th>
                        <FaClock className="me-2" />
                        From
                      </th>
                      <th>
                        <FaClock className="me-2" />
                        To
                      </th>
                      <th>Subject</th>
                    </tr>
                  </thead>

                  <tbody>
                    {timetable.map((entry, index) => (
                      <tr
                        key={index}
                        style={{
                          textAlign: "center",
                          fontWeight: "500",
                          transition: "all 0.3s ease",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f0faff";
                          e.currentTarget.style.transform = "scale(1.01)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(0, 0, 0, 0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "";
                          e.currentTarget.style.transform = "scale(1)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <td>{entry.examName}</td>
                        <td>{entry.date}</td>
                        <td>{entry.day}</td>
                        <td>{entry.from}</td>
                        <td>{entry.to}</td>
                        <td style={{ color: "#0d6efd", fontWeight: "600" }}>
                          {entry.subject}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center">
                  <p style={{ fontSize: "1.1rem", color: "#6c757d" }}>
                    No timetable available for this class.
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
      </motion.div>

      <style>{`
        .stats-card.bg-bronze {
          background-color: #cd7f32;
          color: white;
        }
        .stats-card.bg-warning {
          background-color: #ffc107;
          color: #212529;
        }
        .stats-card.bg-secondary {
          background-color: #6c757d;
          color: white;
        }
        .stats-card.bg-light {
          background-color: #f8f9fa;
          color: #6c757d;
        }
        @keyframes slideIn {
          0% { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(0.98); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default StudentDashboard;
