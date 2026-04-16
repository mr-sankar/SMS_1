import axios from 'axios';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  ProgressBar,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const FeeDashboard = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const studentId = localStorage.getItem('selectedChild');

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const response = await axios.get(
          `${BASE_URL}/api/fees/${studentId}`,
          config
        );

        if (response.data.success && response.data.data) {
          setStudent(response.data.data);
        } else {
          setError('Invalid API response format');
        }
      } catch (err) {
        console.error('Error fetching fee details:', err);
        setError(err.response?.data?.message || 'Error fetching fee details');
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchStudentData();
    } else {
      setLoading(false);
      setError('Student ID is required');
    }
  }, [studentId]);

  if (loading) {
    return (
      <Container className='py-5 text-center' style={{ backgroundColor: '#e3e6eb' }}>
        <Spinner animation='border' style={{ color: '#3b82f6' }} />
        <p className='mt-2' style={{ color: '#4b5563' }}>Loading fee details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className='py-5' style={{ backgroundColor: '#e3e6eb' }}>
        <Alert style={{ backgroundColor: '#fee2e2', color: '#b91c1c', borderColor: '#b91c1c' }}>
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          {error === 'No authentication token found' && (
            <Button
              style={{
                borderColor: '#b91c1c',
                color: '#b91c1c',
                backgroundColor: 'transparent',
              }}
              onClick={() => navigate('/login')}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#b91c1c';
                e.target.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#b91c1c';
              }}
            >
              Login
            </Button>
          )}
        </Alert>
      </Container>
    );
  }

  if (!student || !student.feeDetails) {
    return (
      <Container className='py-5' style={{ backgroundColor: '#e3e6eb' }}>
        <Alert style={{ backgroundColor: '#fef3c7', color: '#b45309', borderColor: '#b45309' }}>
          <Alert.Heading>No Data</Alert.Heading>
          <p>No fee details available for this student.</p>
        </Alert>
      </Container>
    );
  }

  const { feeDetails } = student;

  const totalPaid = feeDetails.terms.reduce(
    (sum, term) => sum + (term.paidAmount || 0),
    0
  );

  const overallProgress = Math.round((totalPaid / feeDetails.totalFee) * 100);

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>Paid</Badge>;
      case 'partial':
        return <Badge style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>Partial</Badge>;
      case 'pending':
        return <Badge style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>Pending</Badge>;
      default:
        return <Badge style={{ backgroundColor: '#e5e7eb', color: '#4b5563' }}>{status}</Badge>;
    }
  };

  const getDueStatus = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);

    if (due < today) {
      return <Badge style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>Overdue</Badge>;
    } else if (due.getTime() - today.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return <Badge style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>Due Soon</Badge>;
    } else {
      return <Badge style={{ backgroundColor: '#e0f2fe', color: '#1e3a8a' }}>Upcoming</Badge>;
    }
  };

  const handlePayNow = (termId) => {
    navigate(`/pay/${studentId}?termId=${termId}`);
  };

  const handleViewHistory = () => {
    navigate(`/payment-history/${studentId}`);
  };

  const handleViewReceipt = (receiptId) => {
    navigate(`/receipt/${receiptId}`);
  };

  return (
    <Container className='py-4' style={{ backgroundColor: 'transparent', minHeight: '100vh' }}>
      <Row>
        <Col>
          <Card
            className='shadow-sm mb-4'
            style={{
              border: 'none',
              background: 'linear-gradient(145deg, #e0e7ff 0%, #f5f3ff 100%)',
            }}
          >
            <Card.Header
              style={{
                background: '#4A6096',
                border: 'none',
                color: '#fff',
              }}
            >
              <h2 className='mb-0' style={{color:"white"}}>Fee Details</h2>
            </Card.Header>
            <Card.Body style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}>
              <Row className='mb-4'>
                <Col md={6}>
                  <h4 style={{ color: '#2e1065' }}>{student.name}</h4>
                  <p style={{ color: '#4b5563' }}>
                    Class: {student.className} | Section: {student.section}
                  </p>
                  <p style={{ color: '#4b5563' }}>
                    Admission No: {student.admissionNo}
                  </p>
                </Col>
                <Col
                  md={6}
                  className='d-flex justify-content-md-end align-items-center'
                >
                  <div className='d-grid gap-2 d-md-flex'>
                    <Button
                      style={{
                        background: '#4C91B6',
                        border: 'none',
                        color: '#fff',
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = 'linear-gradient(145deg, #4f46e5, #9333ea)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'linear-gradient(145deg, #6366f1, #a855f7)';
                      }}
                      onClick={() => handlePayNow()}
                    >
                      Pay Fees
                    </Button>
                    <Button
                      style={{
                        borderColor: '#6366f1',
                        color: '#6366f1',
                        backgroundColor: 'transparent',
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#6366f1';
                        e.target.style.color = '#fff';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#6366f1';
                      }}
                      onClick={handleViewHistory}
                    >
                      Payment History
                    </Button>
                  </div>
                </Col>
              </Row>

              <Card
                className='mb-4'
                style={{
                  border: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 4px 16px rgba(31, 38, 135, 0.15)',
                }}
              >
                <Card.Body>
                  <Row className='align-items-center'>
                    <Col md={3}>
                      <h5 style={{ color: '#3b82f6' }}>
                        Total Fee: ₹{feeDetails.totalFee.toLocaleString()}
                      </h5>
                    </Col>
                    <Col md={3}>
                      <h5 style={{ color: '#065f46' }}>
                        Paid: ₹{totalPaid.toLocaleString()}
                      </h5>
                    </Col>
                    <Col md={3}>
                      <h5 style={{ color: '#b45309' }}>
                        Balance: ₹
                        {(feeDetails.totalFee - totalPaid).toLocaleString()}
                      </h5>
                    </Col>
                    <Col md={3}>
                      <h5 style={{ color: '#4b5563' }}>
                        Payment Option: {feeDetails.paymentOption}
                      </h5>
                    </Col>
                  </Row>
                </Card.Body>
                <Card.Footer style={{ backgroundColor: 'transparent', border: 'none' }}>
                  <div style={{ color: '#2e1065', marginBottom: '0.5rem' }}>
                    Overall Payment Progress
                  </div>
                  <ProgressBar
                    now={overallProgress}
                    label={`${overallProgress}%`}
                    style={{
                      height: '25px',
                      backgroundColor: '#e5e7eb',
                    }}
                    variant='custom'
                    className='progress-custom'
                  />
                  <style>{`
                    .progress-custom .progress-bar {
                      background: ${
                        overallProgress === 100
                          ? '#d1fae5'
                          : overallProgress > 50
                          ? '#4C91B6'
                          : '#fef3c7'
                      };
                      color: ${
                        overallProgress === 100
                          ? '#065f46'
                          : overallProgress > 50
                          ? '#fff'
                          : '#b45309'
                      };
                    }
                  `}</style>
                </Card.Footer>
              </Card>

              <h4 style={{ color: '#3b82f6', marginBottom: '1rem' }}>Payment Terms</h4>
              <div
                className='table-responsive rounded'
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 4px 16px rgba(31, 38, 135, 0.15)',
                }}
              >
                <Table hover borderless>
                  <thead style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                    <tr>
                      <th style={{ color: '#2e1065' }}>Term</th>
                      <th style={{ color: '#2e1065' }}>Total Amount</th>
                      <th style={{ color: '#2e1065' }}>Paid Amount</th>
                      <th style={{ color: '#2e1065' }}>Remaining</th>
                      <th style={{ color: '#2e1065' }}>Due Date</th>
                      <th style={{ color: '#2e1065' }}>Status</th>
                      <th style={{ color: '#2e1065' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                        {feeDetails.paymentHistory
                          .slice(0, 3)
                          .map((payment) => {
                            const receiptId =
                              payment.receiptId || payment.receiptNumber;

                            return (
                              <tr key={receiptId || payment.paymentDate}>
                              <td style={{ color: '#1f2937' }}>
                                {payment.paymentDate
                                  ? format(
                                      new Date(payment.paymentDate),
                                      'dd MMM yyyy'
                                    )
                                  : 'N/A'}
                              </td>
                              <td style={{ fontWeight: 'bold', color: '#1f2937' }}>
                                {receiptId || 'N/A'}
                              </td>
                              <td style={{ color: '#1f2937' }}>
                                {payment.termName || 'N/A'}
                              </td>
                              <td style={{ color: '#065f46' }}>
                                ₹{payment.amountPaid.toLocaleString()}
                              </td>
                              <td style={{ color: '#1f2937' }}>
                                {payment.paymentMethod || 'Unknown'}
                              </td>
                              <td>
                                <Badge
                                  style={{
                                    backgroundColor:
                                      payment.status === 'SUCCESS'
                                        ? '#d1fae5'
                                        : payment.status === 'FAILED'
                                        ? '#fee2e2'
                                        : '#fef3c7',
                                    color:
                                      payment.status === 'SUCCESS'
                                        ? '#065f46'
                                        : payment.status === 'FAILED'
                                        ? '#b91c1c'
                                        : '#b45309',
                                    borderRadius: '12px',
                                    padding: '0.5em 1em',
                                  }}
                                >
                                  {payment.status || 'Unknown'}
                                </Badge>
                              </td>
                              <td style={{ color: '#b91c1c' }}>
                                {payment.failureReason || '-'}
                              </td>
                              <td>
                                {payment.status === 'SUCCESS' && receiptId && (
                                  <Button
                                    size='sm'
                                    style={{
                                      borderColor: '#6366f1',
                                      color: '#6366f1',
                                      backgroundColor: 'transparent',
                                      borderRadius: '20px',
                                      padding: '0.25rem 1rem',
                                    }}
                                    onMouseOver={(e) => {
                                      e.target.style.backgroundColor = '#6366f1';
                                      e.target.style.color = '#fff';
                                    }}
                                    onMouseOut={(e) => {
                                      e.target.style.backgroundColor = 'transparent';
                                      e.target.style.color = '#6366f1';
                                    }}
                                    onClick={() => handleViewReceipt(receiptId)}
                                  >
                                    View Receipt
                                  </Button>
                                )}
                              </td>
                              </tr>
                            );
                          })}
                      </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {feeDetails.paymentHistory &&
            feeDetails.paymentHistory.length > 0 && (
              <Card
                className='shadow-sm'
                style={{
                  border: 'none',
                  background: 'linear-gradient(145deg, #e0e7ff 0%, #f5f3ff 100%)',
                }}
              >
                <Card.Header
                  style={{
                    background: '#435787',
                    border: 'none',
                    color: 'white',
                  }}
                >
                  <h3 className='mb-0'>Recent Payments</h3>
                </Card.Header>
                <Card.Body style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}>
                  <div
                    className='table-responsive rounded'
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      boxShadow: '0 4px 16px rgba(31, 38, 135, 0.15)',
                    }}
                  >
                    <Table hover borderless>
                      <thead style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                        <tr>
                          <th style={{ color: '#2e1065' }}>Date</th>
                          <th style={{ color: '#2e1065' }}>Receipt</th>
                          <th style={{ color: '#2e1065' }}>Term</th>
                          <th style={{ color: '#2e1065' }}>Amount</th>
                          <th style={{ color: '#2e1065' }}>Method</th>
                          <th style={{ color: '#2e1065' }}>Status</th>
                          <th style={{ color: '#2e1065' }}>Failure Reason</th>
                          <th style={{ color: '#2e1065' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feeDetails.paymentHistory
                          .slice(0, 3)
                          .map((payment) => (
                            <tr key={payment.receiptNumber}>
                              <td style={{ color: '#1f2937' }}>
                                {payment.paymentDate
                                  ? format(
                                      new Date(payment.paymentDate),
                                      'dd MMM yyyy'
                                    )
                                  : 'N/A'}
                              </td>
                              <td style={{ fontWeight: 'bold', color: '#1f2937' }}>
                                {payment.receiptNumber}
                              </td>
                              <td style={{ color: '#1f2937' }}>
                                {payment.termName || 'N/A'}
                              </td>
                              <td style={{ color: '#065f46' }}>
                                ₹{payment.amountPaid.toLocaleString()}
                              </td>
                              <td style={{ color: '#1f2937' }}>
                                {payment.paymentMethod || 'Unknown'}
                              </td>
                              <td>
                                <Badge
                                  style={{
                                    backgroundColor:
                                      payment.status === 'SUCCESS'
                                        ? '#d1fae5'
                                        : payment.status === 'FAILED'
                                        ? '#fee2e2'
                                        : '#fef3c7',
                                    color:
                                      payment.status === 'SUCCESS'
                                        ? '#065f46'
                                        : payment.status === 'FAILED'
                                        ? '#b91c1c'
                                        : '#b45309',
                                    borderRadius: '12px',
                                    padding: '0.5em 1em',
                                  }}
                                >
                                  {payment.status || 'Unknown'}
                                </Badge>
                              </td>
                              <td style={{ color: '#b91c1c' }}>
                                {payment.failureReason || '-'}
                              </td>
                              <td>
                                {payment.status === 'SUCCESS' && (
                                  <Button
                                    size='sm'
                                    style={{
                                      borderColor: '#6366f1',
                                      color: '#6366f1',
                                      backgroundColor: 'transparent',
                                      borderRadius: '20px',
                                      padding: '0.25rem 1rem',
                                    }}
                                    onMouseOver={(e) => {
                                      e.target.style.backgroundColor = '#6366f1';
                                      e.target.style.color = '#fff';
                                    }}
                                    onMouseOut={(e) => {
                                      e.target.style.backgroundColor = 'transparent';
                                      e.target.style.color = '#6366f1';
                                    }}
                                    onClick={() =>
                                      handleViewReceipt(payment.receiptNumber)
                                    }
                                  >
                                    View Receipt
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </Table>
                  </div>
                  {feeDetails.paymentHistory.length > 3 && (
                    <div className='text-center mt-4'>
                      <Button
                        style={{
                          borderColor: '#6366f1',
                          color: '#6366f1',
                          backgroundColor: 'transparent',
                          borderRadius: '20px',
                          padding: '0.5rem 1.5rem',
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor = '#6366f1';
                          e.target.style.color = '#fff';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#6366f1';
                        }}
                        onClick={handleViewHistory}
                      >
                        View All Payments
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
        </Col>
      </Row>
    </Container>
  );
};

export default FeeDashboard;