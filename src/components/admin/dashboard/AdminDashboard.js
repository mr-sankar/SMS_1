import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import "./AdminDashboard.css";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// Define BASE_URL based on environment
const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    branches: 0,
    principals: 0,
    teachers: 0,
    students: 0,
    parents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found in localStorage");
        const res = await axios.get(`${BASE_URL}/api/branches/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const totalStats = res.data.reduce(
          (acc, branch) => ({
            branches: acc.branches + 1,
            principals: acc.principals + branch.counts.principals,
            teachers: acc.teachers + branch.counts.teachers,
            students: acc.students + branch.counts.students,
            parents: acc.parents + branch.counts.parents,
          }),
          { branches: 0, principals: 0, teachers: 0, students: 0, parents: 0 }
        );
        setStats(totalStats);
        setLoading(false);
      } catch (err) {
        // console.error("Fetch error:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Error fetching stats");
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  // Pie Chart Data
  const pieChartData = {
    labels: ["Teachers", "Students", "Parents"],
    datasets: [
      {
        data: [stats.teachers, stats.students, stats.parents],
        backgroundColor: ["#FF5733", "#4CAF50", "#FFC107"],
        hoverBackgroundColor: ["#FF8C1A", "#66BB6A", "#FFEB3B"],
      },
    ],
  };

  // Bar Chart Data
  const barChartData = {
    labels: ["Branches", "Principals", "Teachers", "Students", "Parents"],
    datasets: [
      {
        label: "Total",
        data: [stats.branches, stats.principals, stats.teachers, stats.students, stats.parents],
        backgroundColor: "#4C639B",
        borderColor: "rgb(107, 7, 131)",
        borderWidth: 1,
      },
    ],
  };

  // Chart Options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="admin-container">
      <h2 className="admin-title">Admin Dashboard</h2>

      <div className="admin-buttons">
        <button
          className="admin-btn admin-btn-blue"
          onClick={() => navigate("/branches/add")}
        >
          Add New Branch
        </button>
        <button
          className="admin-btn admin-btn-green"
          onClick={() => navigate("/principals/add")}
        >
          Add New Principal
        </button>
      </div>

      {/* Stats Cards */}
      <div className="admin-circular-stats">
        <div className="admin-card-circle admin-card-blue">
          <i className="fas fa-school admin-icon"></i>
          <h3>Total Branches</h3>
          <p>{stats.branches}</p>
        </div>
        <div className="admin-card-circle admin-card-green">
          <i className="fas fa-user-tie admin-icon"></i>
          <h3>Total Principals</h3>
          <p>{stats.principals}</p>
        </div>
        <div className="admin-card-circle admin-card-yellow">
          <i className="fas fa-chalkboard-teacher admin-icon"></i>
          <h3>Total Teachers</h3>
          <p>{stats.teachers}</p>
        </div>
        <div className="admin-card-circle admin-card-purple">
          <i className="fas fa-user-graduate admin-icon"></i>
          <h3>Total Students</h3>
          <p>{stats.students}</p>
        </div>
        <div className="admin-card-circle admin-card-pink">
          <i className="fas fa-users admin-icon"></i>
          <h3>Total Parents</h3>
          <p>{stats.parents}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-container">
        <div className="chart-card">
          <h3>Entity Distribution</h3>
          <div className="chart-container">
            <Pie data={pieChartData} options={chartOptions} />
          </div>
        </div>
        <div className="chart-card">
          <h3>Entity Comparison</h3>
          <div className="chart-container">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="admin-grid">
        <div
          className="admin-card1 admin-card-blue1"
          onClick={() => navigate("/branches")}
        >
          <i className="fas fa-building admin-icon"></i>
          <h3>Manage Branches</h3>
          <p>View/Edit Branches</p>
        </div>
        <div
          className="admin-card1 admin-card-green1"
          onClick={() => navigate("/principals")}
        >
          <i className="fas fa-user-shield admin-icon"></i>
          <h3>Manage Principals</h3>
          <p>View/Edit Principals</p>
        </div>
        <div
          className="admin-card1 admin-card-purple1"
          onClick={() => navigate("/branches/stats")}
        >
          <i className="fas fa-chart-bar admin-icon"></i>
          <h3>View Detailed Stats</h3>
          <p>Analyze Statistics</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;