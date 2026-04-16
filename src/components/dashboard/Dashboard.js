'use client';

import {
  Announcement,
  CalendarToday,
  DirectionsBus,
  ErrorOutline,
  Event,
  Group,
  Refresh,
  School,
} from '@mui/icons-material';
import {
  Alert,
  Badge,
  Box,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import {
  DateCalendar,
  LocalizationProvider,
  PickersDay,
} from '@mui/x-date-pickers';
import DOMPurify from 'dompurify';
import { useNavigate } from 'react-router-dom'; // For React Router navigation

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import {
  format,
  getMonth,
  getYear,
  isSameDay,
  isSameMonth,
  isValid,
  parseISO,
  startOfMonth,
} from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import './Dashboard.css';

// Mock notices data (replace with API if available)
const notices = [
  {
    title: 'School annual sports day',
    date: '20 July 2023',
    views: '20k',
    img: '/path/to/sports.jpg',
  },
  {
    title: 'Annual Function celebration 2023-24',
    date: '05 July 2023',
    views: '15k',
    img: '/path/to/function.jpg',
  },
  {
    title: 'Mid term examination routine published',
    date: '15 June 2023',
    views: '22k',
    img: '/path/to/exam.jpg',
  },
  {
    title: 'Inter school annual painting competition',
    date: '18 May 2023',
    views: '18k',
    img: '/path/to/painting.jpg',
  },
];
const COLORS = ['#3b82f6', '#10b981'];
// Custom ServerDay component (unchanged)
function ServerDay(props) {
  const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;
  const isHighlighted =
    !outsideCurrentMonth &&
    highlightedDays.some((date) => isValid(date) && isSameDay(date, day));

  return (
    <Badge
      key={props.day.toString()}
      overlap='circular'
      badgeContent={isHighlighted ? '✨' : undefined}
      color='primary'
      sx={{
        '& .MuiBadge-badge': {
          bottom: '5px',
        },
      }}
    >
      <PickersDay
        {...other}
        outsideCurrentMonth={outsideCurrentMonth}
        day={day}
      />
    </Badge>
  );
}

const BASE_URL =
  process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const Dashboard = () => {
  const navigate = useNavigate(); // For navigation

  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [loading, setLoading] = useState({
    main: true,
    students: true,
    teachers: true,
    parents: true,
    earnings: true,
  });
  const [error, setError] = useState(null);
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);

  const [busCount, setBusCount] = useState(0);
  const [buses, setBuses] = useState([]); // Store bus data for navigation

  const [earnings, setEarnings] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationCount, setNotificationCount] = useState(5);
  const [selectedWeek, setSelectedWeek] = useState('thisWeek');
  const [selectedClass, setSelectedClass] = useState('Class 10');
  const [refreshKey, setRefreshKey] = useState(0);

  const classOptions = [
    'Nursery',
    'LKG',
    'UKG',
    'Class 1',
    'Class 2',
    'Class 3',
    'Class 4',
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10',
  ];

  const genderData = useMemo(() => {
    const boysPercentage = 0.6;
    const girlsPercentage = 1 - boysPercentage;
    const boys = Math.floor(studentCount * boysPercentage);
    const girls = studentCount - boys;
    return [
      { name: 'Boys', value: boys, percentage: boysPercentage * 100 },
      { name: 'Girls', value: girls, percentage: girlsPercentage * 100 },
    ];
  }, [studentCount]);

  const getAttendanceData = () => {
    const thisWeekData = [
      { name: 'Mon', present: 300, absent: 50 },
      { name: 'Tue', present: 290, absent: 60 },
      { name: 'Wed', present: 280, absent: 70 },
      { name: 'Thu', present: 300, absent: 50 },
      { name: 'Fri', present: 310, absent: 40 },
      { name: 'Sat', present: 0, absent: 0 },
    ];
    const pastWeekData = [
      { name: 'Mon', present: 295, absent: 55 },
      { name: 'Tue', present: 285, absent: 65 },
      { name: 'Wed', present: 275, absent: 75 },
      { name: 'Thu', present: 305, absent: 45 },
      { name: 'Fri', present: 315, absent: 35 },
      { name: 'Sat', present: 0, absent: 0 },
    ];
    return selectedWeek === 'thisWeek' ? thisWeekData : pastWeekData;
  };

  // Fetch methods with authentication
  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found, please log in');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchEvents = useCallback(async () => {
    try {
      const config = getAuthConfig();
      const response = await axios.get(`${BASE_URL}/api/events`, config);
      return response.data.map((event) => ({
        ...event,
        date: parseISO(event.date),
      }));
    } catch (error) {
      // console.error('Error fetching events:', error);
      throw error.response?.data?.message || 'Failed to fetch events';
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const config = getAuthConfig();
      const response = await axios.get(`${BASE_URL}/api/announcements`, config);
      return response.data.map((announcement) => ({
        ...announcement,
        announcementDate: parseISO(announcement.announcementDate),
      }));
    } catch (error) {
      // console.error('Error fetching announcements:', error);
      throw error.response?.data?.message || 'Failed to fetch announcements';
    }
  }, []);

  const fetchStudentCount = useCallback(async () => {
    try {
      const config = getAuthConfig();
      const response = await axios.get(`${BASE_URL}/api/student-count`, config);
      return response.data.totalStudents || 0;
    } catch (error) {
      // console.error('Error fetching student count:', error);
      throw error.response?.data?.message || 'Failed to fetch student count';
    }
  }, []);

  const fetchTeacherCount = useCallback(async () => {
    try {
      const config = getAuthConfig();
      const response = await axios.get(`${BASE_URL}/api/teacher-count`, config);
      return response.data.totalTeachers || 0;
    } catch (error) {
      // console.error('Error fetching teacher count:', error);
      throw error.response?.data?.message || 'Failed to fetch teacher count';
    }
  }, []);

  const fetchBusCount = useCallback(async () => {
    try {
      const config = getAuthConfig();
      const response = await axios.get(`${BASE_URL}/driver-profiles`, config);
      setBuses(response.data); // Store bus data
      return response.data.length || 0;
    } catch (error) {
      // console.error('Error fetching bus count:', error);
      throw error.response?.data?.message || 'Failed to fetch bus count';
    }
  }, []);

  const fetchEarnings = useCallback(async () => {
    try {
      const config = getAuthConfig();
      const response = await axios.get(`${BASE_URL}/api/earnings`, config);
      return response.data.totalEarnings || 0;
    } catch (error) {
      // console.error('Error fetching earnings:', error);
      throw error.response?.data?.message || 'Failed to fetch earnings';
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, main: true }));
    setError(null);
    try {
      const [eventsData, announcementsData] = await Promise.all([
        fetchEvents(),
        fetchAnnouncements(),
      ]);
      setEvents(eventsData);
      setAnnouncements(announcementsData);
    } catch (error) {
      setError(
        'Failed to load events and announcements. Please try again later.'
      );
    } finally {
      setLoading((prev) => ({ ...prev, main: false }));
    }
  }, [fetchEvents, fetchAnnouncements]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [fetchData, refreshKey]);

  useEffect(() => {
    const loadStudentCount = async () => {
      setLoading((prev) => ({ ...prev, students: true }));
      try {
        const count = await fetchStudentCount();
        setStudentCount(count);
      } catch (error) {
        setStudentCount(0);
      } finally {
        setLoading((prev) => ({ ...prev, students: false }));
      }
    };
    loadStudentCount();
  }, [fetchStudentCount]);

  useEffect(() => {
    const loadTeacherCount = async () => {
      setLoading((prev) => ({ ...prev, teachers: true }));
      try {
        const count = await fetchTeacherCount();
        setTeacherCount(count);
      } catch (error) {
        setTeacherCount(0);
      } finally {
        setLoading((prev) => ({ ...prev, teachers: false }));
      }
    };
    loadTeacherCount();
  }, [fetchTeacherCount]);

  useEffect(() => {
    const loadBusCount = async () => {
      setLoading((prev) => ({ ...prev, buses: true }));
      try {
        const count = await fetchBusCount();
        setBusCount(count);
      } catch (error) {
        setBusCount(0);
      } finally {
        setLoading((prev) => ({ ...prev, buses: false }));
      }
    };
    loadBusCount();
  }, [fetchBusCount]);

  const handleBusClick = () => {
    navigate('/bus-details', { state: { buses } }); // Navigate to BusDetails with bus data
  };

  useEffect(() => {
    const loadEarnings = async () => {
      setLoading((prev) => ({ ...prev, earnings: true }));
      try {
        const earnings = await fetchEarnings();
        setEarnings(earnings);
      } catch (error) {
        setEarnings(0);
      } finally {
        setLoading((prev) => ({ ...prev, earnings: false }));
      }
    };
    loadEarnings();
  }, [fetchEarnings]);

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

  const filteredNotices = notices.filter((notice) =>
    notice.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleWeekChange = (event) => setSelectedWeek(event.target.value);
  const handleClassChange = (event) => setSelectedClass(event.target.value);
  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  if (loading.main) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography color='text.secondary'>Loading dashboard...</Typography>
      </Box>
    );
  }

  // Rest of the JSX remains unchanged (rendering logic)
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'transparent', // Bright orange-tinted background
        flexDirection: 'column',
        p: { xs: 1, sm: 2, md: 3 },
      }}
    >
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: { xs: 2, sm: 3 },
          }}
        >
          <h2 className='admin-title'>Principal Dashboard</h2>
          <IconButton onClick={handleRefresh} sx={{ color: '#fff' }}>
            <Refresh />
          </IconButton>
        </Box>

        <Grid
          container
          spacing={{ xs: 2, sm: 3 }}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: { xs: '0.5rem', sm: 'clamp(0.5rem, 2vw, 1rem)' },
            flexWrap: { xs: 'wrap', md: 'nowrap' },
            mb: { xs: '1rem', sm: 'clamp(1rem, 4vw, 2.5rem)' },
            maxWidth: '100%',
            mx: 'auto',
          }}
        >
          {[
            {
              loading: loading.students,
              icon: <School />,
              label: 'Total Students',
              count: studentCount,
            },
            {
              loading: loading.teachers,
              icon: <Group />,
              label: 'Total Teachers',
              count: teacherCount,
            },
            {
              loading: loading.buses,
              icon: <DirectionsBus />,
              label: 'Total Buses',
              count: busCount,
              onClick: handleBusClick,
            },
          ].map((item, index) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={index}
              sx={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Paper
                sx={{
                  width: {
                    xs: '80px',
                    sm: 'clamp(80px, 25vw, 160px)',
                    md: '160px',
                  },
                  height: {
                    xs: '80px',
                    sm: 'clamp(80px, 25vw, 160px)',
                    md: '160px',
                  },
                  borderRadius: '50%',
                  p: { xs: '0.5rem', sm: 'clamp(0.5rem, 2vw, 1rem)' },
                  textAlign: 'center',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                  transition: 'transform 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  '&:hover': { transform: 'scale(1.05)' },
                  backgroundColor:
                    item.label === 'Total Students'
                      ? '#ffffff'
                      : item.label === 'Total Teachers'
                        ? '#7091e5'
                        : item.label === 'Total Buses'
                          ? '#ffffff'
                          : '#ffffff',
                  color:
                    item.label === 'Total Teachers' ? '#ffffff' : '#1a1a1a',
                }}
                onClick={item.onClick}
              >
                {item.loading ? (
                  <CircularProgress size={20} sx={{ color: '#1f283a' }} />
                ) : (
                  <>
                    {React.cloneElement(item.icon, {
                      sx: {
                        fontSize: {
                          xs: '0.875rem',
                          sm: 'clamp(0.875rem, 3vw, 1.5rem)',
                        },
                        mb: {
                          xs: '0.25rem',
                          sm: 'clamp(0.25rem, 1vw, 0.5rem)',
                        },
                        color:
                          item.label === 'Total Teachers'
                            ? '#1f283a'
                            : '#1f283a',
                      },
                    })}
                    <Typography
                      component='div'
                      sx={{
                        fontSize: {
                          xs: '0.625rem',
                          sm: 'clamp(0.625rem, 2vw, 1rem)',
                        },
                        mb: {
                          xs: '0.125rem',
                          sm: 'clamp(0.125rem, 1vw, 0.25rem)',
                        },
                        overflowWrap: 'break-word',
                      }}
                    >
                      {item.label}
                    </Typography>
                    <Typography
                      component='div'
                      sx={{
                        fontSize: {
                          xs: '0.75rem',
                          sm: 'clamp(0.75rem, 2.5vw, 1.3rem)',
                        },
                        fontWeight: 'bold',
                      }}
                    >
                      {item.count}
                    </Typography>
                  </>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <Paper
                sx={{
                  p: { xs: 2, sm: 3 },
                  borderRadius: '16px',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                    transform: 'translateY(-4px)',
                  },
                  position: 'relative',
                  overflow: 'hidden',
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    
                  },
                }}
              >
                <Typography
                  variant='h6'
                  sx={{
                    mb: { xs: 2, sm: 3 },
                    color: '#1a1a1a',
                    fontWeight: 700,
                    fontSize: { xs: '1.1rem', sm: '1.5rem' },
                    letterSpacing: '0.3px',
                  }}
                >
                  Total Students by Gender
                </Typography>
                <ResponsiveContainer width='100%' height={220}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      dataKey='value'
                      nameKey='name'
                      cx='50%'
                      cy='50%'
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      labelLine={{ stroke: '#0000ff', strokeWidth: 1 }}
                    >
                      {genderData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index % 2 === 0 ? '#4c639b' : '#212121'}
                          style={{ transition: 'all 0.3s ease' }}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        border: 'none',
                        padding: '8px 12px',
                        fontSize: '0.9rem',
                        color: '#1a1a1a',
                      }}
                      formatter={(value, name) => [
                        value,
                        `${name} (${genderData
                          .find((d) => d.name === name)
                          .percentage.toFixed(0)}%)`,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <Typography
                  variant='h5'
                  sx={{
                    textAlign: 'center',
                    mt: { xs: 2, sm: 3 },
                    color: '#1a1a1a',
                    fontWeight: 700,
                    fontSize: { xs: '1.25rem', sm: '1.75rem' },
                  }}
                >
                  {studentCount}
                </Typography>
                <Typography
                  sx={{
                    textAlign: 'center',
                    color: '#1a1a1a',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    mt: 1,
                    fontWeight: 500,
                  }}
                >
                  Boys: {genderData[0]?.value} (
                  {genderData[0]?.percentage.toFixed(0)}%) | Girls:{' '}
                  {genderData[1]?.value} ({genderData[1]?.percentage.toFixed(0)}
                  %)
                </Typography>
              </Paper>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 3 },
                borderRadius: '20px',
                width: '100%',
                maxWidth: { xs: '100%', sm: '400px', md: '450px', lg: '500px' },
                mx: 'auto',
                boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
                overflow: 'hidden',
                position: 'relative',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 16px 32px rgba(0, 0, 0, 0.2)',
                },
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(to right, #4c639b, #212121)',
                },
              }}
            >
              <Typography
                variant='h6'
                sx={{
                  mb: { xs: 1, sm: 2 },
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
                  fontWeight: 600,
                  color: '#1a1a1a',
                  letterSpacing: '0.3px',
                }}
              >
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <CalendarToday
                    sx={{
                      mr: 1,
                      fontSize: { xs: 20, sm: 24 },
                      color: '#4c639b',
                    }}
                  />
                </motion.div>
                Calendar - {format(currentMonth, 'MMMM yyyy')}
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
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
                </motion.div>
              </LocalizationProvider>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 3 },
                  maxHeight: { xs: 300, sm: 400 },
                  overflow: 'auto',
                  borderRadius: '16px',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                    transform: 'translateY(-4px)',
                  },
                  position: 'relative',
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(to right, #4c639b, #212121)',
                  },
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#4c639b',
                    borderRadius: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#fff3e0',
                  },
                }}
              >
                <Typography
                  component='div'
                  gutterBottom
                  sx={{
                    fontSize: { xs: '1.1rem', sm: '1.5rem' },
                    fontWeight: 700,
                    color: '#1a1a1a',
                    letterSpacing: '0.3px',
                  }}
                >
                  {format(selectedDate, 'MMMM d, yyyy')} - Events &
                  Announcements
                </Typography>
                <List>
                  <AnimatePresence mode='wait'>
                    {getSelectedDateItems().dayEvents.map((event) => (
                      <motion.div
                        key={event._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ListItem
                          sx={{
                            mb: 1.5,
                            bgcolor: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: 'rgba(0, 0, 0, 0.1)',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              bgcolor: 'rgba(255, 98, 0, 0.05)',
                              transform: 'translateX(8px)',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            },
                            p: { xs: 1.5, sm: 2 },
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.5,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <motion.div
                                  whileHover={{ scale: 1.2 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Event
                                    sx={{
                                      fontSize: { xs: 20, sm: 26 },
                                      color: '#4c639b',
                                    }}
                                  />
                                </motion.div>
                                <Typography
                                  variant='subtitle1'
                                  sx={{
                                    fontSize: { xs: '0.9rem', sm: '1.1rem' },
                                    fontWeight: 600,
                                    color: '#1a1a1a',
                                  }}
                                >
                                  {event.name}
                                </Typography>
                                <Chip
                                  label={event.type}
                                  size='small'
                                  sx={{
                                    bgcolor: '#4c639b',
                                    color: '#ffffff',
                                    fontWeight: 500,
                                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                    '&:hover': { bgcolor: '#e65100' },
                                  }}
                                />
                              </Box>
                            }
                            secondary={
                              event.img && (
                                <Typography component='div' sx={{ mt: 1.5 }}>
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
                    {getSelectedDateItems().dayAnnouncements.map(
                      (announcement) => (
                        <motion.div
                          key={announcement._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ListItem
                            sx={{
                              mb: 1.5,
                              bgcolor: '#ffffff',
                              borderRadius: '12px',
                              border: '1px solid',
                              borderColor: 'rgba(0, 0, 0, 0.1)',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                bgcolor: 'rgba(255, 98, 0, 0.05)',
                                transform: 'translateX(8px)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                              },
                              p: { xs: 1.5, sm: 2 },
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <motion.div
                                    whileHover={{ scale: 1.2 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Announcement
                                      sx={{
                                        fontSize: { xs: 20, sm: 26 },
                                        color: '#4c639b',
                                      }}
                                    />
                                  </motion.div>
                                  <Typography
                                    variant='subtitle1'
                                    sx={{
                                      fontSize: { xs: '0.9rem', sm: '1.1rem' },
                                      fontWeight: 600,
                                      color: '#1a1a1a',
                                    }}
                                  >
                                    {announcement.title}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Typography
                                  component='div'
                                  dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(
                                      announcement.message
                                    ),
                                  }}
                                  sx={{
                                    fontSize: { xs: '0.8rem', sm: '0.95rem' },
                                    color: '#1a1a1a',
                                    mt: 0.5,
                                    lineHeight: 1.5,
                                  }}
                                />
                              }
                            />
                          </ListItem>
                        </motion.div>
                      )
                    )}
                    {getSelectedDateItems().dayEvents.length === 0 &&
                      getSelectedDateItems().dayAnnouncements.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ListItem>
                            <ListItemText
                              primary='No events or announcements for this date'
                              sx={{
                                color: '#1a1a1a',
                                fontSize: { xs: '0.9rem', sm: '1rem' },
                                textAlign: 'center',
                                fontWeight: 500,
                              }}
                            />
                          </ListItem>
                        </motion.div>
                      )}
                  </AnimatePresence>
                </List>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert
                severity='error'
                sx={{
                  mb: { xs: 2, sm: 3 },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  bgcolor: '#ffe0b2',
                  color: '#1a1a1a',
                }}
                action={
                  <IconButton
                    color='inherit'
                    size='small'
                    onClick={handleRefresh}
                  >
                    <ErrorOutline sx={{ color: '#4c639b' }} />
                  </IconButton>
                }
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(error),
                  }}
                />
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default Dashboard;
