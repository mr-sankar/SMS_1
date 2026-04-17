"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import ProfileSwitcher from "./ProfileSwitcher";
import {
  Box,
  Typography,
  Paper,
  Grid,
  AppBar,
  Toolbar,
  Container,
  CircularProgress,
  Alert,
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
  Divider,
  IconButton,
} from "@mui/material";
import { Event, Announcement, CalendarToday, Refresh } from "@mui/icons-material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, DateCalendar, PickersDay } from "@mui/x-date-pickers";
import { format, isSameDay, isValid, isSameMonth, getMonth, getYear, startOfMonth } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// const BASE_URL = 
// process.env.NODE_ENV === "production"
// ? process.env.REACT_APP_API_DEPLOYED_URL
// : process.env.REACT_APP_API_URL;

const BASE_URL = process.env.REACT_APP_API_URL;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

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
          ...(isToday && {
            border: "none",
            background: "linear-gradient(135deg, #0B0E10, #7091E6, #0B0E10)",
            fontWeight: 700,
            color: "#d97706",
            boxShadow: "0 0 8px rgba(234, 179, 8, 0.4)",
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
              background: "linear-gradient(145deg, #6366f1, #21309e)",
              opacity: 0.2,
              zIndex: -1,
            },
            color: "#4338ca",
            fontWeight: 700,
            "&:hover": {
              backgroundColor: "transparent",
              "&::before": { opacity: 0.3 },
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
            background: "linear-gradient(145deg, #6366f1, #21309e)",
            borderRadius: "50%",
            boxShadow: "0 0 4px rgba(99, 102, 241, 0.6)",
            zIndex: 2,
          }}
        />
      )}
    </Box>
  );
}

