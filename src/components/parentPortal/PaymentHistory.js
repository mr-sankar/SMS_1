import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Card,
  Table,
  Button,
  Spinner,
  Alert,
  Form,
  Row,
  Col,
  Badge,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { format } from "date-fns";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const PaymentHistory = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTerm, setFilterTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found. Please log in.");
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        };

        const paymentResponse = await axios.get(
          `${BASE_URL}/api/fees/payment-history/${studentId}`,
          config
        );

        // console.log("⭐ Payment History API Response:", paymentResponse.data);

        if (paymentResponse.data && paymentResponse.data.success) {
          const responseData = paymentResponse.data.data;
          setStudent(responseData.student);
          setPayments(responseData.paymentHistory || []);
          // console.log("⭐ Payments Set:", responseData.paymentHistory);
        } else {
          setError(paymentResponse.data.message || "Invalid payment history data");
        }
      } catch (err) {
        // console.error("Error fetching payment history:", err);
        setError(
          err.response?.data?.message || "Failed to load payment history"
        );
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchData();
    } else {
      setError("Student ID is required");
      setLoading(false);
    }
  }, [studentId]);

  const handleViewReceipt = (receiptId) => {
    navigate(`/receipt/${receiptId}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleDateRangeChange = (e, field) => {
    setDateRange({
      ...dateRange,
      [field]: e.target.value,
    });
  };

  const resetFilters = () => {
    setFilterTerm("");
    setFilterStatus("");
    setDateRange({ from: "", to: "" });
  };

  const filteredPayments = payments.filter((payment) => {
    if (filterTerm && payment.termName !== filterTerm) {
      return false;
    }
    if (filterStatus && payment.status !== filterStatus) {
      return false;
    }
    const paymentDate = new Date(payment.paymentDate);
    if (dateRange.from) {
      const fromDate = new Date(dateRange.from);
      if (paymentDate < fromDate) {
        return false;
      }
    }
    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      if (paymentDate > toDate) {
        return false;
      }
    }
    return true;
  });

  // console.log("⭐ Filtered Payments:", filteredPayments);

  const uniqueTerms = [...new Set(payments.map((payment) => payment.termName))];

  const totalPaid = filteredPayments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, payment) => sum + payment.amount, 0);

  if (loading) {
    return (
      <Container className="py-5 text-center" style={{ backgroundColor: "#e3e6eb" }}>
        <div
          className="d-flex flex-column align-items-center justify-content-center"
          style={{ minHeight: "50vh" }}
        >
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              borderRadius: "15px",
              padding: "2rem",
              boxShadow: "0 4px 16px rgba(31, 38, 135, 0.1)",
            }}
          >
            <Spinner
              animation="border"
              style={{ color: "#6366f1", width: "3rem", height: "3rem" }}
            />
            <p style={{ color: "#4b5563", marginTop: "1rem" }}>
              Loading payment history...
            </p>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5" style={{ backgroundColor: "#e3e6eb" }}>
        <div
          style={{
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
            border: "1px solid rgba(185, 28, 28, 0.3)",
            borderRadius: "10px",
            padding: "1.5rem",
            boxShadow: "0 4px 16px rgba(31, 38, 135, 0.1)",
          }}
        >
          <h4 style={{ color: "#b91c1c", marginBottom: "1rem" }}>Error</h4>
          <p style={{ color: "#b91c1c" }}>{error}</p>
          <div className="d-flex justify-content-end">
            <Button
              style={{
                borderColor: "#6366f1",
                color: "#6366f1",
                backgroundColor: "transparent",
                borderRadius: "12px",
                padding: "0.5rem 1.5rem",
              }}
              onMouseOver={(e) => {
                e.target.style.background = "linear-gradient(145deg, #6366f1, #a855f7)";
                e.target.style.color = "#fff";
                e.target.style.borderColor = "transparent";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "transparent";
                e.target.style.color = "#6366f1";
                e.target.style.borderColor = "#6366f1";
              }}
              onClick={handleBack}
            >
              Go Back
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid="lg" className="py-4" style={{ backgroundColor: "transparent" }}>
      <Card
        style={{
          backgroundColor: "transparent",
          boxShadow: "0 4px 16px rgba(31, 38, 135, 0.1)",
          borderRadius: "15px",
          border: "1px solid rgba(99, 102, 241, 0.2)",
        }}
      >
        <Card.Header
          style={{
            background: "#5D79BE",
            color: "#2e1065",
            borderRadius: "15px 15px 0 0",
            borderBottom: "1px solid rgba(99, 102, 241, 0.2)",
          }}
        >
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <h3
              style={{
                // background: "#5D79BE",
               color:"white",
                marginBottom: 0,
              }}
            >
              Payment History
            </h3>
          </div>
        </Card.Header>
        <Card.Body style={{ backgroundColor: "rgba(255, 255, 255, 0.7)" }}>
          {student && (
            <Card
              style={{
                backgroundColor: "#f0f7ff",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                borderRadius: "10px",
                marginBottom: "1.5rem",
                boxShadow: "0 4px 16px rgba(31, 38, 135, 0.1)",
              }}
            >
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h5 style={{ color: "#2e1065" }}>{student.name}</h5>
                    <p style={{ color: "#4b5563", marginBottom: 0 }}>
                      <strong style={{ color: "#2e1065" }}>Class:</strong>{" "}
                      {student.className} |{" "}
                      <strong style={{ color: "#2e1065" }}>Section:</strong>{" "}
                      {student.section}
                    </p>
                    <p style={{ color: "#4b5563" }}>
                      <strong style={{ color: "#2e1065" }}>Admission No:</strong>{" "}
                      {student.admissionNo}
                    </p>
                  </Col>
                  <Col md={6} className="text-md-end mt-3 mt-md-0">
                    <div
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                        padding: "1rem",
                        borderRadius: "10px",
                        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
                        display: "inline-block",
                      }}
                    >
                      <h6 style={{ color: "#4b5563", marginBottom: "0.5rem" }}>
                        Total Paid (Successful)
                      </h6>
                      <h4 style={{ color: "#2f855a", marginBottom: 0 }}>
                        ₹{totalPaid.toLocaleString()}
                      </h4>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          <Card
            style={{
              backgroundColor: "#f0f7ff",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: "10px",
              marginBottom: "1.5rem",
              boxShadow: "0 4px 16px rgba(31, 38, 135, 0.1)",
            }}
          >
            <Card.Header
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                borderRadius: "10px 10px 0 0",
                borderBottom: "1px solid rgba(99, 102, 241, 0.2)",
              }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <h5 style={{ marginBottom: 0 }}>
                  <Button
                    variant="link"
                    className="text-decoration-none p-0"
                    style={{ color: "#2e1065" }}
                    onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className={`bi me-2 ${
                        isFiltersCollapsed ? "bi-plus-square" : "bi-dash-square"
                      }`}
                      viewBox="0 0 16 16"
                      style={{ color: "#2e1065" }}
                    >
                      {isFiltersCollapsed ? (
                        <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                      ) : (
                        <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z" />
                      )}
                    </svg>
                    Filter Payments
                  </Button>
                </h5>
                <Badge
                  style={{
                    backgroundColor: "#1e40af",
                    color: "#fff",
                    borderRadius: "50rem",
                    padding: "0.2rem 0.2rem",
                    fontSize: "0.6rem",
                  }}
                >
                  {filteredPayments.length} of {payments.length} records
                </Badge>
              </div>
            </Card.Header>

            {!isFiltersCollapsed && (
              <Card.Body>
                <Row>
                  <Col md={6} lg={3}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{ color: "#2e1065" }}>
                        Term
                      </Form.Label>
                      <Form.Select
                        value={filterTerm}
                        onChange={(e) => setFilterTerm(e.target.value)}
                        style={{
                          backgroundColor: "#fff",
                          borderColor: "rgba(99, 102, 241, 0.2)",
                          color: "#4b5563",
                          borderRadius: "8px",
                        }}
                      >
                        <option value="">All Terms</option>
                        {uniqueTerms.map((term) => (
                          <option key={term} value={term}>
                            {term}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6} lg={3}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{ color: "#2e1065" }}>
                        Status
                      </Form.Label>
                      <Form.Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{
                          backgroundColor: "#fff",
                          borderColor: "rgba(99, 102, 241, 0.2)",
                          color: "#4b5563",
                          borderRadius: "8px",
                        }}
                      >
                        <option value="">All Statuses</option>
                        <option value="SUCCESS">Successful</option>
                        <option value="FAILED">Failed</option>
                        <option value="PENDING">Pending</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6} lg={3}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{ color: "#2e1065" }}>
                        From Date
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => handleDateRangeChange(e, "from")}
                        style={{
                          backgroundColor: "#fff",
                          borderColor: "rgba(99, 102, 241, 0.2)",
                          color: "#4b5563",
                          borderRadius: "8px",
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6} lg={3}>
                    <Form.Group className="mb-3">
                      <Form.Label style={{ color: "#2e1065" }}>
                        To Date
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => handleDateRangeChange(e, "to")}
                        style={{
                          backgroundColor: "#fff",
                          borderColor: "rgba(99, 102, 241, 0.2)",
                          color: "#4b5563",
                          borderRadius: "8px",
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-flex justify-content-end">
                  <Button
                    size="sm"
                    style={{
                      borderColor: "#6b7280",
                      color: "#6b7280",
                      backgroundColor: "transparent",
                      borderRadius: "8px",
                      padding: "0.5rem 1rem",
                      marginRight: "0.5rem",
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = "#6b7280";
                      e.target.style.color = "#fff";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = "transparent";
                      e.target.style.color = "#6b7280";
                    }}
                    onClick={resetFilters}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-x-circle me-1"
                      viewBox="0 0 16 16"
                      style={{ color: "inherit" }}
                    >
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 0 0 8 0a8 8 0 0 0 0 16z" />
                      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                    </svg>
                    Reset Filters
                  </Button>
                </div>
              </Card.Body>
            )}
          </Card>

          {filteredPayments.length === 0 ? (
            payments.length === 0 ? (
              <div
                style={{
                  backgroundColor: "#e0f2fe",
                  color: "#1e40af",
                  borderRadius: "10px",
                  padding: "1.5rem",
                  textAlign: "center",
                  boxShadow: "0 4px 16px rgba(31, 38, 135, 0.1)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  className="bi bi-info-circle mb-3"
                  viewBox="0 0 16 16"
                  style={{ color: "#1e40af" }}
                >
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 0 0 8 0a8 8 0 0 0 0 16z" />
                  <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                </svg>
                <p style={{ color: "#1e40af" }}>
                  No payment records found for this student.
                </p>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: "#e0f2fe",
                  color: "#1e40af",
                  borderRadius: "10px",
                  padding: "1.5rem",
                  textAlign: "center",
                  boxShadow: "0 4px 16px rgba(31, 38, 135, 0.1)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  className="bi bi-info-circle mb-3"
                  viewBox="0 0 16 16"
                  style={{ color: "#1e40af" }}
                >
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 0 0 8 0a8 8 0 0 0 0 16z" />
                  <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                </svg>
                <p style={{ color: "#1e40af" }}>
                  No payment records found matching the selected filters.
                </p>
                <Button
                  size="sm"
                  style={{
                    borderColor: "#6366f1",
                    color: "#6366f1",
                    backgroundColor: "transparent",
                    borderRadius: "12px",
                    padding: "0.5rem 1.5rem",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = "linear-gradient(145deg, #6366f1, #a855f7)";
                    e.target.style.color = "#fff";
                    e.target.style.borderColor = "transparent";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "transparent";
                    e.target.style.color = "#6366f1";
                    e.target.style.borderColor = "#6366f1";
                  }}
                  onClick={resetFilters}
                >
                  Clear Filters
                </Button>
              </div>
            )
          ) : (
            <div className="table-responsive">
              <Table
                hover
                style={{
                  backgroundColor: "#f0f7ff",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                  borderRadius: "10px",
                }}
              >
                <thead
                  style={{
                    backgroundColor: "#e0e7ff",
                    color: "#2e1065",
                  }}
                >
                  <tr>
                    <th style={{ color: "#2e1065" }}>Date</th>
                    <th style={{ color: "#2e1065" }}>Receipt ID</th>
                    <th style={{ color: "#2e1065" }}>Term</th>
                    <th style={{ color: "#2e1065" }}>Amount</th>
                    <th style={{ color: "#2e1065" }}>Payment Method</th>
                    <th style={{ color: "#2e1065" }}>Status</th>
                    <th style={{ color: "#2e1065" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment.receiptId}
                      style={{ backgroundColor: "rgba(255, 255, 255, 0.8)" }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor = "#e0f2fe")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.8)")
                      }
                    >
                      <td style={{ color: "#4b5563" }}>
                        {payment.paymentDate
                          ? format(new Date(payment.paymentDate), "dd MMM yyyy")
                          : "N/A"}
                      </td>
                      <td style={{ color: "#4b5563" }}>
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Tooltip>
                              {payment.orderId
                                ? `Order ID: ${payment.orderId}`
                                : "No order ID available"}
                            </Tooltip>
                          }
                        >
                          <span style={{ color: "#2e1065" }}>
                            {payment.receiptId}
                          </span>
                        </OverlayTrigger>
                      </td>
                      <td style={{ color: "#4b5563" }}>{payment.termName}</td>
                      <td style={{ color: "#4b5563" }}>
                        ₹{payment.amount.toLocaleString()}
                      </td>
                      <td style={{ color: "#4b5563" }}>
                        {payment.paymentMethod}
                      </td>
                      <td>
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Tooltip>
                              {payment.status === "FAILED" &&
                              payment.failureReason
                                ? `Reason: ${payment.failureReason}`
                                : payment.status === "SUCCESS"
                                ? "Payment successful"
                                : "Payment pending"}
                            </Tooltip>
                          }
                        >
                          <Badge
                            style={{
                              backgroundColor:
                                payment.status === "SUCCESS"
                                  ? "#2f855a"
                                  : payment.status === "FAILED"
                                  ? "#b91c1c"
                                  : "#d97706",
                              color: "#fff",
                              // padding: "0.5rem 1rem",
                              borderRadius: "50rem",
                            }}
                          >
                            {payment.status}
                          </Badge>
                        </OverlayTrigger>
                      </td>
                      <td>
                        {payment.status === "SUCCESS" ? (
                          <Button
                            size="sm"
                            style={{
                              borderColor: "#6366f1",
                              color: "#6366f1",
                              backgroundColor: "transparent",
                              borderRadius: "50rem",
                              padding: "0.5rem 1rem",
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background =
                                "linear-gradient(145deg, #6366f1, #a855f7)";
                              e.target.style.color = "#fff";
                              e.target.style.borderColor = "transparent";
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = "transparent";
                              e.target.style.color = "#6366f1";
                              e.target.style.borderColor = "#6366f1";
                            }}
                            onClick={() => handleViewReceipt(payment.receiptId)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              fill="currentColor"
                              className="bi bi-receipt me-1"
                              viewBox="0 0 16 16"
                              style={{ color: "inherit" }}
                            >
                              <path d="M1.92.506a.5.5 0 0 1 .434.14L3 1.293l.646-.647a.5.5 0 0 1 .708 0L5 1.293l.646-.647a.5.5 0 0 1 .708 0L7 1.293l.646-.647a.5.5 0 0 1 .708 0L9 1.293l.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .801.13l.5 1A.5.5 0 0 1 15 2v12a.5.5 0 0 1-.053.224l-.5 1a.5.5 0 0 1-.8.13L13 14.707l-.646.647a.5.5 0 0 1-.708 0L11 14.707l-.646.647a.5.5 0 0 1-.708 0L9 14.707l-.646.647a.5.5 0 0 1-.708 0L7 14.707l-.646.647a.5.5 0 0 1-.708 0L5 14.707l-.646.647a.5.5 0 0 1-.708 0L3 14.707l-.646.647a.5.5 0 0 1-.801-.13l-.5-1A.5.5 0 0 1 1 14V2a.5.5 0 0 1 .053-.224l.5-1a.5.5 0 0 1 .367-.27zm.217 1.338L2 2.118v11.764l.137.274.51-.51a.5.5 0 0 1 .707 0l.646.647.646-.646a.5.5 0 0 1 .708 0l.646.646.646-.646a.5.5 0 0 1 .708 0l.646.646.646-.646a.5.5 0 0 1 .708 0l.646.646.646-.646a.5.5 0 0 1 .708 0l.646.646.646-.646a.5.5 0 0 1 .708 0l.509.509.137-.274V2.118l-.137-.274-.51.51a.5.5 0 0 1-.707 0L12 1.707l-.646.647a.5.5 0 0 1-.708 0L10 1.707l-.646.647a.5.5 0 0 1-.708 0L8 1.707l-.646.647a.5.5 0 0 1-.708 0L6 1.707l-.646.647a.5.5 0 0 1-.708 0L4 1.707l-.646.647a.5.5 0 0 1-.708 0l-.509-.51z" />
                              <path d="M3 4.5a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5zm8-6a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5z" />
                            </svg>
                            Receipt
                          </Button>
                        ) : payment.status === "FAILED" ? (
                          <Badge
                            style={{
                              backgroundColor: "rgba(255, 255, 255, 0.8)",
                              color: "#fff",
                              border: "1px solid rgba(99, 102, 241, 0.2)",
                              padding: "0.5rem 1rem",
                              borderRadius: "8px",
                            }}
                          >
                            {payment.failureReason ? "Failed" : "N/A"}
                          </Badge>
                        ) : (
                          <Badge
                            style={{
                              backgroundColor: "rgba(255, 255, 255, 0.8)",
                              color: "#fff",
                              border: "1px solid rgba(99, 102, 241, 0.2)",
                              padding: "0.5rem 1rem",
                              borderRadius: "8px",
                            }}
                          >
                            Pending
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {payments.length > 0 && (
            <Card
              style={{
                backgroundColor: "#f0f7ff",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                borderRadius: "10px",
                boxShadow: "0 4px 16px rgba(31, 38, 135, 0.1)",
                marginTop: "1.5rem",
              }}
            >
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6 style={{ color: "#2e1065" }}>Payment Summary</h6>
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      <li>
                        <span style={{ color: "#4b5563" }}>
                          Total Records:
                        </span>{" "}
                        <strong style={{ color: "#2e1065" }}>
                          {filteredPayments.length} of {payments.length}
                        </strong>
                      </li>
                      <li>
                        <span style={{ color: "#4b5563" }}>
                          Successful Payments:
                        </span>{" "}
                        <strong style={{ color: "#2e1065" }}>
                          {
                            filteredPayments.filter(
                              (p) => p.status === "SUCCESS"
                            ).length
                          }
                        </strong>
                      </li>
                      <li>
                        <span style={{ color: "#4b5563" }}>
                          Failed Payments:
                        </span>{" "}
                        <strong style={{ color: "#2e1065" }}>
                          {
                            filteredPayments.filter(
                              (p) => p.status === "FAILED"
                            ).length
                          }
                        </strong>
                      </li>
                    </ul>
                  </Col>
                  <Col md={6} className="text-md-end mt-3 mt-md-0">
                    <h5 style={{ color: "#4b5563" }}>Total Amount Paid</h5>
                    <h3 style={{ color: "#2f855a" }}>
                      ₹{totalPaid.toLocaleString()}
                    </h3>
                    <p style={{ color: "#4b5563", fontSize: "0.875rem" }}>
                      (Successful payments only)
                    </p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PaymentHistory;