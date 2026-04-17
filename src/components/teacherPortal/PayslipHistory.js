import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FileText, Download, Eye, Trash2, Folder as FolderIcon, FolderPlus } from 'react-feather';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@nextui-org/react';
import { jwtDecode } from 'jwt-decode';

const PayslipHistory = () => {
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPayslip, setSelectedPayslip] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState({});

    // const BASE_URL =
    //     process.env.NODE_ENV === 'production'
    //         ? process.env.REACT_APP_API_DEPLOYED_URL
    //         : process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const BASE_URL = process.env.REACT_APP_API_URL;

    // Group payslips by year and month
    const groupedPayslips = payslips.reduce((acc, payslip) => {
        const year = payslip.year;
        const month = payslip.month;
        if (!acc[year]) acc[year] = {};
        if (!acc[year][month]) acc[year][month] = [];
        acc[year][month].push(payslip);
        return acc;
    }, {});

    // Toggle folder expansion
    const toggleFolder = (folderKey) => {
        setExpandedFolders((prev) => ({
            ...prev,
            [folderKey]: !prev[folderKey],
        }));
    };

    // Fetch teacher details to get teacherId
    const fetchTeacherId = async () => {
        const startTime = performance.now();
        try {
            const token = localStorage.getItem('token');
            const userRaw = localStorage.getItem('user');

            if (!token) {
                throw new Error('No authentication token found. Please log in again.');
            }

            if (typeof token !== 'string' || !token.includes('.') || token.split('.').length !== 3) {
                throw new Error('Invalid token format. Token must be a valid JWT.');
            }

            let roleId;
            try {
                jwtDecode(token); // just to validate the token
                const user = JSON.parse(userRaw);
                roleId = user?.roleId;

                if (!roleId) {
                    throw new Error('Teacher ID (roleId) not found in user data. Please contact support.');
                }
            } catch (decodeError) {
                console.error('Token decoding error:', decodeError);
                throw new Error('Failed to decode token. It may be invalid or expired.');
            }

            const endTime = performance.now();
            console.log(`fetchTeacherId latency: ${(endTime - startTime).toFixed(2)}ms`);
            return roleId;

        } catch (err) {
            console.error('Error fetching teacher details:', err);
            throw err;
        }
    };

    // Fetch payslip history
    const fetchPayslips = async () => {
        const startTime = performance.now();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in again.');
            }

            const teacherId = await fetchTeacherId();
            if (!teacherId) return;

            const config = {
                headers: { Authorization: `Bearer ${token}` },
            };

            const response = await axios.get(`${BASE_URL}/api/teachers/${teacherId}/payslips`, config);
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch payslips');
            }
            setPayslips(response.data.data || []);
            setLoading(false);

            const endTime = performance.now();
            console.log(`fetchPayslips latency: ${(endTime - startTime).toFixed(2)}ms`);
        } catch (err) {
            console.error('Error fetching payslips:', err);
            setError(err.message || 'Failed to fetch payslip history');
            setLoading(false);
            toast.error(err.message || 'Failed to fetch payslip history');
        }
    };

    // View payslip PDF
    const handleViewPayslip = async (filename) => {
        const startTime = performance.now();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required. Please log in again.');
            }

            const url = `${BASE_URL}/api/teachers/payslips/${filename}`;
            window.open(url, '_blank');

            const endTime = performance.now();
            console.log(`handleViewPayslip latency: ${(endTime - startTime).toFixed(2)}ms`);
        } catch (err) {
            console.error('Error viewing payslip:', err);
            toast.error(err.message || 'Failed to view payslip');
        }
    };

    // Download payslip
    const handleDownloadPayslip = async (payslipId, filename) => {
        const startTime = performance.now();
        try {
            const token = localStorage.getItem('token');
            const teacherId = await fetchTeacherId();
            if (!token || !teacherId) {
                throw new Error('Authentication required. Please log in again.');
            }

            const config = {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            };

            const response = await axios.get(
                `${BASE_URL}/api/teachers/${teacherId}/payslips/${payslipId}/download`,
                config
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Payslip downloaded successfully');
            const endTime = performance.now();
            console.log(`handleDownloadPayslip latency: ${(endTime - startTime).toFixed(2)}ms`);
        } catch (err) {
            console.error('Error downloading payslip:', err);
            toast.error(err.message || 'Failed to download payslip');
        }
    };

    // Delete payslip
    const handleDeletePayslip = async (payslipId) => {
        if (!window.confirm('Are you sure you want to delete this payslip?')) {
            return;
        }

        const startTime = performance.now();
        try {
            const token = localStorage.getItem('token');
            const teacherId = await fetchTeacherId();
            if (!token || !teacherId) {
                throw new Error('Authentication required. Please log in again.');
            }

            const config = {
                headers: { Authorization: `Bearer ${token}` },
            };

            const response = await axios.delete(`${BASE_URL}/api/teachers/${teacherId}/payslips/${payslipId}`, config);
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to delete payslip');
            }

            setPayslips((prev) => prev.filter((p) => p.payslipId !== payslipId));
            toast.success('Payslip deleted successfully');

            const endTime = performance.now();
            console.log(`handleDeletePayslip latency: ${(endTime - startTime).toFixed(2)}ms`);
        } catch (err) {
            console.error('Error deleting payslip:', err);
            toast.error(err.message || 'Failed to delete payslip');
        }
    };

    // View payslip details
    const handleViewDetails = async (payslipId) => {
        const startTime = performance.now();
        try {
            const token = localStorage.getItem('token');
            const teacherId = await fetchTeacherId();
            if (!token || !teacherId) {
                throw new Error('Authentication required. Please log in again.');
            }

            const config = {
                headers: { Authorization: `Bearer ${token}` },
            };

            const response = await axios.get(
                `${BASE_URL}/api/teachers/${teacherId}/payslips/${payslipId}`,
                config
            );
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch payslip details');
            }

            setSelectedPayslip(response.data.data);
            setIsModalOpen(true);

            const endTime = performance.now();
            console.log(`handleViewDetails latency: ${(endTime - startTime).toFixed(2)}ms`);
        } catch (err) {
            console.error('Error fetching payslip details:', err);
            toast.error(err.message || 'Failed to fetch payslip details');
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return isNaN(date)
            ? ''
            : date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
    };

    // Fetch payslips on component mount
    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = BASE_URL;
        document.head.appendChild(link);

        fetchPayslips();

        return () => {
            document.head.removeChild(link);
        };
    }, []);

    return (
        <div className="container-fluid p-0 p-md-4">
            <div className="row">
                <div className="col-12">
                    <h2 className="h4 mb-3 mb-md-4 fw-bold" style={{color: "#0000ff"}}>Payslip History</h2>

                    {loading && (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading payslips...</p>
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-danger text-center">
                            {error}
                        </div>
                    )}

                    {!loading && !error && payslips.length === 0 && (
                        <div className="text-center py-5 bg-light rounded">
                            <FileText size={48} className="mb-3 text-muted" />
                            <p className="text-muted">No payslips generated yet</p>
                        </div>
                    )}

                    {!loading && !error && payslips.length > 0 && (
                        <div className="accordion" id="payslipsAccordion">
                            {Object.keys(groupedPayslips)
                                .sort((a, b) => b - a)
                                .map((year) => (
                                    <div key={year} className="accordion-item mb-3 border-0 shadow-sm">
                                        <h2 className="accordion-header">
                                            <button
                                                className={`accordion-button ${expandedFolders[year] ? '' : 'collapsed'} p-3`}
                                                type="button"
                                                onClick={() => toggleFolder(year)}
                                                aria-expanded={expandedFolders[year] ? 'true' : 'false'}
                                            >
                                                <div className="d-flex align-items-center w-100">
                                                    {expandedFolders[year] ? (
                                                        <FolderPlus size={20} className="me-2 text-primary" />
                                                    ) : (
                                                        <FolderIcon size={20} className="me-2 text-secondary" />
                                                    )}
                                                    <span className="fw-semibold">{year}</span>
                                                    <span className="ms-auto text-muted small">
                                                        ({Object.keys(groupedPayslips[year]).length} months)
                                                    </span>
                                                </div>
                                            </button>
                                        </h2>

                                        {expandedFolders[year] && (
                                            <div className="accordion-collapse collapse show">
                                                <div className="accordion-body p-0 pt-1">
                                                    <div className="accordion" id={`year${year}Accordion`}>
                                                        {Object.keys(groupedPayslips[year])
                                                            .sort((a, b) => {
                                                                const monthOrder = [
                                                                    'January', 'February', 'March', 'April', 'May', 'June',
                                                                    'July', 'August', 'September', 'October', 'November', 'December'
                                                                ];
                                                                return monthOrder.indexOf(a) - monthOrder.indexOf(b);
                                                            })
                                                            .map((month) => (
                                                                <div key={month} className="accordion-item border-0">
                                                                    <h2 className="accordion-header">
                                                                        <button
                                                                            className={`accordion-button ${expandedFolders[`${year}-${month}`] ? '' : 'collapsed'} p-2`}
                                                                            type="button"
                                                                            onClick={() => toggleFolder(`${year}-${month}`)}
                                                                            aria-expanded={expandedFolders[`${year}-${month}`] ? 'true' : 'false'}
                                                                        >
                                                                            <div className="d-flex align-items-center w-100">
                                                                                {expandedFolders[`${year}-${month}`] ? (
                                                                                    <FolderPlus size={18} className="me-2 text-primary" />
                                                                                ) : (
                                                                                    <FolderIcon size={18} className="me-2 text-secondary" />
                                                                                )}
                                                                                <span className="fw-medium">{month}</span>
                                                                                {/* <span className="ms-auto text-muted small">
                      ({groupedPayslips[year][month].length} payslips)
                    </span> */}
                                                                            </div>
                                                                        </button>
                                                                    </h2>

                                                                    <div className="container-fluid px-1 px-md-3">
                                                                        {expandedFolders[`${year}-${month}`] && (
                                                                            <div className="accordion-collapse collapse show">
                                                                                <div className="accordion-body p-0 pt-1 pb-1">
                                                                                    <ul className="list-group list-group-flush">
                                                                                        {groupedPayslips[year][month]
                                                                                            .sort((a, b) => new Date(b.generatedDate) - new Date(a.generatedDate))
                                                                                            .map((payslip) => (
                                                                                                <li key={payslip.payslipId} className="list-group-item p-2">
                                                                                                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                                                                                                        <div className="d-flex align-items-center mb-2 mb-md-0">
                                                                                                            <FileText size={16} className="me-2 text-muted" />
                                                                                                            <div>
                                                                                                                <div className="fw-medium small text-truncate" style={{ maxWidth: '250px' }}>
                                                                                                                    {payslip.filename}
                                                                                                                </div>
                                                                                                                <div className="text-muted small">
                                                                                                                    Net Pay: ₹{Number(payslip.netPay).toFixed(2)} | Generated: {formatDate(payslip.generatedDate)}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <div className="d-flex">
                                                                                                            <button
                                                                                                                className="btn btn-sm btn-outline-success ms-2"
                                                                                                                onClick={() => handleDownloadPayslip(payslip.payslipId, payslip.filename)}
                                                                                                                title="Download PDF"
                                                                                                            >
                                                                                                                <Download size={14} />
                                                                                                            </button>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </li>
                                                                                            ))}
                                                                                    </ul>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Payslip Details */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                size="3xl"
                className="max-h-[80vh] overflow-y-auto"
            >
                <ModalContent>
                    <ModalHeader className="text-lg font-semibold">Payslip Details</ModalHeader>
                    <ModalBody>
                        {selectedPayslip && (
                            <div className="row">
                                <div className="col-12">
                                    <h3 className="h5 fw-semibold mb-3">
                                        Payslip for {selectedPayslip.month} {selectedPayslip.year}
                                    </h3>
                                </div>

                                <div className="col-md-6">
                                    <div className="card mb-3">
                                        <div className="card-body">
                                            <h4 className="h6 fw-semibold mb-3">Employee Information</h4>
                                            <dl className="row mb-0">
                                                <dt className="col-sm-5">Employee ID:</dt>
                                                <dd className="col-sm-7">{selectedPayslip.payslipData.empId}</dd>

                                                <dt className="col-sm-5">Name:</dt>
                                                <dd className="col-sm-7">{selectedPayslip.payslipData.empName}</dd>

                                                <dt className="col-sm-5">Date of Joining:</dt>
                                                <dd className="col-sm-7">{selectedPayslip.payslipData.doj}</dd>

                                                <dt className="col-sm-5">Bank Name:</dt>
                                                <dd className="col-sm-7">{selectedPayslip.payslipData.bankName}</dd>

                                                <dt className="col-sm-5">Account No:</dt>
                                                <dd className="col-sm-7">{selectedPayslip.payslipData.accountNo}</dd>

                                                <dt className="col-sm-5">Location:</dt>
                                                <dd className="col-sm-7">{selectedPayslip.payslipData.location}</dd>

                                                <dt className="col-sm-5">Department:</dt>
                                                <dd className="col-sm-7">{selectedPayslip.payslipData.department}</dd>

                                                <dt className="col-sm-5">Designation:</dt>
                                                <dd className="col-sm-7">{selectedPayslip.payslipData.designation}</dd>

                                                <dt className="col-sm-5">PAN No:</dt>
                                                <dd className="col-sm-7">{selectedPayslip.payslipData.panNo}</dd>

                                                <dt className="col-sm-5">EPF No:</dt>
                                                <dd className="col-sm-7">{selectedPayslip.payslipData.epfNo}</dd>

                                                <dt className="col-sm-5">Month Days:</dt>
                                                <dd className="col-sm-7">{selectedPayslip.payslipData.monthDays}</dd>

                                                <dt className="col-sm-5">Paid Days:</dt>
                                                <dd className="col-sm-7">{selectedPayslip.payslipData.paidDays}</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="card mb-3">
                                        <div className="card-body">
                                            <h4 className="h6 fw-semibold mb-3">Earnings</h4>
                                            <dl className="row mb-3">
                                                <dt className="col-sm-6">Basic:</dt>
                                                <dd className="col-sm-6">₹{Number(selectedPayslip.payslipData.basic).toFixed(2)}</dd>

                                                <dt className="col-sm-6">HRA:</dt>
                                                <dd className="col-sm-6">₹{Number(selectedPayslip.payslipData.hra).toFixed(2)}</dd>

                                                <dt className="col-sm-6">Conveyance:</dt>
                                                <dd className="col-sm-6">₹{Number(selectedPayslip.payslipData.conveyance).toFixed(2)}</dd>

                                                <dt className="col-sm-6">Medical:</dt>
                                                <dd className="col-sm-6">₹{Number(selectedPayslip.payslipData.medical).toFixed(2)}</dd>

                                                <dt className="col-sm-6">Bonus:</dt>
                                                <dd className="col-sm-6">₹{Number(selectedPayslip.payslipData.bonus).toFixed(2)}</dd>
                                            </dl>

                                            <h4 className="h6 fw-semibold mb-3">Deductions</h4>
                                            <dl className="row mb-3">
                                                <dt className="col-sm-6">PF:</dt>
                                                <dd className="col-sm-6">₹{Number(selectedPayslip.payslipData.pf).toFixed(2)}</dd>

                                                <dt className="col-sm-6">ESI:</dt>
                                                <dd className="col-sm-6">₹{Number(selectedPayslip.payslipData.esi).toFixed(2)}</dd>

                                                <dt className="col-sm-6">Professional Tax:</dt>
                                                <dd className="col-sm-6">₹{Number(selectedPayslip.payslipData.ptax).toFixed(2)}</dd>
                                            </dl>

                                            <div className="alert alert-success mb-0">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <strong className="h5 mb-0">Net Pay:</strong>
                                                    <strong className="h5 mb-0">₹{Number(selectedPayslip.netPay).toFixed(2)}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-body">
                                            <dl className="row mb-0">
                                                <dt className="col-sm-3">Filename:</dt>
                                                <dd className="col-sm-9">{selectedPayslip.filename}</dd>

                                                <dt className="col-sm-3">Generated Date:</dt>
                                                <dd className="col-sm-9">{formatDate(selectedPayslip.generatedDate)}</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onPress={() => setIsModalOpen(false)}>
                            Close
                        </Button>
                        {selectedPayslip && (
                            <Button
                                color="primary"
                                onPress={() => handleDownloadPayslip(selectedPayslip.payslipId, selectedPayslip.filename)}
                            >
                                Download PDF
                            </Button>
                        )}
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
};

export default PayslipHistory;
