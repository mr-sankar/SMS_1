import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useCallback, useEffect, useState } from 'react';
import { Search, PlusCircle, GraduationCap, Edit, Trash2, AlertCircle, Eye } from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

// StudentTable Component
const StudentTable = ({ students, onEdit, onDelete, onStudentSelect }) => {
  return (
    <div className="table-responsive">
      <style>
        {`
          /* Base table styles */
          .table-responsive {
            background: transparent;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .table {
            width: 100%;
            margin-bottom: 0;
            table-layout: fixed;
            
          }

          .table th, .table td {
            vertical-align: middle;
            padding: 12px;
            word-break: break-word;
          }

          /* Column widths for desktop */
          .table th:nth-child(1), .table td:nth-child(1) { width: 20%; } /* Student Details */
          .table th:nth-child(2), .table td:nth-child(2) { width: 15%; } /* Admission No */
          .table th:nth-child(3), .table td:nth-child(3) { width: 15%; } /* Class & Section */
          .table th:nth-child(4), .table td:nth-child(4) { width: 20%; } /* Contact Info */
          .table th:nth-child(5), .table td:nth-child(5) { width: 15%; } /* Type */
          .table th:nth-child(6), .table td:nth-child(6) { 
            width: 15%; 
            min-width: 120px;
          } /* Actions */

          /* Text truncation with ellipsis */
          .truncate-text {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }

          /* Action buttons styling */
          .btn-group {
            display: flex;
            gap: 5px;
            justify-content: center;
            width: 100%;
            max-width: 100%;
            flex-wrap: nowrap;
          }

          .btn-group .btn {
            padding: 4px 8px;
            font-size: 14px;
            flex: 1;
            min-width: 0;
          }

          /* Responsive adjustments */
          @media (max-width: 768px) {
            .table {
              display: block;
            }

            .table thead {
              display: none;
            }

            .table tbody {
              display: block;
            }

            .table tbody tr {
              display: block;
              margin-bottom: 15px;
              border: 1px solid #dee2e6;
              border-radius: 4px;
              background-color: #fff;
            }

            .table tbody td {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding: 10px;
              border: none;
              border-bottom: 1px solid #dee2e6;
              width: 100% !important;
            }

            .table tbody td:last-child {
              border-bottom: none;
            }

            .table tbody td:before {
              content: attr(data-label);
              font-weight: bold;
              margin-right: 10px;
              color: #495057;
              flex: 0 0 30%;
              min-width: 90px;
            }

            .table tbody td:nth-child(1) {
              flex-direction: column;
              align-items: flex-start;
            }

            .table tbody td:nth-child(5) {
              justify-content: flex-end;
              padding: 8px 10px;
            }

            .btn-group {
              flex-wrap: wrap;
              gap: 5px;
              justify-content: flex-end;
            }
          }

          @media (max-width: 576px) {
            .table tbody td {
              font-size: 14px;
              padding: 8px;
            }

            .table tbody td:before {
              flex: 0 0 40%;
              font-size: 12px;
            }

            .btn-group {
              flex-direction: row;
              gap: 3px;
            }

            .btn-group .btn {
              padding: 3px 6px;
              font-size: 12px;
            }

            .badge {
              font-size: 12px;
              padding: 4px 8px;
            }

            .truncate-text {
              font-size: 12px;
            }
          }

          .card {
            border-radius: 8px;
            overflow: hidden;
          }

          .hover-bg-light:hover {
            background-color: #f8f9fa;
          }

          .bg-primary-subtle{
            background: #99a8d6 !important;
            color: #000;
            border: 1px solid #99a8d6;
          }

          .pagination {
          margin-top: 15px;
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          justify-content: center;
        }
        .pagination .page-link {
          padding: 6px 12px;
          font-size: 14px;
          background: #99a8d6;
          color: #000;
          border: none;
        }
        .pagination .page-link:hover {
          background: #6e85d0;
        }
        .pagination .page-item.active .page-link {
          background: #6e85d0;
          color: #000;
        }
        .pagination .page-item.disabled .page-link {
          background: #3D3D3D;
          color: #99a8d6;
        }
        @media (max-width: 576px) {
          .pagination .page-link {
            padding: 4px 8px;
            font-size: 12px;
          }
          .showing-text {
            font-size: 12px;
            text-align: center;
            margin-bottom: 10px;
          }
        }
          
        `}
      </style>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 ps-4">Student Details</th>
                  <th className="border-0">Admission No</th>
                  <th className="border-0">Class & Section</th>
                  <th className="border-0">Contact Info</th>
                  <th className="border-0">Type</th>
                  <th className="border-0 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div className="d-flex flex-column align-items-center my-4 text-muted">
                        <AlertCircle size={40} className="mb-3 opacity-50" />
                        <p className="fs-5 fw-medium mb-1">No students found</p>
                        <p className="small">
                          There are no students in the system yet
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr
                      key={student._id}
                      style={{ cursor: "pointer" }}
                      className="hover-bg-light"
                    >
                      <td
                        className="ps-4"
                        onClick={() => onStudentSelect(student)}
                        data-label="Student Details"
                      >
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0">
                            <img
                              className="rounded-circle border shadow-sm"
                              style={{
                                width: "48px",
                                height: "48px",
                                objectFit: "cover",
                              }}
                              src={
                                student.profilePicture
                                  ? `${process.env.REACT_APP_API_URL}/Uploads/${student.profilePicture}`
                                  : "/api/placeholder/48/48"
                              }
                              alt=""
                            />
                          </div>
                          <div className="ms-3">
                            <div className="fw-semibold truncate-text">
                              {student.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td
                        onClick={() => onStudentSelect(student)}
                        data-label="Admission No"
                      >
                        <div className="truncate-text">{student.admissionNo}</div>
                      </td>
                      <td
                        onClick={() => onStudentSelect(student)}
                        data-label="Class & Section"
                      >
                        <div className="truncate-text">
                          {student.className} - {student.section}
                        </div>
                      </td>
                      <td
                        onClick={() => onStudentSelect(student)}
                        data-label="Contact Info"
                      >
                        <div className="truncate-text">{student.email}</div>
                        <div className="small text-muted truncate-text">
                          {student.phone}
                        </div>
                      </td>
                      <td
                        onClick={() => onStudentSelect(student)}
                        data-label="Type"
                      >
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill">
                          {student.isHostelStudent ? "Hostel" : "Day Scholar"}
                        </span>
                      </td>
                      <td
                        className="text-center"
                        data-label="Actions"
                      >
                        <div className="btn-group" role="group">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(student);
                            }}
                            className="btn btn-sm btn-outline-primary"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Edit Student"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(student._id);
                            }}
                            className="btn btn-group btn-sm btn-outline-danger"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Delete Student"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onStudentSelect(student);
                            }}
                            className="btn btn-sm btn-outline-info"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="View Student"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddStudent = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editStudentId, setEditStudentId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [currentPageHostel, setCurrentPageHostel] = useState(1);
  const [currentPageDayScholar, setCurrentPageDayScholar] = useState(1);
  const [studentsPerPage] = useState(5);
  const [feeStructure, setFeeStructure] = useState([]);
  const [hostelFeeStructure, setHostelFeeStructure] = useState([]);
  const [busRoutes, setBusRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [driverInfo, setDriverInfo] = useState({
    driverName: "",
    phoneNumber: "",
    fromLocation: "",
    toLocation: "",
  });
  const [remainingDayScholarFee, setRemainingDayScholarFee] = useState(0);
  const [remainingHostelFee, setRemainingHostelFee] = useState(0);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    admissionNo: "",
    rollNumber: "",
    name: "",
    password: "",
    dateOfBirth: "",
    gender: "Male",
    className: "",
    section: "",
    phone: "",
    email: "",
    address: { street: "", city: "", state: "", zipCode: "", country: "" },
    emergencyContact: { name: "", relation: "", phone: "" },
    feeDetails: {
      totalFee: "",
      paymentOption: "Full Payment",
      terms: [],
      paymentHistory: [],
    },
    busRoute: {
      routeNumber: "",
      pickupLocation: "",
      dropLocation: "",
      driverName: "",
      driverContact: "",
    },
    parents: [],
    profilePicture: null,
    isHostelStudent: false,
    healthRecord: {
      height: "",
      weight: "",
      bloodGroup: "",
      allergies: "",
      medicalConditions: "",
      medications: "",
      lastCheckupDate: "",
    },
  });
  const [termCount, setTermCount] = useState(1);
  const [termDetails, setTermDetails] = useState([
    {
      termName: "Term 1",
      amount: 0,
      dueDate: "",
      paidAmount: 0,
      status: "Pending",
    },
  ]);

  const [uniqueClasses, setUniqueClasses] = useState([]);

  const classAgeLimits = {
    UKG: { min: 3, max: 5 },
    LKG: { min: 3, max: 4 },
    "1st Grade": { min: 5, max: 6 },
    "2nd Grade": { min: 6, max: 7 },
    "3rd Grade": { min: 7, max: 8 },
    "4th Grade": { min: 8, max: 9 },
    "5th Grade": { min: 9, max: 10 },
    "6th Grade": { min: 10, max: 11 },
    "7th Grade": { min: 11, max: 12 },
    "8th Grade": { min: 12, max: 13 },
    "9th Grade": { min: 13, max: 14 },
    "10th Grade": { min: 14, max: 15 },
    "11th Grade": { min: 15, max: 16 },
    "12th Grade": { min: 16, max: 17 },
  };
  const sectionOptions = ["A", "B"];

  // const BASE_URL =
  //   process.env.NODE_ENV === "production"
  //     ? process.env.REACT_APP_API_DEPLOYED_URL
  //     : process.env.REACT_APP_API_URL;

  const BASE_URL = process.env.REACT_APP_API_URL;

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Please log in to access this feature");
      throw new Error('No token found');
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    };
  };

  const fetchData = useCallback(async () => {
    try {
      const [studentsRes, feeRes, hostelFeeRes, busRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/students`, getAuthConfig()),
        axios.get(`${BASE_URL}/fees`, getAuthConfig()),
        axios.get(`${BASE_URL}/api/hostelFees`, getAuthConfig()),
        axios.get(`${BASE_URL}/driver-profiles`, getAuthConfig()),
      ]);
      setStudents(studentsRes.data || []);
      setFeeStructure(feeRes.data);
      setHostelFeeStructure(hostelFeeRes.data);
      setBusRoutes(busRes.data);
    } catch (error) {
      toast.error(
        "Error fetching data: " +
        (error.response?.data?.message || error.message)
      );
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  }, [navigate]);

  // Add this useEffect to create unique class list
  // Replace the previous useEffect for uniqueClasses with this improved version
  useEffect(() => {
    const dayScholarClasses = feeStructure.map((fee) => fee.class);
    const hostelClasses = hostelFeeStructure.map((fee) => fee.class);

    const allClasses = [...dayScholarClasses, ...hostelClasses]
      .filter(Boolean)                    // remove null/undefined/empty
      .map(normalizeClassName);           // normalize names

    const uniqueClassesList = [...new Set(allClasses)].sort();

    setUniqueClasses(uniqueClassesList);
  }, [feeStructure, hostelFeeStructure]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchStudents = useCallback(async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/students`,
        getAuthConfig()
      );
      setStudents(response.data || []);
    } catch (error) {
      toast.error(
        "Error fetching students: " +
        (error.response?.data?.message || error.message)
      );
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (
      formData.feeDetails.paymentOption === "Installments" &&
      formData.feeDetails.totalFee
    ) {
      const totalFee = parseFloat(formData.feeDetails.totalFee) || 0;
      const perTermAmount = Math.round((totalFee / termCount) * 100) / 100;
      const newTerms = Array(termCount)
        .fill()
        .map((_, index) => ({
          termName: `Term ${index + 1}`,
          amount: perTermAmount,
          dueDate: termDetails[index]?.dueDate || "",
          paidAmount: termDetails[index]?.paidAmount || 0,
          status: termDetails[index]?.status || "Pending",
        }));
      setTermDetails(newTerms);

      const totalPaid = newTerms.reduce(
        (sum, term) => sum + (term.status === "Paid" ? term.amount : 0),
        0
      );
      if (formData.isHostelStudent) {
        setRemainingHostelFee(totalFee - totalPaid);
        setRemainingDayScholarFee(0);
      } else {
        setRemainingDayScholarFee(totalFee - totalPaid);
        setRemainingHostelFee(0);
      }
    }
  }, [
    termCount,
    formData.feeDetails.totalFee,
    formData.feeDetails.paymentOption,
  ]);

  useEffect(() => {
    if (selectedRoute && !formData.isHostelStudent) {
      const selectedDriver = busRoutes.find(
        (bus) => bus.busNumber === selectedRoute
      );
      if (selectedDriver) {
        setDriverInfo({
          driverName: selectedDriver.driverName || "",
          phoneNumber: selectedDriver.phoneNumber || "",
          fromLocation: selectedDriver.fromLocation || "",
          toLocation: selectedDriver.toLocation || "",
        });
        setFormData((prev) => ({
          ...prev,
          busRoute: {
            routeNumber: selectedRoute,
            driverName: selectedDriver.driverName || "",
            driverContact: selectedDriver.phoneNumber || "",
            pickupLocation: selectedDriver.fromLocation || "",
            dropLocation: selectedDriver.toLocation || "",
          },
        }));
      }
    } else if (formData.isHostelStudent) {
      setSelectedRoute("");
      setDriverInfo({
        driverName: "",
        phoneNumber: "",
        fromLocation: "",
        toLocation: "",
      });
      setFormData((prev) => ({
        ...prev,
        busRoute: {
          routeNumber: "",
          pickupLocation: "",
          dropLocation: "",
          driverName: "",
          driverContact: "",
        },
      }));
    }
  }, [selectedRoute, formData.isHostelStudent, busRoutes]);

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const validateAdmissionNo = (admissionNo) =>
    /^\d{3,5}$/.test(admissionNo) && !/^0+$/.test(admissionNo);

  const validateRollNumber = (rollNumber) =>
    /^\d{3}$/.test(rollNumber) && !/^0+$/.test(rollNumber);

  const validateName = (name) => /^[A-Za-z ]+$/.test(name);

  const validatePassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);

  const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone);

  const validateEmail = (email) => /^[^\s@]+@[^\s@0-9]+\.[^\s@]+$/.test(email);

  const validateZipCode = (zipCode) => /^\d{6}$/.test(zipCode);

  const handleInputChange = (e) => {
    const { name, value, type, files, checked } = e.target;
    let newErrors = { ...errors };

    if (type === "checkbox" && name === "isHostelStudent") {
      const newIsHostelStudent = checked;
      setFormData((prev) => ({
        ...prev,
        isHostelStudent: newIsHostelStudent,
        busRoute: newIsHostelStudent
          ? {
            routeNumber: "",
            pickupLocation: "",
            dropLocation: "",
            driverName: "",
            driverContact: "",
          }
          : prev.busRoute,
      }));
      if (newIsHostelStudent) {
        setSelectedRoute("");
        delete newErrors.busRoute;
        const selectedFee = hostelFeeStructure.find(
          (fee) => fee.class === formData.className
        );
        if (selectedFee) {
          const totalHostelFee =
            selectedFee.tuition + selectedFee.library + selectedFee.hostel;
          setFormData((prev) => ({
            ...prev,
            feeDetails: { ...prev.feeDetails, totalFee: totalHostelFee },
          }));
          setRemainingHostelFee(totalHostelFee);
          setRemainingDayScholarFee(0);
        }
      } else {
        if (!selectedRoute) {
          newErrors.busRoute = "Bus Route is required for day scholars";
        }
        const selectedFee = feeStructure.find(
          (fee) => fee.class === formData.className
        );
        if (selectedFee) {
          const totalDayScholarFee =
            selectedFee.tuition + selectedFee.library + selectedFee.transport;
          setFormData((prev) => ({
            ...prev,
            feeDetails: { ...prev.feeDetails, totalFee: totalDayScholarFee },
          }));
          setRemainingDayScholarFee(totalDayScholarFee);
          setRemainingHostelFee(0);
        }
      }
      setErrors(newErrors);
      return;
    }

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "file" ? files[0] : value,
      }));
      if (name === "className" && value) {

        const normalizedValue = normalizeClassName(value);

        const feeData = formData.isHostelStudent ? hostelFeeStructure : feeStructure;
        const selectedFee = feeData.find((fee) =>
          normalizeClassName(fee.class) === normalizedValue
        );

        setFormData((prev) => ({
          ...prev,
          className: normalizedValue,           // save normalized name
          feeDetails: {
            ...prev.feeDetails,
            totalFee: selectedFee ?
              (formData.isHostelStudent
                ? selectedFee.tuition + selectedFee.library + selectedFee.hostel
                : selectedFee.tuition + selectedFee.library + selectedFee.transport)
              : prev.feeDetails.totalFee
          },
        }));

        // const feeData = formData.isHostelStudent
        //   ? hostelFeeStructure
        //   : feeStructure;
        // const selectedFee = feeData.find((fee) => fee.class === value);
        if (selectedFee) {
          const totalFee = formData.isHostelStudent
            ? selectedFee.tuition + selectedFee.library + selectedFee.hostel
            : selectedFee.tuition + selectedFee.library + selectedFee.transport;
          setFormData((prev) => ({
            ...prev,
            feeDetails: { ...prev.feeDetails, totalFee },
          }));
          if (formData.isHostelStudent) {
            setRemainingHostelFee(totalFee);
            setRemainingDayScholarFee(0);
          } else {
            setRemainingDayScholarFee(totalFee);
            setRemainingHostelFee(0);
          }
        }
      }
    }

    if (name === "admissionNo") {
      setErrors((prev) => ({
        ...prev,
        admissionNo: validateAdmissionNo(value)
          ? ""
          : "Admission Number must be 3-5 digits and not all zeros",
      }));
    }
    if (name === "rollNumber") {
      setErrors((prev) => ({
        ...prev,
        rollNumber: validateRollNumber(value)
          ? ""
          : "Roll Number must be exactly 3 digits and not all zeros",
      }));
    }
    if (name === "name") {
      setErrors((prev) => ({
        ...prev,
        name: validateName(value)
          ? value
            ? ""
            : "Full Name is required"
          : "Full Name must contain only letters and spaces",
      }));
    }
    if (name === "password") {
      setErrors((prev) => ({
        ...prev,
        password: validatePassword(value)
          ? value
            ? ""
            : "Password is required"
          : "Password must be 8+ chars with uppercase, lowercase, number, and special char",
      }));
    }
    if (name === "dateOfBirth" && value) {
      const age = calculateAge(value);
      setErrors((prev) => ({
        ...prev,
        dateOfBirth: age < 3 ? "Student must be at least 3 years old" : "",
      }));
    }
    if (name === "className") {
      setErrors((prev) => ({
        ...prev,
        className: value ? "" : "Class is required",
      }));
    }
    if (name === "section") {
      setErrors((prev) => ({
        ...prev,
        section: value ? "" : "Section is required",
      }));
    }
    if (name === "phone") {
      setErrors((prev) => ({
        ...prev,
        phone: validatePhone(value)
          ? value
            ? ""
            : "Phone Number is required"
          : "Phone Number must be 10 digits starting with 6, 7, 8, or 9",
      }));
    }
    if (name === "email") {
      setErrors((prev) => ({
        ...prev,
        email: validateEmail(value)
          ? value
            ? ""
            : "Email is required"
          : "Invalid email format (e.g., abc23@xyz.asd)",
      }));
    }
    if (name === "address.street") {
      setErrors((prev) => ({
        ...prev,
        street: value ? "" : "Street is required",
      }));
    }
    if (name === "address.city") {
      setErrors((prev) => ({
        ...prev,
        city: validateName(value)
          ? value
            ? ""
            : "City is required"
          : "City must contain only letters and spaces",
      }));
    }
    if (name === "address.state") {
      setErrors((prev) => ({
        ...prev,
        state: validateName(value)
          ? value
            ? ""
            : "State is required"
          : "State must contain only letters and spaces",
      }));
    }
    if (name === "address.zipCode") {
      setErrors((prev) => ({
        ...prev,
        zipCode: validateZipCode(value)
          ? value
            ? ""
            : "ZIP Code is required"
          : "ZIP Code must be exactly 6 digits",
      }));
    }
    if (name === "address.country") {
      setErrors((prev) => ({
        ...prev,
        country: validateName(value)
          ? value
            ? ""
            : "Country is required"
          : "Country must contain only letters and spaces",
      }));
    }
    if (name === "emergencyContact.name") {
      setErrors((prev) => ({
        ...prev,
        emergencyContactName: validateName(value)
          ? value
            ? ""
            : "Contact Name is required"
          : "Contact Name must contain only letters and spaces",
      }));
    }
    if (name === "emergencyContact.relation") {
      setErrors((prev) => ({
        ...prev,
        emergencyContactRelation: validateName(value)
          ? value
            ? ""
            : "Relation is required"
          : "Relation must contain only letters and spaces",
      }));
    }
    if (name === "emergencyContact.phone") {
      setErrors((prev) => ({
        ...prev,
        emergencyContactPhone: validatePhone(value)
          ? value
            ? ""
            : "Contact Phone Number is required"
          : "Phone Number must be 10 digits starting with 6, 7, 8, or 9",
      }));
    }
    if (name === "feeDetails.totalFee") {
      const feeData = formData.isHostelStudent ? hostelFeeStructure : feeStructure;
      const selectedFee = feeData.find((fee) => fee.class === formData.className);
      const expectedFee = selectedFee
        ? formData.isHostelStudent
          ? selectedFee.tuition + selectedFee.library + selectedFee.hostel
          : selectedFee.tuition + selectedFee.library + selectedFee.transport
        : 0;
      setErrors((prev) => ({
        ...prev,
        totalFee:
          !value
            ? `${formData.isHostelStudent ? "Hostel" : "Day Scholar"} Total Fee is required`
            : parseFloat(value) <= 0
              ? `${formData.isHostelStudent ? "Hostel" : "Day Scholar"} Total Fee must be greater than 0`
              : selectedFee && parseFloat(value) < expectedFee
                ? `${formData.isHostelStudent ? "Hostel" : "Day Scholar"} Fee cannot be less than ₹${expectedFee}`
                : "",
      }));
    }
  };

  const handleHealthChange = (e) => {
    const { name, value } = e.target;
    let newErrors = { ...errors };

    if (name === "height" && value && parseFloat(value) < 0) {
      newErrors.height = "Height cannot be negative";
    } else {
      delete newErrors.height;
    }
    if (name === "weight" && value && parseFloat(value) < 0) {
      newErrors.weight = "Weight cannot be negative";
    } else {
      delete newErrors.weight;
    }
    if (name === "lastCheckupDate" && value) {
      const checkupDate = new Date(value);
      const today = new Date();
      if (checkupDate > today) {
        newErrors.lastCheckupDate = "Last checkup date cannot be in the future";
      } else {
        delete newErrors.lastCheckupDate;
      }
    }

    setErrors(newErrors);
    setFormData((prev) => ({
      ...prev,
      healthRecord: { ...prev.healthRecord, [name]: value },
    }));
  };

  const handleTermChange = (index, field, value) => {
    const updatedTerms = [...termDetails];
    const today = new Date().toISOString().split("T")[0];
    let newErrors = { ...errors };

    if (field === "termName") {
      if (!value) {
        newErrors[`termName${index}`] = "Term Name is required";
      } else {
        delete newErrors[`termName${index}`];
      }
      updatedTerms[index][field] = value;
    }
    if (field === "amount") {
      const amount = parseFloat(value) || 0;
      if (amount <= 0) {
        newErrors[`termAmount${index}`] = "Amount must be greater than 0";
      } else {
        delete newErrors[`termAmount${index}`];
      }
      updatedTerms[index][field] = amount;
    }
    if (field === "dueDate" && value) {
      const prevDueDate = index > 0 ? termDetails[index - 1].dueDate : null;
      if (updatedTerms[index].status !== "Paid") {
        if (value < today) {
          newErrors[`termDueDate${index}`] = "Due date cannot be in the past";
        } else if (prevDueDate && value <= prevDueDate) {
          newErrors[`termDueDate${index}`] =
            "Due date must be after previous term";
        } else {
          delete newErrors[`termDueDate${index}`];
        }
      }
      updatedTerms[index][field] = value;
    }
    if (field === "status") {
      if (value === "Paid") {
        updatedTerms[index].dueDate = "";
        delete newErrors[`termDueDate${index}`];
      }
      updatedTerms[index][field] = value;
    }

    setTermDetails(updatedTerms);
    setErrors(newErrors);

    const totalFee = parseFloat(formData.feeDetails.totalFee) || 0;
    const totalPaid = updatedTerms.reduce(
      (sum, term) => sum + (term.status === "Paid" ? term.amount : 0),
      0
    );
    if (formData.isHostelStudent) {
      setRemainingHostelFee(totalFee - totalPaid);
      if (totalFee - totalPaid < 0) {
        newErrors.remainingFee = "Hostel fee paid exceeds total fee";
      } else {
        delete newErrors.remainingFee;
      }
    } else {
      setRemainingDayScholarFee(totalFee - totalPaid);
      if (totalFee - totalPaid < 0) {
        newErrors.remainingFee = "Day scholar fee paid exceeds total fee";
      } else {
        delete newErrors.remainingFee;
      }
    }
    setErrors(newErrors);
  };

  const validateForm = () => {
    let newErrors = {};

    if (!validateAdmissionNo(formData.admissionNo)) {
      newErrors.admissionNo =
        "Admission Number must be 3-5 digits and not all zeros";
    }
    if (!validateRollNumber(formData.rollNumber)) {
      newErrors.rollNumber =
        "Roll Number must be exactly 3 digits and not all zeros";
    }
    if (!formData.name) {
      newErrors.name = "Full Name is required";
    } else if (!validateName(formData.name)) {
      newErrors.name = "Full Name must contain only letters and spaces";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!validatePassword(formData.password)) {
      newErrors.password =
        "Password must be 8+ chars with uppercase, lowercase, number, and special char";
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of Birth is required";
    } else {
      const age = calculateAge(formData.dateOfBirth);
      const classLimit = classAgeLimits[formData.className];
      if (age < 3) {
        newErrors.dateOfBirth = "Student must be at least 3 years old";
      } else if (classLimit && (age < classLimit.min || age > classLimit.max)) {
        newErrors.dateOfBirth = `Age must be between ${classLimit.min} and ${classLimit.max} for ${formData.className}`;
      }
    }
    if (!formData.className) {
      newErrors.className = "Class is required";
    }
    if (!formData.section) {
      newErrors.section = "Section is required";
    }
    if (!formData.phone) {
      newErrors.phone = "Phone Number is required";
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone =
        "Phone Number must be 10 digits starting with 6, 7, 8, or 9";
    }
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email format (e.g., abc23@xyz.asd)";
    }
    if (!formData.address.street) {
      newErrors.street = "Street is required";
    }
    if (!formData.address.city) {
      newErrors.city = "City is required";
    } else if (!validateName(formData.address.city)) {
      newErrors.city = "City must contain only letters and spaces";
    }
    if (!formData.address.state) {
      newErrors.state = "State is required";
    } else if (!validateName(formData.address.state)) {
      newErrors.state = "State must contain only letters and spaces";
    }
    if (!formData.address.zipCode) {
      newErrors.zipCode = "ZIP Code is required";
    } else if (!validateZipCode(formData.address.zipCode)) {
      newErrors.zipCode = "ZIP Code must be exactly 6 digits";
    }
    if (!formData.address.country) {
      newErrors.country = "Country is required";
    } else if (!validateName(formData.address.country)) {
      newErrors.country = "Country must contain only letters and spaces";
    }
    if (!formData.emergencyContact.name) {
      newErrors.emergencyContactName = "Contact Name is required";
    } else if (!validateName(formData.emergencyContact.name)) {
      newErrors.emergencyContactName =
        "Contact Name must contain only letters and spaces";
    }
    if (!formData.emergencyContact.relation) {
      newErrors.emergencyContactRelation = "Relation is required";
    } else if (!validateName(formData.emergencyContact.relation)) {
      newErrors.emergencyContactRelation =
        "Relation must contain only letters and spaces";
    }
    if (!formData.emergencyContact.phone) {
      newErrors.emergencyContactPhone = "Contact Phone Number is required";
    } else if (!validatePhone(formData.emergencyContact.phone)) {
      newErrors.emergencyContactPhone =
        "Phone Number must be 10 digits starting with 6, 7, 8, or 9";
    }
    if (!formData.feeDetails.totalFee) {
      newErrors.totalFee = `${formData.isHostelStudent ? "Hostel" : "Day Scholar"} Total Fee is required`;
    } else if (parseFloat(formData.feeDetails.totalFee) <= 0) {
      newErrors.totalFee = `${formData.isHostelStudent ? "Hostel" : "Day Scholar"} Total Fee must be greater than 0`;
    } else {
      const feeData = formData.isHostelStudent ? hostelFeeStructure : feeStructure;
      const selectedFee = feeData.find((fee) => fee.class === formData.className);
      if (selectedFee) {
        const expectedFee = formData.isHostelStudent
          ? selectedFee.tuition + selectedFee.library + selectedFee.hostel
          : selectedFee.tuition + selectedFee.library + selectedFee.transport;
        if (parseFloat(formData.feeDetails.totalFee) < expectedFee) {
          newErrors.totalFee = `${formData.isHostelStudent ? "Hostel" : "Day Scholar"} Fee cannot be less than ₹${expectedFee}`;
        }
      }
    }
    if (formData.feeDetails.paymentOption === "Installments") {
      termDetails.forEach((term, index) => {
        if (!term.termName)
          newErrors[`termName${index}`] = "Term Name is required";
        if (term.amount <= 0)
          newErrors[`termAmount${index}`] = "Amount must be greater than 0";
        if (term.status !== "Paid" && !term.dueDate) {
          newErrors[`termDueDate${index}`] =
            "Due Date is required for pending terms";
        }
        const totalTermAmount = termDetails.reduce(
          (sum, t) => sum + t.amount,
          0
        );
        if (totalTermAmount > parseFloat(formData.feeDetails.totalFee)) {
          newErrors[`termAmount${index}`] = `${formData.isHostelStudent ? "Hostel" : "Day Scholar"} Term amounts exceed total fee`;
        }
      });
    }
    if (!formData.isHostelStudent && !selectedRoute) {
      newErrors.busRoute = "Bus Route is required for day scholars";
    }
    if (
      formData.healthRecord.height &&
      parseFloat(formData.healthRecord.height) < 0
    ) {
      newErrors.height = "Height cannot be negative";
    }
    if (
      formData.healthRecord.weight &&
      parseFloat(formData.healthRecord.weight) < 0
    ) {
      newErrors.weight = "Weight cannot be negative";
    }
    if (formData.healthRecord.lastCheckupDate) {
      const checkupDate = new Date(formData.healthRecord.lastCheckupDate);
      const today = new Date();
      if (checkupDate > today) {
        newErrors.lastCheckupDate = "Last checkup date cannot be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddStudent = async (newStudent) => {
    try {
      const isDuplicate = students.some(
        (student) => student.admissionNo === newStudent.admissionNo && student._id !== editStudentId
      );
      if (isDuplicate) {
        toast.error("Student with this admission number already exists.");
        return;
      }

      const formDataToSend = new FormData();
      for (const key in newStudent) {
        if (key === "profilePicture" && newStudent[key] instanceof File) {
          formDataToSend.append(key, newStudent[key]);
        } else if (["address", "emergencyContact", "feeDetails", "busRoute", "parents", "healthRecord"].includes(key)) {
          formDataToSend.append(key, JSON.stringify(newStudent[key]));
        } else {
          formDataToSend.append(key, newStudent[key]);
        }
      }

      const config = getAuthConfig();
      let response;

      if (editStudentId) {
        response = await axios.put(
          `${BASE_URL}/api/students/${editStudentId}`,
          formDataToSend,
          config
        );
        setStudents(
          students.map((s) =>
            s._id === editStudentId ? response.data : s
          )
        );
        toast.success("Student updated successfully!");
      } else {
        response = await axios.post(
          `${BASE_URL}/api/students`,
          formDataToSend,
          config
        );
        setStudents([...students, response.data]);
        toast.success("Student added successfully!");
      }

      setShowForm(false);
      setEditStudentId(null);
      setSelectedStudent(null);
      setShowPassword(false);
      resetForm();
    } catch (error) {
      toast.error(
        `Error: ${error.response?.data?.message || "Failed to add/update student"}`
      );
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  };

  const handleEditStudent = async (student) => {
    try {
      const formattedDOB = student.dateOfBirth
        ? new Date(student.dateOfBirth).toISOString().split("T")[0]
        : "";
      const mergedAddress = {
        ...{ street: "", city: "", state: "", zipCode: "", country: "" },
        ...(student.address || {}),
      };
      const mergedBusRoute = {
        ...{
          routeNumber: "",
          pickupLocation: "",
          dropLocation: "",
          driverName: "",
          driverContact: "",
        },
        ...(student.busRoute || {}),
      };
      const mergedFeeDetails = {
        ...{
          totalFee: "",
          paymentOption: "Full Payment",
          terms: [],
          paymentHistory: [],
        },
        ...(student.feeDetails || {}),
      };
      const formattedTerms = (mergedFeeDetails.terms || []).map((term) => ({
        termName: term.termName || "Term",
        amount: term.amount || 0,
        dueDate: term.dueDate
          ? new Date(term.dueDate).toISOString().split("T")[0]
          : "",
        paidAmount: term.paidAmount || 0,
        status: term.status || "Pending",
      }));

      let healthRecordData = {
        height: "",
        weight: "",
        bloodGroup: "",
        allergies: "",
        medicalConditions: "",
        medications: "",
        lastCheckupDate: "",
      };
      try {
        const healthResponse = await axios.get(
          `${BASE_URL}/api/health-records/student/${student.admissionNo}`,
          getAuthConfig()
        );
        const apiHealthData = healthResponse.data || {};
        healthRecordData = {
          height: apiHealthData.height?.value || "",
          weight: apiHealthData.weight?.value || "",
          bloodGroup: apiHealthData.bloodGroup || "",
          allergies: Array.isArray(apiHealthData.allergies)
            ? apiHealthData.allergies.join(", ")
            : apiHealthData.allergies || "",
          medicalConditions: Array.isArray(apiHealthData.chronicConditions)
            ? apiHealthData.chronicConditions.map((cond) => cond.name || cond.condition || "").join(", ")
            : apiHealthData.chronicConditions || "",
          medications: Array.isArray(apiHealthData.medications)
            ? apiHealthData.medications.map((med) => med.name).join(", ")
            : apiHealthData.medications || "",
          lastCheckupDate: apiHealthData.lastCheckup?.date
            ? new Date(apiHealthData.lastCheckup.date).toISOString().split("T")[0]
            : "",
        };
      } catch (err) {
        if (err.response?.status !== 404) {
          toast.error(
            "Error fetching health record: " +
            (err.response?.data?.message || err.message)
          );
        }
      }

      const editedData = {
        ...student,
        dateOfBirth: formattedDOB,
        address: mergedAddress,
        busRoute: mergedBusRoute,
        feeDetails: { ...mergedFeeDetails, terms: formattedTerms },
        isHostelStudent: student.isHostelStudent || false,
        profilePicture: student.profilePicture || null,
        healthRecord: healthRecordData,
      };

      setFormData(editedData);
      setSelectedRoute(mergedBusRoute.routeNumber || "");
      setEditStudentId(student._id);
      setShowForm(true);
      setTermDetails(formattedTerms);
      setTermCount(formattedTerms.length);

      const totalFee = parseFloat(editedData.feeDetails.totalFee) || 0;
      const totalPaid = formattedTerms.reduce(
        (sum, term) => sum + (term.status === "Paid" ? term.amount : 0),
        0
      );
      if (editedData.isHostelStudent) {
        setRemainingHostelFee(totalFee - totalPaid);
        setRemainingDayScholarFee(0);
      } else {
        setRemainingDayScholarFee(totalFee - totalPaid);
        setRemainingHostelFee(0);
      }
    } catch (error) {
      toast.error(
        "Error loading student data: " +
        (error.response?.data?.message || error.message)
      );
    }
  };

  const handleDeleteStudent = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        await axios.delete(`${BASE_URL}/api/students/${id}`, getAuthConfig());
        setStudents(students.filter((student) => student._id !== id));
        toast.success("Student deleted successfully!");
      } catch (error) {
        toast.error(
          "Error deleting student: " +
          (error.response?.data?.message || error.message)
        );
      }
    }
  };

  const resetForm = () => {
    setFormData({
      admissionNo: "",
      rollNumber: "",
      name: "",
      password: "",
      dateOfBirth: "",
      gender: "Male",
      className: "",
      section: "",
      phone: "",
      email: "",
      address: { street: "", city: "", state: "", zipCode: "", country: "" },
      emergencyContact: { name: "", relation: "", phone: "" },
      feeDetails: {
        totalFee: "",
        paymentOption: "Full Payment",
        terms: [],
        paymentHistory: [],
      },
      busRoute: {
        routeNumber: "",
        pickupLocation: "",
        dropLocation: "",
        driverName: "",
        driverContact: "",
      },
      parents: [],
      profilePicture: null,
      isHostelStudent: false,
      healthRecord: {
        height: "",
        weight: "",
        bloodGroup: "",
        allergies: "",
        medicalConditions: "",
        medications: "",
        lastCheckupDate: "",
      },
    });
    setTermDetails([
      {
        termName: "Term 1",
        amount: 0,
        dueDate: "",
        paidAmount: 0,
        status: "Pending",
      },
    ]);
    setTermCount(1);
    setEditStudentId(null);
    setSelectedRoute("");
    setDriverInfo({
      driverName: "",
      phoneNumber: "",
      fromLocation: "",
      toLocation: "",
    });
    setErrors({});
    setRemainingDayScholarFee(0);
    setRemainingHostelFee(0);
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
  };

  const hostelStudents = students.filter(
    (student) =>
      student.isHostelStudent &&
      (selectedClassFilter ? student.className === selectedClassFilter : true) &&
      (searchQuery ? student.admissionNo.includes(searchQuery) : true)
  );

  const dayScholarStudents = students.filter(
    (student) =>
      !student.isHostelStudent &&
      (selectedClassFilter ? student.className === selectedClassFilter : true) &&
      (searchQuery ? student.admissionNo.includes(searchQuery) : true)
  );

  const indexOfLastStudentHostel = currentPageHostel * studentsPerPage;
  const indexOfFirstStudentHostel = indexOfLastStudentHostel - studentsPerPage;
  const currentHostelStudents = hostelStudents.slice(
    indexOfFirstStudentHostel,
    indexOfLastStudentHostel
  );
  const totalPagesHostel = Math.ceil(hostelStudents.length / studentsPerPage);

  const indexOfLastStudentDayScholar = currentPageDayScholar * studentsPerPage;
  const indexOfFirstStudentDayScholar = indexOfLastStudentDayScholar - studentsPerPage;
  const currentDayScholarStudents = dayScholarStudents.slice(
    indexOfFirstStudentDayScholar,
    indexOfLastStudentDayScholar
  );
  const totalPagesDayScholar = Math.ceil(dayScholarStudents.length / studentsPerPage);

  // Add this function inside the AddStudent component
  // Add this function inside the AddStudent component (before return)
