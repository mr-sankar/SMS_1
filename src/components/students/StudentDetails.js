import 'animate.css';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Nav,
  Row,
  Spinner,
  Tab,
  Table,
} from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import './StudentDetails.css';

const BASE_URL =
  process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    toast.error('Please log in to access this feature');
    throw new Error('No token found');
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

const StudentDetailsPage = ({ role = 'parent' }) => {
  const { id, childId } = useParams();
  const studentId = id || childId;
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [healthRecord, setHealthRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudentDetails = async () => {
      if (!studentId || studentId === 'undefined') {
        setError('Invalid student ID');
        setLoading(false);
        return;
      }

      try {
        const config = getAuthConfig();
        const studentResponse = await axios.get(
          `${BASE_URL}/api/students/${studentId}`,
          config
        );
        const studentData = studentResponse.data.student || studentResponse.data;
        setStudent(studentData);

        if (studentData.healthRecord) {
          const healthResponse = await axios.get(
            `${BASE_URL}/api/health-records/${studentData.healthRecord}`,
            config
          );
          setHealthRecord(healthResponse.data);
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          toast.error('Session expired or unauthorized. Please log in again.');
          navigate('/login');
        } else if (err.response?.status === 403) {
          setError('Access denied: You do not have permission to view this student.');
          toast.error('Access denied');
        } else {
          setError(err.response?.data?.message || 'Error fetching student details');
          toast.error('Failed to load student details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [studentId, navigate, role]);

  const handlePrint = () => {
    const printContent = document.getElementById('id-card-content').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Student ID Card</title>
          <style>
            .id-card { 
              width: 100%; 
              max-width: 280px; 
              background: linear-gradient(135deg, #BAC8D1, #90AAEE, #BAC8D1);
              border: 2px solid #7091E6; 
              border-radius: 10px; 
              padding: 10px; 
              box-shadow: 0 2px 8px rgba(31, 38, 135, 0.1);
              margin: 10px auto;
              font-family: Arial, sans-serif;
              text-align: center;
            }
            .id-card img { 
              width: 100px; 
              height: 100px; 
              border-radius: 50%; 
              border: 2px solid #7091E6;
              margin-bottom: 0.75rem; 
            }
            .id-card h4 { 
              margin: 0.5rem 0; 
              color: #1E3A8A; 
              font-size: 1.25rem; 
            }
            .id-card p { 
              margin: 0.25rem 0; 
              color: #6B7280; 
              font-size: 0.9rem; 
            }
            @media (max-width: 320px) {
              .id-card { 
                width: 100%; 
                margin: 5px auto; 
                padding: 8px; 
              }
              .id-card img { 
                width: 80px; 
                height: 80px; 
              }
            }
            @media (min-width: 321px) and (max-width: 480px) {
              .id-card { 
                width: 90%; 
                margin: 8px auto; 
                padding: 10px; 
              }
              .id-card img { 
                width: 90px; 
                height: 90px; 
              }
            }
            @media print {
              .id-card { 
                box-shadow: none; 
                margin: 0; 
              }
            }
          </style>
        </head>
        <body>
          <div class="id-card">${printContent}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <Container className="student-details-container text-center mt-4">
        <div className="student-loading-container">
          <Spinner animation="border" className="text-primary" />
          <p className="student-text-muted mt-2">Loading student details...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="student-details-container text-center mt-4">
        <Alert variant="danger" className="student-error-alert">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!student) {
    return (
      <Container className="student-details-container text-center mt-4">
        <Alert variant="warning" className="student-error-alert">
          No student data found
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="student-details-container py-3">
      <Card className="student-card shadow-sm animate__animated animate__fadeIn">
        <Card.Body className="p-3">
          <Row className="student-row-align-center mb-3">
            <Col xs={12} sm={8} md={12} className='text-center'>
              <h2 className="student-text-secondary fw-bold mb-1 text-center">{student.name}</h2>
              <p className="student-text-secondary  mb-1">
                {student.className} - {student.section}
              </p>
              <p className="student-text-secondary  mb-0">{student.email}</p>
            </Col>
            {role === 'admin' && (
              <Col xs={12} sm={4} md={3} className="student-text-end mt-2 mt-sm-0">
                <Button className="student-btn-success">Edit Student</Button>
              </Col>
            )}
          </Row>

          <Tab.Container id="student-tabs" defaultActiveKey="personalInfo">
            <Nav variant="tabs" className="student-nav-tabs mb-2">
              <Nav.Item>
                <Nav.Link eventKey="personalInfo">Personal Info</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="fees">Fee Details</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="additionalInfo">Additional Info</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="printIdCard">Print ID Card</Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              {/* Personal Information */}
              <Tab.Pane eventKey="personalInfo" className="fade">
                <Row>
                  <Col xs={12} md={6} className="mb-3">
                    <Card className="student-card p-3 shadow-sm">
                      <h5 className="student-text-secondary fw-semibold">Personal Details</h5>
                      <p className="student-text-muted">
                        <strong className="student-text-secondary">Admission No:</strong>{' '}
                        {student.admissionNo}
                      </p>
                      <p className="student-text-muted">
                        <strong className="student-text-secondary">Roll Number:</strong>{' '}
                        {student.rollNumber}
                      </p>
                      <p className="student-text-muted">
                        <strong className="student-text-secondary">Name:</strong>{' '}
                        {student.name}
                      </p>
                      <p className="student-text-muted">
                        <strong className="student-text-secondary">Date of Birth:</strong>{' '}
                        {student.dateOfBirth
                          ? new Date(student.dateOfBirth).toLocaleDateString()
                          : 'N/A'}
                      </p>
                      <p className="student-text-muted">
                        <strong className="student-text-secondary">Gender:</strong>{' '}
                        {student.gender}
                      </p>
                      <p className="student-text-muted">
                        <strong className="student-text-secondary">Class:</strong>{' '}
                        {student.className}
                      </p>
                      <p className="student-text-muted">
                        <strong className="student-text-secondary">Section:</strong>{' '}
                        {student.section}
                      </p>
                      <p className="student-text-muted">
                        <strong className="student-text-secondary">Phone:</strong>{' '}
                        {student.phone}
                      </p>
                      <p className="student-text-muted">
                        <strong className="student-text-secondary">Email:</strong>{' '}
                        {student.email}
                      </p>
                      <p className="student-text-muted">
                        <strong className="student-text-secondary">Address:</strong>{' '}
                        {student.address
                          ? `${student.address.street}, ${student.address.city}, 
                             ${student.address.state}, ${student.address.zipCode}, 
                             ${student.address.country}`
                          : 'N/A'}
                      </p>
                    </Card>
                  </Col>
                  <Col xs={12} md={6} className="mb-3">
                    {student.emergencyContact && (
                      <Card className="student-card p-3 shadow-sm mb-3">
                        <h5 className="student-text-secondary fw-semibold">
                          Emergency Contact
                        </h5>
                        <p className="student-text-muted">
                          <strong className="student-text-secondary">Name:</strong>{' '}
                          {student.emergencyContact.name}
                        </p>
                        <p className="student-text-muted">
                          <strong className="student-text-secondary">Relation:</strong>{' '}
                          {student.emergencyContact.relation}
                        </p>
                        <p className="student-text-muted">
                          <strong className="student-text-secondary">Phone:</strong>{' '}
                          {student.emergencyContact.phone}
                        </p>
                      </Card>
                    )}
                    {student.parents?.length > 0 && (
                      <Card className="student-card p-3 shadow-sm">
                        <h5 className="student-text-secondary fw-semibold">
                          Parents Information
                        </h5>
                        {student.parents.map((parent, index) => (
                          <p key={index} className="student-text-muted">
                            <strong className="student-text-secondary">
                              Parent {index + 1}:
                            </strong>{' '}
                            {typeof parent === 'object' ? parent.name : parent}
                          </p>
                        ))}
                      </Card>
                    )}
                  </Col>
                </Row>

                {healthRecord && (
                  <Card className="student-card p-3 mt-3 shadow-sm">
                    <h5 className="student-text-secondary fw-semibold">Health Record</h5>
                    <Row>
                      <Col xs={12} sm={6}>
                        <p className="student-text-muted">
                          <strong className="student-text-secondary">Blood Group:</strong>{' '}
                          {healthRecord.bloodGroup || 'N/A'}
                        </p>
                        <p className="student-text-muted">
                          <strong className="student-text-secondary">Height:</strong>{' '}
                          {healthRecord.height
                            ? `${healthRecord.height.value} ${healthRecord.height.unit}`
                            : 'N/A'}
                        </p>
                        <p className="student-text-muted">
                          <strong className="student-text-secondary">Weight:</strong>{' '}
                          {healthRecord.weight
                            ? `${healthRecord.weight.value} ${healthRecord.weight.unit}`
                            : 'N/A'}
                        </p>
                        <p className="student-text-muted">
                          <strong className="student-text-secondary">Allergies:</strong>{' '}
                          {healthRecord.allergies?.length
                            ? healthRecord.allergies.join(', ')
                            : 'None'}
                        </p>
                        <p className="student-text-muted">
                          <strong className="student-text-secondary">
                            Emergency Notes:
                          </strong>{' '}
                          {healthRecord.emergencyNotes || 'None'}
                        </p>
                      </Col>
                      <Col xs={12} sm={6}>
                        {healthRecord.lastCheckup && (
                          <p className="student-text-muted">
                            <strong className="student-text-secondary">
                              Last Checkup Date:
                            </strong>{' '}
                            {new Date(healthRecord.lastCheckup.date).toLocaleDateString()}
                          </p>
                        )}
                      </Col>
                    </Row>

                    {healthRecord.chronicConditions?.length > 0 && (
                      <div className="mt-3">
                        <h6 className="student-text-secondary">Chronic Conditions</h6>
                        <div className="table-responsive">
                          <Table bordered hover className="student-table-custom">
                            <thead>
                              <tr>
                                <th>Condition</th>
                                <th>Diagnosed Date</th>
                                <th>Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {healthRecord.chronicConditions.map((condition, index) => (
                                <tr key={index}>
                                  <td>{condition.condition}</td>
                                  <td>
                                    {condition.diagnosedDate
                                      ? new Date(condition.diagnosedDate).toLocaleDateString()
                                      : 'N/A'}
                                  </td>
                                  <td>{condition.notes || 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </Card>
                )}
              </Tab.Pane>

              {/* Fee Details */}
              <Tab.Pane eventKey="fees" className="fade">
                <Card className="student-card p-3 shadow-sm">
                  <h4 className="student-text-secondary fw-bold mb-3">
                    <i className="bi bi-cash-stack me-2"></i> Fee Details
                  </h4>

                  {student.feeDetails ? (
                    <>
                      <Row className="mb-3">
                        <Col xs={12} sm={6}>
                          <p className="student-text-muted fs-5">
                            <strong className="student-text-secondary">Total Fee:</strong> ₹
                            {student.feeDetails.totalFee}
                          </p>
                          <p className="student-text-muted">
                            <i className="bi bi-credit-card me-1"></i>
                            <strong className="student-text-secondary">Payment Option:</strong>{' '}
                            {student.feeDetails.paymentOption}
                          </p>
                        </Col>
                      </Row>

                      <h5 className="student-text-secondary fw-semibold mb-2">
                        Installment Details
                      </h5>
                      <div className="table-responsive">
                        <Table bordered hover className="student-table-custom">
                          <thead>
                            <tr>
                              <th>Term Name</th>
                              <th>Amount</th>
                              <th>Due Date</th>
                              <th>Paid Amount</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {student.feeDetails.terms?.length > 0 ? (
                              student.feeDetails.terms.map((term, index) => (
                                <tr key={index}>
                                  <td>{term.termName}</td>
                                  <td>₹{term.amount}</td>
                                  <td>
                                    {term.dueDate
                                      ? new Date(term.dueDate).toLocaleDateString()
                                      : 'N/A'}
                                  </td>
                                  <td>₹{term.paidAmount}</td>
                                  <td>
                                    <Badge
                                      bg={term.status === 'Paid' ? 'success' : 'primary'}
                                      className="px-2 py-1"
                                    >
                                      {term.status}
                                    </Badge>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="text-center student-text-muted">
                                  <i className="bi bi-info-circle me-1"></i> No installment details
                                  available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </div>

                      <h5 className="student-text-secondary fw-semibold mt-3 mb-2">
                        Payment History
                      </h5>
                      <div className="table-responsive">
                        <Table bordered hover className="student-table-custom">
                          <thead>
                            <tr>
                              <th>Amount Paid</th>
                              <th>Payment Date</th>
                              <th>Payment Method</th>
                              <th>Receipt No.</th>
                              <th>Status</th>
                              <th>Term Paid</th>
                            </tr>
                          </thead>
                          <tbody>
                            {student.feeDetails.paymentHistory?.length > 0 ? (
                              student.feeDetails.paymentHistory.map((payment, index) => (
                                <tr key={index}>
                                  <td>₹{payment.amountPaid}</td>
                                  <td>
                                    {payment.paymentDate
                                      ? new Date(payment.paymentDate).toLocaleDateString()
                                      : 'N/A'}
                                  </td>
                                  <td>
                                    <i className="bi bi-wallet me-1"></i> {payment.paymentMethod}
                                  </td>
                                  <td>{payment.receiptNumber}</td>
                                  <td>
                                    <Badge
                                      bg={
                                        payment.status === 'SUCCESS'
                                          ? 'success'
                                          : payment.status === 'FAILED'
                                          ? 'danger'
                                          : 'primary'
                                      }
                                      className="px-2 py-1"
                                    >
                                      {payment.status}
                                    </Badge>
                                  </td>
                                  <td>{payment.termName || payment.termPaid || 'N/A'}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="6" className="text-center student-text-muted">
                                  <i className="bi bi-info-circle me-1"></i> No payment history
                                  available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </div>

                      {role === 'admin' && (
                        <div className="text-center mt-3">
                          <Button className="student-btn-success">
                            <i className="bi bi-gear-fill me-2"></i> Manage Fees
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <Alert variant="info" className="text-center">
                      <i className="bi bi-exclamation-triangle me-2"></i> No fee details available
                    </Alert>
                  )}
                </Card>
              </Tab.Pane>

              {/* Additional Information */}
              <Tab.Pane eventKey="additionalInfo" className="fade">
                <Card className="student-card p-3 shadow-sm">
                  <h5 className="student-text-secondary fw-semibold">Additional Information</h5>
                  {student.busRoute && (
                    <div>
                      <h6 className="student-text-secondary mb-2">Bus Route Details</h6>
                      <Row>
                        <Col xs={12} sm={6}>
                          <p className="student-text-muted">
                            <strong className="student-text-secondary">Route Number:</strong>{' '}
                            {student.busRoute.routeNumber || 'N/A'}
                          </p>
                          <p className="student-text-muted">
                            <strong className="student-text-secondary">Pickup Location:</strong>{' '}
                            {student.busRoute.pickupLocation || 'N/A'}
                          </p>
                        </Col>
                        <Col xs={12} sm={6}>
                          <p className="student-text-muted">
                            <strong className="student-text-secondary">Drop Location:</strong>{' '}
                            {student.busRoute.dropLocation || 'N/A'}
                          </p>
                          <p className="student-text-muted">
                            <strong className="student-text-secondary">Driver:</strong>{' '}
                            {student.busRoute.driverName
                              ? `${student.busRoute.driverName} (${
                                  student.busRoute.driverContact || 'N/A'
                                })`
                              : 'N/A'}
                          </p>
                        </Col>
                      </Row>
                    </div>
                  )}
                </Card>
              </Tab.Pane>

              {/* Print ID Card */}
              <Tab.Pane eventKey="printIdCard" className="fade">
                <div className="d-flex justify-content-center py-3 IdCard">
                  <Card className="student-id-card p-3 shadow-sm">
                    <h5 className="student-text-secondary fw-semibold text-center mb-3">
                      Student ID Card
                    </h5>
                    <div id="id-card-content" className="text-center cardstyle">
                      <p className="fw-semibold student-text-secondary">SkillBridge School</p>
                      <img
                        src={`${BASE_URL}/Uploads/${student.profilePicture}`}
                        alt="Student"
                        className="rounded-circle mb-3"
                        onError={(e) => (e.target.src = 'https://via.placeholder.com/100')}
                      />
                      <h4 className="student-text-secondary mb-2">{student.name}</h4>
                      <p className="student-text-muted">
                        <strong className="student-text-secondary">Admission No:</strong>{' '}
                        {student.admissionNo}
                      </p>
                      <p className="student-text-muted">
                        <strong className="student-text-secondary">Class:</strong>{' '}
                        {student.className} - {student.section}
                      </p>
                      <p className="student-text-muted">
                        <strong className="student-text-secondary">Roll No:</strong>{' '}
                        {student.rollNumber}
                      </p>
                      <p className="student-text-muted">
                        <strong className="student-text-secondary">Phone:</strong>{' '}
                        {student.phone}
                      </p>
                      <p className="student-text-muted">
                        <strong className="student-text-secondary">Blood Group:</strong>{' '}
                        {healthRecord?.bloodGroup || 'N/A'}
                      </p>
                    </div>
                    <div className="text-center mt-3">
                      <Button className="student-btn-success" onClick={handlePrint}>
                        Print ID Card
                      </Button>
                    </div>
                  </Card>
                </div>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default StudentDetailsPage;