const ParentDashboard = () => {
  const [childData, setChildData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const parentId = user?.roleId;
  const studentId = localStorage.getItem("selectedChild");
  const token = localStorage.getItem("token");

  const fetchChildData = async (childId) => {
    if (!childId || !token) return;
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/api/students/${childId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setChildData(response.data);
    } catch (err) {
      console.error("Error fetching student:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to fetch student data");
      setChildData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChildSelect = (childId) => {
    if (childId && childId !== studentId) {
      localStorage.setItem("selectedChild", childId);
      fetchChildData(childId);
    }
  };

  const fetchEvents = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.map((event) => ({
        ...event,
        date: new Date(event.date),
      }));
    } catch (error) {
      console.error("Error fetching events:", error);
      throw error;
    }
  }, [token]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.map((announcement) => ({
        ...announcement,
        announcementDate: new Date(announcement.announcementDate),
      }));
    } catch (error) {
      console.error("Error fetching announcements:", error);
      throw error;
    }
  }, [token]);

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
      setCalendarError("Failed to load events and announcements.");
    } finally {
      setCalendarLoading(false);
    }
  }, [fetchEvents, fetchAnnouncements]);

  useEffect(() => {
    if (studentId && token) {
      fetchChildData(studentId);
      fetchCalendarData();
      const interval = setInterval(fetchCalendarData, 300000);
      return () => clearInterval(interval);
    }
  }, [studentId, fetchCalendarData, token]);

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
      ...currentMonthAnnouncements.map((announcement) => announcement.announcementDate),
    ].filter(isValid);
  }, [events, announcements, currentMonth]);

  const getSelectedDateItems = useCallback(() => {
    const dayEvents = events.filter((event) => isSameDay(event.date, selectedDate));
    const dayAnnouncements = announcements.filter((announcement) =>
      isSameDay(announcement.announcementDate, selectedDate)
    );
    return { dayEvents, dayAnnouncements };
  }, [events, announcements, selectedDate]);

  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  const getFeeSummary = useMemo(() => {
    if (!childData?.feeDetails) return { totalPaid: 0, totalPending: 0 };
    const totalPaid = childData.feeDetails.terms.reduce(
      (sum, term) => sum + (term.paidAmount || 0),
      0
    );
    const totalPending = childData.feeDetails.totalFee - totalPaid;
    return { totalPaid, totalPending };
  }, [childData]);

  return (
    <Box sx={{ minHeight: "100vh", background: "transparent" }}>
      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
        <AppBar
          position="static"
          elevation={0}
          sx={{ background: "transparent", boxShadow: "0 6px 16px rgba(0, 0, 0, 0.15)" }}
        >
          <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#0000ff",
                letterSpacing: "-0.02em"
              }}
            >
              Parent Dashboard
            </Typography>

            {parentId && token ? (
              <ProfileSwitcher
                parentId={parentId}
                onChildSelect={handleChildSelect}
                selectedChildId={studentId}
              />
            ) : (
              <Typography sx={{ color: "#b91c1c" }}>
                {token ? "Parent ID not found" : "Please login to continue"}
              </Typography>
            )}
          </Toolbar>
        </AppBar>
      </motion.div>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <CircularProgress sx={{ color: "#6366f1" }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ bgcolor: "#fee2e2", color: "#b91c1c", borderRadius: "10px" }}>
            {error}
          </Alert>
        ) : childData ? (
          <motion.div
            key={childData._id}
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <motion.div variants={cardVariants}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: 3,
                      background: "linear-gradient(135deg, #0B0E10, #7091E6, #0B0E10)",
                      color: "#fafbfc",
                      borderRadius: "15px",
                    }}
                  >
                    <Typography variant="h4" gutterBottom sx={{ color: "#fafbfc", fontWeight: 700 }}>
                      {childData.name}'s Dashboard
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: "#fafbfc" }}>
                      Admission No: {childData.admissionNo}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: "#fafbfc" }}>
                      Class: {childData.className} {childData.section}
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>

              {/* Calendar Section */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: { xs: 1, sm: 2, md: 3 },
                    background: "rgba(255, 255, 255, 0.7)",
                    width: "100%", // Removed fixed maxWidth to allow flexibility
                    mx: "auto",
                    borderRadius: 3,
                    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.4)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15), 0 0 6px rgba(99, 102, 241, 0.3)",
                    },
                    overflow: "visible", // Ensure year picker isn't cut off
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        fontSize: { xs: "1rem", sm: "1.2rem", md: "1.3rem" },
                        fontWeight: 700,
                        color: "#2e1065",
                        background: "linear-gradient(90deg, #6366f1, #1f48af)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      <CalendarToday
                        sx={{ mr: 1, fontSize: { xs: 20, sm: 22, md: 24 }, color: "#3336d9" }}
                      />
                      Calendar - {format(currentMonth, "MMMM yyyy")}
                    </Typography>
                    <IconButton
                      onClick={handleRefresh}
                      sx={{
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                        "&:hover": {
                          background: "linear-gradient(145deg, #6366f1, #1f48af)",
                          color: "white",
                        },
                      }}
                    >
                      <Refresh sx={{ color: "#3336d9" }} />
                    </IconButton>
                  </Box>
                  {calendarLoading ? (
                    <Box sx={{ textAlign: "center", p: 3, background: "rgba(255, 255, 255, 0.7)" }}>
                      <Typography
                        sx={{ fontSize: { xs: "0.9rem", sm: "1rem" }, color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        >
                          <Refresh sx={{ color: "#3336d9" }} />
                        </motion.div>
                        Loading calendar...
                      </Typography>
                    </Box>
                  ) : (
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DateCalendar
                        value={selectedDate}
                        onChange={(newDate) => setSelectedDate(newDate)}
                        onMonthChange={handleMonthChange}
                        slots={{ day: ServerDay }}
                        slotProps={{ day: { highlightedDays } }}
                        sx={{
                          width: "100%",
                          "& .MuiDateCalendar-root": {
                            minHeight: { xs: "280px", sm: "320px", md: "340px" },
                            border: "1px solid red", // Debugging border
                          },
                          "& .MuiPickersDay-root": {
                            fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.85rem" },
                            width: { xs: "28px", sm: "32px", md: "36px" },
                            height: { xs: "28px", sm: "32px", md: "36px" },
                            borderRadius: "50%",
                            "&.Mui-selected": {
                              background: "linear-gradient(145deg, #6366f1, #21309e)",
                              color: "white",
                              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.5)",
                            },
                          },
                          "& .MuiDayCalendar-weekDayLabel": {
                            fontSize: { xs: "0.65rem", sm: "0.75rem", md: "0.8rem" },
                            width: { xs: "28px", sm: "32px", md: "36px" },
                            color: "#4b5563",
                          },
                          "& .MuiPickersCalendarHeader-label": {
                            fontSize: { xs: "0.8rem", sm: "0.95rem", md: "1.05rem" },
                            color: "#2e1065",
                            background: "linear-gradient(90deg, #6366f1, #21309e)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          },
                          "& .MuiDayCalendar-slideTransition": {
                            minHeight: { xs: "180px", sm: "220px", md: "240px" },
                          },
                          "& .MuiPickersArrowSwitcher-root .MuiIconButton-root": {
                            color: "#6366f1",
                            "&:hover": {
                              background: "linear-gradient(145deg, #21309e, #21309e)",
                              color: "white",
                            },
                          },
                          // Force three-column year picker
                          "& .MuiPickersYear-root": {
                            display: "grid !important",
                            gridTemplateColumns: "repeat(3, 1fr) !important",
                            gap: "8px",
                            padding: "8px",
                            minWidth: "240px", // Ensure minimum width for three columns
                            "& .MuiPickersYear-yearButton": {
                              minWidth: "60px",
                              height: "40px",
                              fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.9rem" },
                              justifyContent: "center",
                              "&.Mui-selected": {
                                background: "linear-gradient(145deg, #6366f1, #21309e)",
                                color: "white",
                              },
                              "&:hover": {
                                background: "rgba(99, 102, 241, 0.1)",
                              },
                            },
                          },
                          // Responsive adjustments
                          ...(theme) => ({
                            [theme.breakpoints.down("sm")]: {
                              "& .MuiPickersYear-root": {
                                gridTemplateColumns: "repeat(2, 1fr) !important",
                              },
                            },
                            [theme.breakpoints.down("xs")]: {
                              "& .MuiPickersYear-root": {
                                gridTemplateColumns: "1fr !important",
                                minWidth: "120px",
                              },
                            },
                          }),
                        }}
                      />
                    </LocalizationProvider>
                  )}
                  <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 1.5, p: 1, background: "rgba(255, 255, 255, 0.7)" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Box
                        sx={{ width: 6, height: 6, borderRadius: "50%", background: "linear-gradient(145deg, #6366f1, #21309e)" }}
                      />
                      <Typography sx={{ fontSize: { xs: "0.65rem", sm: "0.7rem" }, color: "#4b5563" }}>
                        Events
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: "50%", border: "1px solid #d97706" }} />
                      <Typography sx={{ fontSize: { xs: "0.65rem", sm: "0.7rem" }, color: "#4b5563" }}>
                        Today
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Events & Announcements Section */}
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={3}
                  sx={{
                    p: { xs: 1, sm: 2, md: 3 },
                    maxHeight: 400,
                    overflow: "auto",
                    backgroundColor: "rgba(255, 255, 255, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.4)",
                    "&::-webkit-scrollbar": {
                      width: "4px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "rgba(241, 245, 249, 0.8)",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "linear-gradient(145deg, #21309e, #6366f1)",
                    },
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      color: "#2e1065",
                      background: "linear-gradient(90deg, #6366f1, #21309e)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <CalendarToday sx={{ fontSize: { xs: 18, sm: 20, md: 22 }, color: "#6366f1" }} />
                    {format(selectedDate, "MMMM d, yyyy")}
                  </Typography>
                  <List>
                    <AnimatePresence>
                      {getSelectedDateItems().dayEvents.length > 0 && (
                        <Box mb={1.5}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontSize: { xs: "0.85rem", sm: "0.9rem" },
                              fontWeight: 600,
                              color: "#4338ca",
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              pl: 0.5,
                              mb: 0.5,
                            }}
                          >
                            <Event color="primary" fontSize="small" />
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
                                  bgcolor: "rgba(255, 255, 255, 0.8)",
                                  borderRadius: 2,
                                  border: "1px solid rgba(99, 102, 241, 0.2)",
                                  p: { xs: 1, sm: 1.5 },
                                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                                  transition: "all 0.3s ease",
                                  "&:hover": {
                                    bgcolor: "rgba(255, 255, 255, 1)",
                                    borderColor: "rgba(99, 102, 241, 0.4)",
                                    boxShadow:
                                      "0 4px 16px rgba(99, 102, 241, 0.15)",
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
                                            color: "#21309e",
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
                                            "linear-gradient(90deg, #4f46e5, #21309e)",
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
                      {getSelectedDateItems().dayAnnouncements.map((announcement) => (
                        <motion.div
                          key={announcement._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ListItem
                            sx={{
                              mb: 1,
                              bgcolor: "rgba(255, 255, 255, 0.8)",
                              border: "1px solid rgba(168, 85, 247, 0.2)",
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Announcement sx={{ color: "#21309e" }} />
                                  <Typography
                                    variant="subtitle1"
                                    sx={{
                                      color: "#6d28d9",
                                      background: "linear-gradient(90deg, #21309e, #4f46e5)",
                                      WebkitBackgroundClip: "text",
                                      WebkitTextFillColor: "transparent",
                                    }}
                                  >
                                    {announcement.title}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        </motion.div>
                      ))}
                      {getSelectedDateItems().dayEvents.length === 0 &&
                        getSelectedDateItems().dayAnnouncements.length === 0 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <ListItem
                              sx={{
                                bgcolor: "rgba(255, 255, 255, 0.7)",
                                border: "1px dashed rgba(99, 102, 241, 0.3)",
                              }}
                            >
                              <ListItemText
                                primary={<Typography sx={{ color: "#6b7280" }}>No events or announcements</Typography>}
                              />
                            </ListItem>
                          </motion.div>
                        )}
                    </AnimatePresence>
                  </List>
                </Paper>
              </Grid>

              {/* Fee Details Section */}
              <Grid item xs={12}>
                <motion.div variants={cardVariants}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: 3,
                      backgroundColor: "rgba(255, 255, 255, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.4)",
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        color: "#2e1065",
                        background: "linear-gradient(90deg, #6366f1, #21309e)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      Fee Details
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ color: "#4b5563" }}>
                        Total Fee: ₹{childData.feeDetails.totalFee}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ color: "#4b5563" }}>
                        Payment Option: {childData.feeDetails.paymentOption}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ color: "#4b5563" }}>
                        Total Paid: ₹{getFeeSummary.totalPaid}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{ color: getFeeSummary.totalPending > 0 ? "#b91c1c" : "#065f46" }}
                      >
                        Pending: ₹{getFeeSummary.totalPending}
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 2, borderColor: "#e5e7eb" }} />
                    <TableContainer sx={{ bgcolor: "transparent" }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: "#4C639B" }}>
                            <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Term</TableCell>
                            <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Amount</TableCell>
                            <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Due Date</TableCell>
                            <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Paid</TableCell>
                            <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {childData.feeDetails.terms.map((term) => (
                            <TableRow key={term._id}>
                              <TableCell sx={{ color: "#1f2937" }}>{term.termName}</TableCell>
                              <TableCell sx={{ color: "#1f2937" }}>₹{term.amount}</TableCell>
                              <TableCell sx={{ color: "#1f2937" }}>
                                {format(new Date(term.dueDate), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell sx={{ color: "#1f2937" }}>₹{term.paidAmount}</TableCell>
                              <TableCell>
                                <Chip
                                  label={term.status}
                                  size="small"
                                  sx={{
                                    bgcolor: term.status === "Paid" ? "#d1fae5" : "#fef3c7",
                                    color: term.status === "Paid" ? "#065f46" : "#b45309",
                                    borderRadius: "12px",
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {childData.feeDetails.paymentHistory.length > 0 && (
                      <>
                        <Divider sx={{ my: 2, borderColor: "#e5e7eb" }} />
                        <Typography
                          variant="h6"
                          gutterBottom
                          sx={{
                            color: "#2e1065",
                            background: "linear-gradient(90deg, #6366f1, #21309e)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          Payment History
                        </Typography>
                        <TableContainer sx={{ bgcolor: "transparent" }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: "#4C639B" }}>
                                <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Date</TableCell>
                                <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Amount</TableCell>
                                <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Method</TableCell>
                                <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Receipt #</TableCell>
                                <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {childData.feeDetails.paymentHistory.map((payment) => (
                                <TableRow key={payment._id}>
                                  <TableCell sx={{ color: "#1f2937" }}>
                                    {format(new Date(payment.paymentDate), "MMM d, yyyy")}
                                  </TableCell>
                                  <TableCell sx={{ color: "#1f2937" }}>₹{payment.amountPaid}</TableCell>
                                  <TableCell sx={{ color: "#1f2937" }}>{payment.paymentMethod}</TableCell>
                                  <TableCell sx={{ color: "#1f2937" }}>{payment.receiptNumber}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={payment.status}
                                      size="small"
                                      sx={{
                                        bgcolor:
                                          payment.status === "SUCCESS"
                                            ? "#d1fae5"
                                            : payment.status === "FAILED"
                                              ? "#fee2e2"
                                              : "#fef3c7",
                                        color:
                                          payment.status === "SUCCESS"
                                            ? "#065f46"
                                            : payment.status === "FAILED"
                                              ? "#b91c1c"
                                              : "#b45309",
                                        borderRadius: "12px",
                                      }}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </>
                    )}
                  </Paper>
                </motion.div>
              </Grid>
            </Grid>
          </motion.div>
        ) : (
          <Typography align="center" variant="h6" sx={{ color: "#6b7280" }}>
            {studentId ? "Child data not found" : "Select a child to view their dashboard"}
          </Typography>
        )}
      </Container>
    </Box>
  );
};

export default ParentDashboard;