const normalizeClassName = (className) => {
  if (!className) return "";

  let normalized = className.toString().trim();

  // Handle common variations: "10", "10th", "Grade 10", "10 Grade", "10st", etc.
  const match = normalized.match(/^(\d+)(?:st|nd|rd|th)?\s*(?:Grade|class)?$/i);
  
  if (match) {
    const num = parseInt(match[1], 10);
    
    let suffix = "th";
    if (num % 10 === 1 && num % 100 !== 11) suffix = "st";
    else if (num % 10 === 2 && num % 100 !== 12) suffix = "nd";
    else if (num % 10 === 3 && num % 100 !== 13) suffix = "rd";

    return `${num}${suffix} Grade`;
  }

  // Keep special classes as they are (UKG, LKG, etc.)
  const specialClasses = ["UKG", "LKG", "Nursery", "Pre-K", "KG"];
  if (specialClasses.some(cls => normalized.toUpperCase().includes(cls.toUpperCase()))) {
    return normalized;
  }

  return normalized; // fallback
};

  const paginate = (pageNumber, tableType) => {
    if (tableType === 'hostel') {
      setCurrentPageHostel(pageNumber);
    } else if (tableType === 'dayScholar') {
      setCurrentPageDayScholar(pageNumber);
    }
  };

  return (
    <>
      <style>{`
        .animate__animated {
          animation-duration: 0.8s;
        }
        .animate__fadeInDown {
          animation-name: fadeInDown;
        }
        .animate__fadeInUp {
          animation-name: fadeInUp;
        }
        .animate__zoomIn {
          animation-name: zoomIn;
        }
        .animate__delay-1s {
          animation-delay: 0.2s;
        }
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .card:hover {
          transform: translateY(-5px);
          transition: transform 0.3s ease;
        }
        .btn-success:hover, .btn-primary:hover {
          transform: scale(1.05);
          transition: transform 0.2s ease;
        }
        .input-group input:focus {
          box-shadow: 0 0 10px rgba(0,123,255,0.2);
          transition: all 0.3s ease;
        }
        @media (max-width: 576px) {
          .btn {
            padding: 0.25rem 0.5rem;
            font-size: 0.875rem;
          }
          .form-control, .table th, .table td {
            font-size: 0.875rem;
          }
          .card-body {
            padding: 1rem;
          }
        }
        @media (min-width: 1441px) {
          .container-fluid {
            max-width: 90%;
          }
          .table th, .table td {
            font-size: 1.1rem;
          }
        }
        .pagination {
          margin-top: 15px;
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          justify-content: center;
        }
        .pagination .page-link {
          padding: 6px 12px;
          font-size: 14px;
        }
        @media (max-width: 576px) {
          .pagination .page-link {
            padding: 4px 8px;
            font-size: 12px;
          }
          .showing-text {
            font-size: 12px;
            text-align: center;
            margin-bottom: 10px;
          }
        }

        .text-muted{
        color:rgb(137, 148, 184) !important;
        }

        .text-primary{
        color: #0000ff !important;
        }

        .bg-primary{
        background-color: #4c639b !important;
        }

        
          .btn-group .btn {
            padding: 4px 8px;
            font-size: 14px;
            flex: 1;
            min-width: 0;
            background: #99a8d6;
            color: #000;
            border: none;
          }

          .btn-group .btn:hover {
            background: #6e85d0;
            color: #000;
          }


      `}</style>

      <div
        className="container-fluid p-4"
        style={{ minHeight: "100vh", background: "transparent" }}
      >
        <div className="row mb-4 align-items-center">
          <div className="col">
            <h1 className="h3 fw-bold text-primary mb-0 animate__animated animate__fadeInDown">
              Student Management
            </h1>
            <p className="text-muted small animate__animated animate__fadeInDown animate__delay-1s">
              Manage student records efficiently
            </p>
          </div>
          <div className="col-auto">
            <button
              className="btn btn-primary shadow-sm d-flex align-items-center animate__animated animate__fadeInRight"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              <PlusCircle size={18} className="me-2" />
              Add Student
            </button>
          </div>
        </div>

        {!showForm && !selectedStudent && (
          <div className="row mb-4">
            <div className="col-12 col-md-6">
              <div className="input-group shadow-sm animate__animated animate__fadeInUp">
                <span className="input-group-text bg-white border-0">
                  <Search size={20} className="text-primary" />
                </span>
                <input
                  type="text"
                  className="form-control border-0 py-2"
                  placeholder="Search by admission number..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPageHostel(1);
                    setCurrentPageDayScholar(1);
                  }}
                  style={{ transition: "all 0.3s ease" }}
                  onFocus={(e) =>
                    (e.target.style.boxShadow = "0 0 10px rgba(0,123,255,0.2)")
                  }
                  onBlur={(e) => (e.target.style.boxShadow = "none")}
                />
              </div>
            </div>
            <div className="col-12 col-md-6 mt-3 mt-md-0">
              <select
                value={selectedClassFilter}
                onChange={(e) => {
                  setSelectedClassFilter(e.target.value);
                  setCurrentPageHostel(1);
                  setCurrentPageDayScholar(1);
                }}
                className="form-select shadow-sm"
              >
                <option value="">All Classes</option>
  {uniqueClasses.map((className) => (
    <option key={className} value={className}>
      {className}
    </option>
  ))}

              </select>
            </div>
          </div>
        )}

        {!showForm && !selectedStudent && (
          <>
            <div className="row animate__animated animate__zoomIn">
              <div className="col-12">
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-primary text-white">
                    <h3 className="mb-0">Hostel Students List</h3>
                  </div>
                  <div className="card-body p-0">
                    <StudentTable
                      students={currentHostelStudents}
                      onEdit={handleEditStudent}
                      onDelete={handleDeleteStudent}
                      onStudentSelect={handleStudentSelect}
                    />
                    {hostelStudents.length > 0 && (
                      <div className="d-flex justify-content-between align-items-center border-top p-3 bg-light">
                        <div className="showing-text">
                          <p className="mb-0 small text-muted">
                            Showing{" "}
                            <span className="fw-semibold">
                              {indexOfFirstStudentHostel + 1}
                            </span>{" "}
                            to{" "}
                            <span className="fw-semibold">
                              {Math.min(indexOfLastStudentHostel, hostelStudents.length)}
                            </span>{" "}
                            of{" "}
                            <span className="fw-semibold">
                              {hostelStudents.length}
                            </span>{" "}
                            results
                          </p>
                        </div>
                        <nav aria-label="Page navigation">
                          <ul className="pagination mb-0">
                            <li
                              className={`page-item ${currentPageHostel === 1 ? "disabled" : ""
                                }`}
                            >
                              <button
                                className="page-link"
                                onClick={() => paginate(currentPageHostel - 1, 'hostel')}
                              >
                                <span aria-hidden="true">«</span>
                              </button>
                            </li>
                            {[...Array(totalPagesHostel)].map((_, index) => (
                              <li
                                key={index}
                                className={`page-item ${currentPageHostel === index + 1 ? "active" : ""
                                  }`}
                              >
                                <button
                                  className="page-link"
                                  onClick={() => paginate(index + 1, 'hostel')}
                                >
                                  {index + 1}
                                </button>
                              </li>
                            ))}
                            <li
                              className={`page-item ${currentPageHostel === totalPagesHostel ? "disabled" : ""
                                }`}
                            >
                              <button
                                className="page-link"
                                onClick={() => paginate(currentPageHostel + 1, 'hostel')}
                              >
                                <span aria-hidden="true">»</span>
                              </button>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="row animate__animated animate__zoomIn">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-primary text-white">
                    <h3 className="mb-0">Day Scholar Students List</h3>
                  </div>
                  <div className="card-body p-0">
                    <StudentTable
                      students={currentDayScholarStudents}
                      onEdit={handleEditStudent}
                      onDelete={handleDeleteStudent}
                      onStudentSelect={handleStudentSelect}
                    />
                    {dayScholarStudents.length > 0 && (
                      <div className="d-flex justify-content-between align-items-center border-top p-3 bg-light">
                        <div className="showing-text">
                          <p className="mb-0 small text-muted">
                            Showing{" "}
                            <span className="fw-semibold">
                              {indexOfFirstStudentDayScholar + 1}
                            </span>{" "}
                            to{" "}
                            <span className="fw-semibold">
                              {Math.min(indexOfLastStudentDayScholar, dayScholarStudents.length)}
                            </span>{" "}
                            of{" "}
                            <span className="fw-semibold">
                              {dayScholarStudents.length}
                            </span>{" "}
                            results
                          </p>
                        </div>
                        <nav aria-label="Page navigation">
                          <ul className="pagination mb-0">
                            <li
                              className={`page-item ${currentPageDayScholar === 1 ? "disabled" : ""
                                }`}
                            >
                              <button
                                className="page-link"
                                onClick={() => paginate(currentPageDayScholar - 1, 'dayScholar')}
                              >
                                <span aria-hidden="true">«</span>
                              </button>
                            </li>
                            {[...Array(totalPagesDayScholar)].map((_, index) => (
                              <li
                                key={index}
                                className={`page-item ${currentPageDayScholar === index + 1 ? "active" : ""
                                  }`}
                              >
                                <button
                                  className="page-link"
                                  onClick={() => paginate(index + 1, 'dayScholar')}
                                >
                                  {index + 1}
                                </button>
                              </li>
                            ))}
                            <li
                              className={`page-item ${currentPageDayScholar === totalPagesDayScholar ? "disabled" : ""
                                }`}
                            >
                              <button
                                className="page-link"
                                onClick={() => paginate(currentPageDayScholar + 1, 'dayScholar')}
                              >
                                <span aria-hidden="true">»</span>
                              </button>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {showForm && (
          <div className="card shadow-lg border-0 animate__animated animate__zoomIn">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">{editStudentId ? "Edit Student" : "Add Student"}</h3>
            </div>
            <div className="card-body">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!validateForm()) {
                    toast.error("Please correct the form errors.");
                    return;
                  }
                  const newStudent = {
                    ...formData,
                    feeDetails: { ...formData.feeDetails, terms: termDetails },
                  };
                  handleAddStudent(newStudent);
                }}
              >
                <div className="row g-3">
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="admissionNo"
                      placeholder="Admission Number"
                      className="form-control"
                      value={formData.admissionNo}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.admissionNo && <p className="text-danger small">{errors.admissionNo}</p>}
                  </div>
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="rollNumber"
                      placeholder="Roll Number"
                      className="form-control"
                      value={formData.rollNumber}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.rollNumber && <p className="text-danger small">{errors.rollNumber}</p>}
                  </div>
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="name"
                      placeholder="Full Name"
                      className="form-control"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.name && <p className="text-danger small">{errors.name}</p>}
                  </div>
                  <div className="col-md-6">
                    <div className="input-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        className="form-control"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <i className="bi bi-eye-slash"></i>
                        ) : (
                          <i className="bi bi-eye"></i>
                        )}
                      </button>
                    </div>
                    {errors.password && <p className="text-danger small">{errors.password}</p>}
                  </div>
                  <div className="col-md-6">
                    <input
                      type="date"
                      name="dateOfBirth"
                      className="form-control"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.dateOfBirth && <p className="text-danger small">{errors.dateOfBirth}</p>}
                  </div>
                  <div className="col-md-6">
                    <select
                      name="gender"
                      className="form-control"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <select
                      name="className"
                      className="form-control"
                      value={formData.className}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Class</option>
                      {uniqueClasses.map((className) => (
                        <option key={className} value={className}>
                          {className}
                        </option>
                      ))}
                    </select>
                    {errors.className && <p className="text-danger small">{errors.className}</p>}
                  </div>
                  <div className="col-md-6">
                    <select
                      name="section"
                      className="form-control"
                      value={formData.section}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Section</option>
                      {sectionOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.section && <p className="text-danger small">{errors.section}</p>}
                  </div>
                  <div className="col-md-6">
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number"
                      className="form-control"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.phone && <p className="text-danger small">{errors.phone}</p>}
                  </div>
                  <div className="col-md-6">
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.email && <p className="text-danger small">{errors.email}</p>}
                  </div>
                  <div className="col-12">
                    <input
                      type="text"
                      name="address.street"
                      placeholder="Street"
                      className="form-control"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.street && <p className="text-danger small">{errors.street}</p>}
                  </div>
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="address.city"
                      placeholder="City"
                      className="form-control"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.city && <p className="text-danger small">{errors.city}</p>}
                  </div>
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="address.state"
                      placeholder="State"
                      className="form-control"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.state && <p className="text-danger small">{errors.state}</p>}
                  </div>
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="address.zipCode"
                      placeholder="ZIP Code"
                      className="form-control"
                      value={formData.address.zipCode}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.zipCode && <p className="text-danger small">{errors.zipCode}</p>}
                  </div>
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="address.country"
                      placeholder="Country"
                      className="form-control"
                      value={formData.address.country}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.country && <p className="text-danger small">{errors.country}</p>}
                  </div>
                  <div className="col-md-4">
                    <input
                      type="text"
                      name="emergencyContact.name"
                      placeholder="Emergency Contact Name"
                      className="form-control"
                      value={formData.emergencyContact.name}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.emergencyContactName && <p className="text-danger small">{errors.emergencyContactName}</p>}
                  </div>
                  <div className="col-md-4">
                    <input
                      type="text"
                      name="emergencyContact.relation"
                      placeholder="Relation"
                      className="form-control"
                      value={formData.emergencyContact.relation}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.emergencyContactRelation && <p className="text-danger small">{errors.emergencyContactRelation}</p>}
                  </div>
                  <div className="col-md-4">
                    <input
                      type="tel"
                      name="emergencyContact.phone"
                      placeholder="Emergency Contact Phone"
                      className="form-control"
                      value={formData.emergencyContact.phone}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.emergencyContactPhone && <p className="text-danger small">{errors.emergencyContactPhone}</p>}
                  </div>
                  <div className="col-md-6">
                    <div className="input-group">
                      <span className="input-group-text">₹</span>
                      <input
                        type="number"
                        name="feeDetails.totalFee"
                        placeholder={`${formData.isHostelStudent ? "Hostel" : "Day Scholar"} Total Fee`}
                        className="form-control"
                        value={formData.feeDetails.totalFee}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    {errors.totalFee && <p className="text-danger small">{errors.totalFee}</p>}
                  </div>
                  <div className="col-md-6">
                    <select
                      name="feeDetails.paymentOption"
                      className="form-control"
                      value={formData.feeDetails.paymentOption}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Full Payment">Full Payment</option>
                      <option value="Installments">Installments</option>
                    </select>
                  </div>
                  {formData.feeDetails.paymentOption === "Installments" && (
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h4>{formData.isHostelStudent ? "Hostel" : "Day Scholar"} Fee Term Breakdown</h4>
                        <select
                          value={termCount}
                          onChange={(e) => setTermCount(parseInt(e.target.value))}
                          className="form-select"
                          style={{ width: "80px" }}
                        >
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ))}
                        </select>
                      </div>
                      {termDetails.map((term, index) => {
                        const today = new Date().toISOString().split("T")[0];
                        let minDate =
                          index === 0
                            ? today
                            : termDetails[index - 1].dueDate
                              ? new Date(termDetails[index - 1].dueDate)
                                .toISOString()
                                .split("T")[0] < today
                                ? today
                                : new Date(
                                  new Date(
                                    termDetails[index - 1].dueDate
                                  ).getTime() + 86400000
                                )
                                  .toISOString()
                                  .split("T")[0]
                              : today;
                        const isPreviousPaid =
                          index === 0 || termDetails[index - 1].status === "Paid";
                        const isPaid = term.status === "Paid";

                        return (
                          <div key={index} className="row g-3 mb-3">
                            <div className="col-md-3">
                              <input
                                type="text"
                                value={term.termName}
                                onChange={(e) =>
                                  handleTermChange(index, "termName", e.target.value)
                                }
                                className="form-control"
                                required
                              />
                              {errors[`termName${index}`] && (
                                <p className="text-danger small">{errors[`termName${index}`]}</p>
                              )}
                            </div>
                            <div className="col-md-3">
                              <input
                                type="number"
                                value={term.amount}
                                onChange={(e) =>
                                  handleTermChange(index, "amount", e.target.value)
                                }
                                className="form-control"
                                required
                                min="0"
                                step="0.01"
                              />
                              {errors[`termAmount${index}`] && (
                                <p className="text-danger small">{errors[`termAmount${index}`]}</p>
                              )}
                            </div>
                            <div className="col-md-3">
                              <input
                                type="date"
                                value={term.dueDate}
                                onChange={(e) =>
                                  handleTermChange(index, "dueDate", e.target.value)
                                }
                                className="form-control"
                                min={minDate}
                                disabled={isPaid}
                                required={!isPaid}
                              />
                              {errors[`termDueDate${index}`] && (
                                <p className="text-danger small">{errors[`termDueDate${index}`]}</p>
                              )}
                            </div>
                            <div className="col-md-3">
                              <select
                                value={term.status}
                                onChange={(e) =>
                                  handleTermChange(index, "status", e.target.value)
                                }
                                className="form-control"
                                required
                              >
                                <option value="Pending">Pending</option>
                                {isPreviousPaid && (
                                  <option value="Paid">Paid</option>
                                )}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                      <p className="fw-bold">
                        Remaining {formData.isHostelStudent ? "Hostel" : "Day Scholar"} Fee: ₹
                        {formData.isHostelStudent ? remainingHostelFee : remainingDayScholarFee}
                      </p>
                      {errors.remainingFee && <p className="text-danger small">{errors.remainingFee}</p>}
                    </div>
                  )}
                  {!formData.isHostelStudent && (
                    <div className="col-12">
                      <h4>Bus Route (Day Scholars Only)</h4>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <select
                            value={selectedRoute}
                            onChange={(e) => {
                              setSelectedRoute(e.target.value);
                              setErrors((prev) => ({
                                ...prev,
                                busRoute: e.target.value
                                  ? ""
                                  : "Bus Route is required for day scholars",
                              }));
                            }}
                            className="form-control"
                            required
                          >
                            <option value="">Select Route</option>
                            {busRoutes.map((bus) => (
                              <option key={bus.busNumber} value={bus.busNumber}>
                                {bus.busNumber}
                              </option>
                            ))}
                          </select>
                          {errors.busRoute && <p className="text-danger small">{errors.busRoute}</p>}
                        </div>
                        <div className="col-md-6">
                          <input
                            type="text"
                            value={driverInfo.driverName}
                            className="form-control"
                            readOnly
                            placeholder="Driver Name"
                          />
                        </div>
                        <div className="col-md-6">
                          <input
                            type="text"
                            value={driverInfo.phoneNumber}
                            className="form-control"
                            readOnly
                            placeholder="Driver Contact"
                          />
                        </div>
                        <div className="col-md-6">
                          <input
                            type="text"
                            value={`${driverInfo.fromLocation} to ${driverInfo.toLocation}`}
                            className="form-control"
                            readOnly
                            placeholder="Route Details"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="col-12">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        name="isHostelStudent"
                        className="form-check-input"
                        checked={formData.isHostelStudent}
                        onChange={handleInputChange}
                        id="isHostelStudent"
                      />
                      <label className="form-check-label" htmlFor="isHostelStudent">
                        Hostel Student
                      </label>
                    </div>
                  </div>
                  <div className="col-12 mt-4">
                    <h4>Health Record</h4>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <input
                          type="number"
                          name="height"
                          placeholder="Height (cm)"
                          className="form-control"
                          value={formData.healthRecord.height}
                          onChange={handleHealthChange}
                          min="0"
                          step="0.1"
                        />
                        {errors.height && <p className="text-danger small">{errors.height}</p>}
                      </div>
                      <div className="col-md-4">
                        <input
                          type="number"
                          name="weight"
                          placeholder="Weight (kg)"
                          className="form-control"
                          value={formData.healthRecord.weight}
                          onChange={handleHealthChange}
                          min="0"
                          step="0.1"
                        />
                        {errors.weight && <p className="text-danger small">{errors.weight}</p>}
                      </div>
                      <div className="col-md-4">
                        <select
                          name="bloodGroup"
                          className="form-control"
                          value={formData.healthRecord.bloodGroup}
                          onChange={handleHealthChange}
                        >
                          <option value="">Select Blood Group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>
                      <div className="col-12">
                        <input
                          type="text"
                          name="allergies"
                          placeholder="Allergies (comma-separated)"
                          className="form-control"
                          value={formData.healthRecord.allergies}
                          onChange={handleHealthChange}
                        />
                      </div>
                      <div className="col-12">
                        <input
                          type="text"
                          name="medicalConditions"
                          placeholder="Medical Conditions (comma-separated)"
                          className="form-control"
                          value={formData.healthRecord.medicalConditions}
                          onChange={handleHealthChange}
                        />
                      </div>
                      <div className="col-12">
                        <input
                          type="text"
                          name="medications"
                          placeholder="Medications (comma-separated)"
                          className="form-control"
                          value={formData.healthRecord.medications}
                          onChange={handleHealthChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <input
                          type="date"
                          name="lastCheckupDate"
                          className="form-control"
                          value={formData.healthRecord.lastCheckupDate}
                          onChange={handleHealthChange}
                          max={new Date().toISOString().split("T")[0]}
                        />
                        {errors.lastCheckupDate && (
                          <p className="text-danger small">{errors.lastCheckupDate}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-group">
                      <label>Profile Picture</label>
                      <input
                        type="file"
                        name="profilePicture"
                        className="form-control"
                        accept="image/*"
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-end mt-4 gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowForm(false);
                      setEditStudentId(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editStudentId ? "Update Student" : "Add Student"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedStudent && !showForm && (
          <div className="card shadow-lg border-0 animate__animated animate__zoomIn">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Student Details</h3>
              <button
                className="btn btn-light btn-sm"
                onClick={() => setSelectedStudent(null)}
              >
                Close
              </button>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 text-center">
                  <img
                    className="rounded-circle border shadow-sm mb-3"
                    style={{ width: "150px", height: "150px", objectFit: "cover" }}
                    src={
                      selectedStudent.profilePicture
                        ? `${process.env.REACT_APP_API_URL}/Uploads/${selectedStudent.profilePicture}`
                        : "/api/placeholder/150/150"
                    }
                    alt={selectedStudent.name}
                  />
                  <h4>{selectedStudent.name}</h4>
                  <p className="text-muted">{selectedStudent.admissionNo}</p>
                </div>
                <div className="col-md-8">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <strong>Class & Section:</strong>{" "}
                      {selectedStudent.className} - {selectedStudent.section}
                    </div>
                    <div className="col-md-6">
                      <strong>Type:</strong>{" "}
                      {selectedStudent.isHostelStudent ? "Hostel" : "Day Scholar"}
                    </div>
                    <div className="col-md-6">
                      <strong>Email:</strong> {selectedStudent.email}
                    </div>
                    <div className="col-md-6">
                      <strong>Phone:</strong> {selectedStudent.phone}
                    </div>
                    <div className="col-12">
                      <strong>Address:</strong>{" "}
                      {selectedStudent.address.street}, {selectedStudent.address.city},{" "}
                      {selectedStudent.address.state}, {selectedStudent.address.zipCode},{" "}
                      {selectedStudent.address.country}
                    </div>
                    <div className="col-md-6">
                      <strong>Date of Birth:</strong>{" "}
                      {new Date(selectedStudent.dateOfBirth).toLocaleDateString()}
                    </div>
                    <div className="col-md-6">
                      <strong>Gender:</strong> {selectedStudent.gender}
                    </div>
                    <div className="col-12">
                      <strong>Emergency Contact:</strong>{" "}
                      {selectedStudent.emergencyContact.name} (
                      {selectedStudent.emergencyContact.relation}) -{" "}
                      {selectedStudent.emergencyContact.phone}
                    </div>
                    <div className="col-12">
                      <strong>Total Fee:</strong> ₹
                      {selectedStudent.feeDetails.totalFee}
                    </div>
                    {selectedStudent.feeDetails.paymentOption === "Installments" && (
                      <div className="col-12">
                        <strong>Fee Terms:</strong>
                        <ul>
                          {selectedStudent.feeDetails.terms.map((term, index) => (
                            <li key={index}>
                              {term.termName}: ₹{term.amount} (
                              {term.status}, Due:{" "}
                              {term.dueDate
                                ? new Date(term.dueDate).toLocaleDateString()
                                : "N/A"}
                              )
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {!selectedStudent.isHostelStudent && (
                      <div className="col-12">
                        <strong>Bus Route:</strong>{" "}
                        {selectedStudent.busRoute.routeNumber} (
                        {selectedStudent.busRoute.pickupLocation} to{" "}
                        {selectedStudent.busRoute.dropLocation})
                      </div>
                    )}
                    <div className="col-12 mt-3">
                      <h5>Health Record</h5>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <strong>Height:</strong>{" "}
                          {selectedStudent.healthRecord?.height || "N/A"} cm
                        </div>
                        <div className="col-md-6">
                          <strong>Weight:</strong>{" "}
                          {selectedStudent.healthRecord?.weight || "N/A"} kg
                        </div>
                        <div className="col-md-6">
                          <strong>Blood Group:</strong>{" "}
                          {selectedStudent.healthRecord?.bloodGroup || "N/A"}
                        </div>
                        <div className="col-12">
                          <strong>Allergies:</strong>{" "}
                          {selectedStudent.healthRecord?.allergies || "None"}
                        </div>
                        <div className="col-12">
                          <strong>Medical Conditions:</strong>{" "}
                          {selectedStudent.healthRecord?.medicalConditions || "None"}
                        </div>
                        <div className="col-12">
                          <strong>Medications:</strong>{" "}
                          {selectedStudent.healthRecord?.medications || "None"}
                        </div>
                        <div className="col-md-6">
                          <strong>Last Checkup:</strong>{" "}
                          {selectedStudent.healthRecord?.lastCheckupDate
                            ? new Date(
                              selectedStudent.healthRecord.lastCheckupDate
                            ).toLocaleDateString()
                            : "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AddStudent;
