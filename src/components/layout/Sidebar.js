"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Nav, Dropdown } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBook,
  FaBuilding,
  FaBus,
  FaCalendarCheck,
  FaChalkboardTeacher,
  FaChartLine,
  FaClipboardList,
  FaClock,
  FaGraduationCap,
  FaBusAlt,
  FaHeartbeat,
  FaHome,
  FaMoneyBillWave,
  FaPlusCircle,
  FaUserGraduate,
  FaUsers,
  FaUserShield,
  FaUserTie,
  FaBell,
  FaUser,
  FaTasks,
  FaClipboardCheck,
  FaUserCheck,
  FaBookOpen,
  FaIdCard,
  FaFileAlt,
  FaEnvelopeOpenText,
  FaReceipt,
  FaChartBar,
  FaNotesMedical,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

const Sidebar = ({ showSidebar, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const sidebarRef = useRef(null);
  const leaveTimeoutRef = useRef(null); // Ref to store timeout for onMouseLeave

  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 768);

  const handleResize = useCallback(() => {
    setIsSmallScreen(window.innerWidth <= 768);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  // Handle clicks outside the sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isSmallScreen &&
        showSidebar &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        toggleSidebar(); // Close the sidebar
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSmallScreen, showSidebar, toggleSidebar]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  const roleId = user?.roleId;
  const studentId = localStorage.getItem("selectedChild");

  const handleItemClick = () => {
    if (isSmallScreen && showSidebar) {
      toggleSidebar(); // Close sidebar only on small screens when sidebar is open
    }
  };

  // Handle mouse enter to open sidebar
  const handleMouseEnter = () => {
    if (!isSmallScreen && !showSidebar) {
      toggleSidebar(); // Open sidebar
    }
    // Clear any existing leave timeout to prevent premature closing
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
  };

  // Handle mouse leave with a slight delay to prevent flickering
  const handleMouseLeave = () => {
    if (!isSmallScreen && showSidebar) {
      leaveTimeoutRef.current = setTimeout(() => {
        toggleSidebar(); // Close sidebar after delay
      }, 200); // 200ms delay
    }
  };

  const getMenuItems = (role) => {
    switch (role) {
      case "admin":
        return [
          { path: "/", icon: FaHome, text: "Dashboard" },
          { path: "/branches", icon: FaBuilding, text: "Branches" },
          { path: "/branches/add", icon: FaPlusCircle, text: "Add Branch" },
          { path: "/branches/stats", icon: FaChartLine, text: "Branch Stats" },
          { path: "/principals", icon: FaUserTie, text: "Principals" },
          {
            path: "/principals/add",
            icon: FaPlusCircle,
            text: "Add Principal",
          },
        ];
      case "principal":
        return [
          { path: "/", icon: FaHome, text: "Dashboard" },
          { path: "/teachers", icon: FaChalkboardTeacher, text: "Teachers" },
          { path: "/add-student", icon: FaUserGraduate, text: "Add Student" },
          { path: "/parents", icon: FaUsers, text: "Parents" },
          { path: "/library", icon: FaBook, text: "Library" },
          { path: "/bus", icon: FaBus, text: "Bus" },
          {
            path: "/teacherattendance",
            icon: FaClock,
            text: "Teacher Attendance",
          },
          { path: "/Fees", icon: FaMoneyBillWave, text: "Fees" },
          { path: "/studentscores", icon: FaBook, text: "Scores" },
          { path: "/events", icon: FaCalendarCheck, text: "Events" },
          { path: "/timetable", icon: FaClock, text: "Timetable" },
          {
            path: "/healthrecord",
            icon: FaClipboardList,
            text: "Health Records",
          },
          { path: "/subjects", icon: FaBook, text: "Subjects" },
          {
            path: "/principalNotification",
            icon: FaBell,
            text: "Notification",
          },
        ];
      case "teacher":
        return [
          { path: "/", icon: FaHome, text: "Dashboard" },
          { path: "/attendance", icon: FaClipboardCheck, text: "Attendance" },
          { path: "/teacherattendance", icon: FaUserCheck, text: "Teacher Attendance" },
          { path: "/teacherlibrary", icon: FaBookOpen, text: "Library" },
          { path: "/details", icon: FaIdCard, text: "Details" },
          { path: "/exam", icon: FaChalkboardTeacher, text: "Exam & Grades" },
          { path: "/submittedassignments", icon: FaFileAlt, text: "Sent Assignments" },
          { path: "/teacherNotification", icon: FaEnvelopeOpenText, text: "Notification" },
          { path: "/behavioral-record", icon: FaUserShield, text: "Behavioral Record" },
          {path:"/payslips",icon:FaClipboardList,text:"Payslips"},
        ];
      case "student":
        return [
          { path: "/", icon: FaHome, text: "Dashboard" },
          { path: "/profile", icon: FaUser, text: "Profile" },
          { path: "/studentlibrary", icon: FaBook, text: "Library" },
          { path: "/studentattendance", icon: FaCalendarCheck, text: "Attendance" },
          { path: "/studentassignment", icon: FaTasks, text: "Assignment" },
          { path: "/studentexamscores", icon: FaClipboardList, text: "Exam Scores" },
          { path: "/studentNotification", icon: FaBell, text: "Notification" },
          { path: "/timetable", icon: FaClock, text: "Time Table" },
        ];
      case "parent":
        return [
          { path: "/", icon: FaHome, text: "Dashboard" },
          { path: "/fees", icon: FaMoneyBillWave, text: "Fees" },
          { path: "/parentNotification", icon: FaBell, text: "Notification" },
          { path: `/attendance/${studentId}`, icon: FaClipboardCheck, text: "Attendance" },
          { path: `/profile/${roleId}`, icon: FaUser, text: "Profile" },
          { path: `/student-health-record/${studentId}`, icon: FaNotesMedical, text: "Health Record" },
          { path: `/behavioral-record/${studentId}`, icon: FaUserShield, text: "Behavioral Record" },
          { path: `/payment-history/${studentId}`, icon: FaReceipt, text: "Payment History" },
          { path: `/score-card/${studentId}`, icon: FaChartLine, text: "ScoreCard" },
          { path: "/studentprogress", icon: FaChartBar, text: "Progress" },
          { path: "/bus-route", icon: FaBus, text: "Bus Route" },
        ];
      case "driver":
        return [{ path: "/", icon: FaHome, text: "Dashboard" }];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems(user?.role);
  const isSidebarVisible = showSidebar;

  return (
    <>
      <AnimatePresence>
        {isSmallScreen && showSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sidebar-overlay"
            onClick={toggleSidebar}
            style={{ zIndex: 999 }}
          />
        )}
      </AnimatePresence>

      <motion.div
        ref={sidebarRef}
        animate={{
          width: isSidebarVisible ? (isSmallScreen ? "250px" : "280px") : "60px",
          translateX: isSmallScreen && !showSidebar ? "-100%" : "0",
        }}
        transition={{
          duration: isSidebarVisible ? 0.05 : 0.2, // Faster open (0.15s), slightly slower close (0.2s)
          ease: "easeOut", // Smooth but quick animation
        }}
        className="sidebar"
        style={{
          position: "fixed",
          top: "0",
          left: 0,
          marginTop: "0px",
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          zIndex: 1000,
          paddingLeft: "10px",
          paddingRight: "10px",
          color: "black",
          backgroundColor: "white"
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="sidebar-content" style={{ height: "100%", paddingTop: "70px" }}>
          <Nav
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "10px",
            }}
          >
            {menuItems.map((item, index) =>
              item.dropdown ? (
                <Dropdown key={item.text} style={{ marginBottom: "10px" }}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Dropdown.Toggle
                      variant="link"
                      style={{
                        color: "#000",
                        width: "100%",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        textDecoration: "none",
                        padding: "10px",
                      }}
                    >
                      <item.icon size={20} style={{ marginRight: "15px" }} />
                      {isSidebarVisible && (
                        <span style={{ flexGrow: 1 }}>{item.text}</span>
                      )}
                    </Dropdown.Toggle>
                  </motion.div>
                  {isSidebarVisible && (
                    <Dropdown.Menu>
                      {item.items.map((subItem) => (
                        <Dropdown.Item
                          key={subItem.text}
                          onClick={subItem.action}
                          style={{
                            color: "#333",
                            padding: "8px 16px",
                            cursor: "pointer",
                          }}
                        >
                          {subItem.text}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  )}
                </Dropdown>
              ) : (
                <motion.div
                  key={item.path}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  style={{ marginBottom: "10px" }}
                >
                  <Nav.Link
                    as={Link}
                    to={item.path}
                    onClick={handleItemClick}
                    className={`nav-link pt-3 ${
                      location.pathname === item.path ? "bg-warning" : ""
                    }`}
                    style={{ color: "#0000ff", display: "flex", alignItems: "center" }}
                  >
                    <item.icon size={20} style={{ marginRight: "10px" }} />
                    {isSidebarVisible && (
                      <span style={{ flexGrow: 1 }}>{item.text}</span>
                    )}
                  </Nav.Link>
                </motion.div>
              )
            )}
          </Nav>

          {isSidebarVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              style={{
                textAlign: "center",
                padding: "15px",
                color: "#0000ff",
                borderTop: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              <small style={{ display: "block" }}>Logged in as:</small>
              <span style={{ fontWeight: "600" }}>{user?.role || "Guest"}</span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;