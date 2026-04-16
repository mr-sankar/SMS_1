import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import "animate.css";
import { FaTimes } from "react-icons/fa";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("Please log in to access this feature");
    throw new Error("No token found");
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const EditStudentModal = ({ show, student, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    admissionNo: "",
    rollNumber: "",
    name: "",
    dorm: "",
    password: "",
    dateOfBirth: "",
    gender: "Male",
    className: "",
    section: "",
    phone: "",
    email: "",
    address: { street: "", city: "", state: "", zipCode: "", country: "" },
    emergencyContact: { name: "", relation: "", phone: "" },
    feeDetails: { totalFee: "", paymentOption: "Full Payment", terms: [], paymentHistory: [] },
    busRoute: { routeNumber: "", pickupLocation: "", dropLocation: "", driverName: "", driverContact: "" },
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
    behavioralRecords: [],
    parents: [], // Added parents field
    profilePicture: null,
  });
  const [termDetails, setTermDetails] = useState([]);
  const [termCount, setTermCount] = useState(1);
  const [busRoutes, setBusRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState("");
  const [driverInfo, setDriverInfo] = useState({
    driverName: "",
    phoneNumber: "",
    fromLocation: "",
    toLocation: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
  const sectionOptions = ["A", "B", "C", "D", "E"];

  useEffect(() => {
    // console.log("Student prop:", student);
    if (student) {
      const formattedDOB = student.dateOfBirth
        ? new Date(student.dateOfBirth).toISOString().split("T")[0]
        : "";
      const mergedAddress = { ...{ street: "", city: "", state: "", zipCode: "", country: "" }, ...(student.address || {}) };
      const mergedBusRoute = { ...{ routeNumber: "", pickupLocation: "", dropLocation: "", driverName: "", driverContact: "" }, ...(student.busRoute || {}) };
      const mergedFeeDetails = { ...{ totalFee: "", paymentOption: "Full Payment", terms: [], paymentHistory: [] }, ...(student.feeDetails || {}) };
      const formattedTerms = (mergedFeeDetails.terms || []).map((term) => ({
        termName: term.termName || "Term",
        amount: term.amount || 0,
        dueDate: term.dueDate ? new Date(term.dueDate).toISOString().split("T")[0] : "",
        paidAmount: term.paidAmount || 0,
        status: term.status || "Pending",
      }));

      // Fetch health record
      const fetchHealthRecord = async () => {
        try {
          const healthResponse = await axios.get(
            `${BASE_URL}/api/health-records/student/${student.admissionNo}`,
            getAuthConfig()
          );
          const healthData = healthResponse.data || {};
          setFormData({
            admissionNo: student.admissionNo || "",
            rollNumber: student.rollNumber || "",
            name: student.name || "",
            dorm: student.dorm || "",
            password: "",
            dateOfBirth: formattedDOB,
            gender: student.gender || "Male",
            className: student.className || "",
            section: student.section || "",
            phone: student.phone || "",
            email: student.email || "",
            address: mergedAddress,
            emergencyContact: student.emergencyContact || { name: "", relation: "", phone: "" },
            feeDetails: mergedFeeDetails,
            busRoute: mergedBusRoute,
            isHostelStudent: student.isHostelStudent || false,
            healthRecord: {
              height: healthData.height?.value || "",
              weight: healthData.weight?.value || "",
              bloodGroup: healthData.bloodGroup || "",
              allergies: healthData.allergies?.[0] || "",
              medicalConditions: healthData.chronicConditions?.[0]?.condition || "",
              medications: healthData.medications?.[0]?.name || "",
              lastCheckupDate: healthData.lastCheckup?.date
                ? new Date(healthData.lastCheckup.date).toISOString().split("T")[0]
                : "",
            },
            behavioralRecords: student.behavioralRecords || [],
            parents: student.parents || [], // Initialize parents
            profilePicture: null,
          });
          setTermDetails(formattedTerms);
          setTermCount(formattedTerms.length || 1);
          setSelectedRoute(mergedBusRoute.routeNumber || "");
          setDriverInfo({
            driverName: mergedBusRoute.driverName || "",
            phoneNumber: mergedBusRoute.driverContact || "",
            fromLocation: mergedBusRoute.pickupLocation || "",
            toLocation: mergedBusRoute.dropLocation || "",
          });
        } catch (error) {
          toast.error("Error fetching health record: " + (error.response?.data?.message || error.message));
          setFormData({
            admissionNo: student.admissionNo || "",
            rollNumber: student.rollNumber || "",
            name: student.name || "",
            dorm: student.dorm || "",
            password: "",
            dateOfBirth: formattedDOB,
            gender: student.gender || "Male",
            className: student.className || "",
            section: student.section || "",
            phone: student.phone || "",
            email: student.email || "",
            address: mergedAddress,
            emergencyContact: student.emergencyContact || { name: "", relation: "", phone: "" },
            feeDetails: mergedFeeDetails,
            busRoute: mergedBusRoute,
            isHostelStudent: student.isHostelStudent || false,
            behavioralRecords: student.behavioralRecords || [],
            parents: student.parents || [], // Initialize parents
            profilePicture: null,
          });
          setTermDetails(formattedTerms);
          setTermCount(formattedTerms.length || 1);
          setSelectedRoute(mergedBusRoute.routeNumber || "");
        }
      };
      fetchHealthRecord();

      // Fetch bus routes
      const fetchBusRoutes = async () => {
        try {
          const response = await axios.get(`${BASE_URL}/driver-profiles`, getAuthConfig());
          setBusRoutes(response.data);
        } catch (error) {
          toast.error("Error fetching bus routes: " + (error.response?.data?.message || error.message));
        }
      };
      fetchBusRoutes();
    }
  }, [student]);

  useEffect(() => {
    if (selectedRoute && !formData.isHostelStudent) {
      const selectedDriver = busRoutes.find((bus) => bus.busNumber === selectedRoute);
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
    }
  }, [selectedRoute, busRoutes, formData.isHostelStudent]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    let newErrors = { ...errors };

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
        ...(name === "isHostelStudent" && checked
          ? { busRoute: { routeNumber: "", pickupLocation: "", dropLocation: "", driverName: "", driverContact: "" } }
          : {}),
      }));
      if (name === "isHostelStudent" && checked) setSelectedRoute("");
      return;
    }

    if (type === "file") {
      setFormData((prev) => ({
        ...prev,
        profilePicture: files[0] || null,
      }));
      return;
    }

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (name === "dateOfBirth" || name === "className") {
      const age = name === "dateOfBirth" ? calculateAge(value) : calculateAge(formData.dateOfBirth);
      const className = name === "className" ? value : formData.className;
      if (className && classAgeLimits[className]) {
        const { min, max } = classAgeLimits[className];
        if (age < min || age > max) {
          newErrors.className = `Age ${age} is not suitable for ${className}`;
        } else {
          delete newErrors.className;
        }
      }
    }
    if (name === "feeDetails.totalFee") {
      const totalFee = parseFloat(value);
      if (isNaN(totalFee) || totalFee < 0) {
        newErrors.totalFee = "Total fee must be a non-negative number";
      } else {
        delete newErrors.totalFee;
      }
    }
    setErrors(newErrors);
  };

  const handleHealthChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      healthRecord: { ...prev.healthRecord, [name]: value },
    }));
  };

  const handleTermChange = (index, field, value) => {
    const updatedTerms = [...termDetails];
    updatedTerms[index][field] = field === "amount" ? parseFloat(value) || 0 : value;
    setTermDetails(updatedTerms);
    validateTerms(updatedTerms);
  };

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validateTerms = (terms) => {
    if (formData.feeDetails.paymentOption === "Installments") {
      const totalFee = parseFloat(formData.feeDetails.totalFee) || 0;
      const termTotal = terms.reduce((sum, term) => sum + (parseFloat(term.amount) || 0), 0);
      if (Math.abs(termTotal - totalFee) > 0.01) {
        setErrors((prev) => ({
          ...prev,
          terms: `Sum of term amounts (${termTotal}) must equal total fee (${totalFee})`,
        }));
      } else {
        setErrors((prev) => {
          const { terms, ...rest } = prev;
          return rest;
        });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!/^\d{3}$/.test(formData.admissionNo)) newErrors.admissionNo = "Admission number must be 3 digits.";
    if (!/^\d+$/.test(formData.rollNumber)) newErrors.rollNumber = "Roll number must be numeric.";
    if (!/^[A-Za-z ]{3,50}$/.test(formData.name)) newErrors.name = "Name must be letters and spaces.";
    if (formData.password && !/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.password))
      newErrors.password = "Password must be complex.";
    if (!/^[6-9]\d{9}$/.test(formData.phone)) newErrors.phone = "Phone must be 10 digits starting with 6-9.";
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z.-]+\.[A-Za-z]{2,4}$/.test(formData.email))
      newErrors.email = "Invalid email format.";
    const totalFee = parseFloat(formData.feeDetails.totalFee);
    if (isNaN(totalFee) || totalFee < 0) newErrors.totalFee = "Total fee must be a non-negative number.";
    if (formData.feeDetails.paymentOption === "Installments" && (!termDetails.length || errors.terms)) {
      newErrors.terms = errors.terms || "Installment terms must be defined and sum to total fee.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validateForm()) {
      toast.error("Please correct the form errors.");
      setLoading(false);
      return;
    }

    const { profilePicture, ...studentData } = formData;
    studentData.feeDetails = { ...studentData.feeDetails };

    if (studentData.feeDetails.paymentOption === "Full Payment") {
      studentData.feeDetails.terms = [
        {
          termName: "Full Payment",
          amount: parseFloat(studentData.feeDetails.totalFee) || 0,
          dueDate: new Date().toISOString().split("T")[0],
          paidAmount: studentData.feeDetails.terms?.[0]?.paidAmount || 0,
          status: studentData.feeDetails.terms?.[0]?.status || "Pending",
        },
      ];
    } else {
      studentData.feeDetails.terms = termDetails;
    }

    // Ensure behavioralRecords and parents are valid arrays
    studentData.behavioralRecords = Array.isArray(studentData.behavioralRecords)
      ? studentData.behavioralRecords.filter((id) => id && /^[0-9a-fA-F]{24}$/.test(id))
      : [];
    studentData.parents = Array.isArray(studentData.parents)
      ? studentData.parents.filter((id) => id && /^[0-9a-fA-F]{24}$/.test(id))
      : [];

    // Structure health record data
    if (Object.values(studentData.healthRecord).some((v) => v)) {
      studentData.healthRecord = {
        height: studentData.healthRecord.height || undefined,
        weight: studentData.healthRecord.weight || undefined,
        bloodGroup: studentData.healthRecord.bloodGroup || undefined,
        allergies: studentData.healthRecord.allergies ? [studentData.healthRecord.allergies] : undefined,
        medicalConditions: studentData.healthRecord.medicalConditions || undefined,
        medications: studentData.healthRecord.medications || undefined,
        lastCheckupDate: studentData.healthRecord.lastCheckupDate || undefined,
      };
    } else {
      delete studentData.healthRecord;
    }

    // Prepare FormData
    const formDataToSend = new FormData();
    if (profilePicture) {
      formDataToSend.append("profilePicture", profilePicture);
    }
    // Append fields, handling arrays and objects appropriately
    Object.entries(studentData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // Send arrays as JSON string to ensure backend can parse
        formDataToSend.append(key, JSON.stringify(value));
      } else if (typeof value === "object" && value !== null) {
        // Send objects as JSON string
        formDataToSend.append(key, JSON.stringify(value));
      } else {
        // Send primitives directly
        formDataToSend.append(key, value);
      }
    });

    try {
      await axios.put(
        `${BASE_URL}/api/students/${student._id}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success("Student updated successfully");
      onUpdate();
      onClose();
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error("Failed to update student: " + message);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else if (error.response?.status === 400 && message.includes("already exists")) {
        toast.error(message);
      } else if (error.response?.status === 403) {
        toast.error("Access denied. You do not have permission to update this student.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="modal show d-block animate__animated animate__fadeIn"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Edit Student</h5>
            <button type="button" className="btn-close" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              {/* Key Identifiers */}
              <div className="mb-3">
                <label className="form-label fw-bold">Admission Number</label>
                <input
                  type="text"
                  name="admissionNo"
                  value={formData.admissionNo}
                  className="form-control"
                  disabled
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Roll Number</label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  className={`form-control ${errors.rollNumber ? "is-invalid" : ""}`}
                  required
                />
                {errors.rollNumber && <div className="invalid-feedback">{errors.rollNumber}</div>}
              </div>

              {/* Basic Information */}
              <div className="mb-3">
                <label className="form-label fw-bold">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`form-control ${errors.name ? "is-invalid" : ""}`}
                  required
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Password (leave blank to keep unchanged)</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-control ${errors.password ? "is-invalid" : ""}`}
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>
              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="form-select">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Class</label>
                  <select
                    name="className"
                    value={formData.className}
                    onChange={handleChange}
                    className={`form-select ${errors.className ? "is-invalid" : ""}`}
                    required
                  >
                    <option value="">Select Class</option>
                    {Object.keys(classAgeLimits).map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                  {errors.className && <div className="invalid-feedback">{errors.className}</div>}
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Section</label>
                  <select name="section" value={formData.section} onChange={handleChange} className="form-select" required>
                    <option value="">Select Section</option>
                    {sectionOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <div className="form-check mt-4">
                    <input
                      type="checkbox"
                      name="isHostelStudent"
                      checked={formData.isHostelStudent}
                      onChange={handleChange}
                      className="form-check-input"
                      id="isHostelStudent"
                    />
                    <label className="form-check-label fw-bold" htmlFor="isHostelStudent">Hostel Student</label>
                  </div>
                </div>
              </div>

              {/* Profile Picture */}
              <div className="mb-3">
                <label className="form-label fw-bold">Profile Picture</label>
                <input
                  type="file"
                  name="profilePicture"
                  onChange={handleChange}
                  className="form-control"
                  accept="image/*"
                />
              </div>

              {/* Contact Information */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                    required
                  />
                  {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    required
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>
              </div>

              {/* Address */}
              <div className="mb-3">
                <label className="form-label fw-bold">Address</label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  className="form-control mb-2"
                  placeholder="Street"
                  required
                />
                <div className="row g-3">
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="City"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="State"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="address.zipCode"
                      value={formData.address.zipCode}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="ZIP/Postal Code"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="address.country"
                      value={formData.address.country}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Country"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="mb-3">
                <label className="form-label fw-bold">Emergency Contact</label>
                <div className="row g-3">
                  <div className="col-md-4">
                    <input
                      type="text"
                      name="emergencyContact.name"
                      value={formData.emergencyContact.name}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Name"
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      type="text"
                      name="emergencyContact.relation"
                      value={formData.emergencyContact.relation}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Relation"
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      type="tel"
                      name="emergencyContact.phone"
                      value={formData.emergencyContact.phone}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Phone"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Fee Details */}
              <div className="mb-3">
                <label className="form-label fw-bold">Fee Details</label>
                <div className="row g-3">
                  <div className="col-md-6">
                    <input
                      type="number"
                      name="feeDetails.totalFee"
                      value={formData.feeDetails.totalFee}
                      onChange={handleChange}
                      className={`form-control ${errors.totalFee ? "is-invalid" : ""}`}
                      placeholder="Total Fee"
                      required
                      min="0"
                    />
                    {errors.totalFee && <div className="invalid-feedback">{errors.totalFee}</div>}
                  </div>
                  <div className="col-md-6">
                    <select
                      name="feeDetails.paymentOption"
                      value={formData.feeDetails.paymentOption}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="Full Payment">Full Payment</option>
                      <option value="Installments">Installments</option>
                    </select>
                  </div>
                </div>
                {formData.feeDetails.paymentOption === "Installments" && (
                  <div className="mt-3">
                    <label className="form-label">Number of Terms</label>
                    <select
                      value={termCount}
                      onChange={(e) => setTermCount(parseInt(e.target.value))}
                      className="form-select mb-2"
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                    {termDetails.map((term, index) => (
                      <div key={index} className="row g-3 mb-2">
                        <div className="col-md-3">
                          <input
                            type="text"
                            value={term.termName}
                            onChange={(e) => handleTermChange(index, "termName", e.target.value)}
                            className="form-control"
                            placeholder="Term Name"
                          />
                        </div>
                        <div className="col-md-3">
                          <input
                            type="number"
                            value={term.amount}
                            onChange={(e) => handleTermChange(index, "amount", e.target.value)}
                            className="form-control"
                            placeholder="Amount"
                            min="0"
                          />
                        </div>
                        <div className="col-md-3">
                          <input
                            type="date"
                            value={term.dueDate}
                            onChange={(e) => handleTermChange(index, "dueDate", e.target.value)}
                            className="form-control"
                          />
                        </div>
                        <div className="col-md-3">
                          <select
                            value={term.status}
                            onChange={(e) => handleTermChange(index, "status", e.target.value)}
                            className="form-select"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                          </select>
                        </div>
                      </div>
                    ))}
                    {errors.terms && <div className="text-danger">{errors.terms}</div>}
                  </div>
                )}
              </div>

              {/* Bus Route */}
              <div className={`mb-3 ${formData.isHostelStudent ? "opacity-50" : ""}`}>
                <label className="form-label fw-bold">Bus Route</label>
                <select
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                  className="form-control mb-2"
                  disabled={formData.isHostelStudent}
                >
                  <option value="">Select Route</option>
                  {busRoutes.map((bus) => (
                    <option key={bus.busNumber} value={bus.busNumber}>{bus.busNumber}</option>
                  ))}
                </select>
                <input type="text" value={driverInfo.driverName} className="form-control mb-2" readOnly placeholder="Driver Name" />
                <input type="text" value={driverInfo.phoneNumber} className="form-control mb-2" readOnly placeholder="Driver Contact" />
                <input type="text" value={driverInfo.fromLocation} className="form-control mb-2" readOnly placeholder="Pickup Location" />
                <input type="text" value={driverInfo.toLocation} className="form-control" readOnly placeholder="Drop Location" />
              </div>

              {/* Health Record */}
              <div className="mb-3">
                <label className="form-label fw-bold">Health Record</label>
                <div className="row g-3">
                  <div className="col-md-4">
                    <input
                      type="number"
                      name="height"
                      value={formData.healthRecord.height}
                      onChange={handleHealthChange}
                      className="form-control"
                      placeholder="Height (cm)"
                      min="0"
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      type="number"
                      name="weight"
                      value={formData.healthRecord.weight}
                      onChange={handleHealthChange}
                      className="form-control"
                      placeholder="Weight (kg)"
                      min="0"
                    />
                  </div>
                  <div className="col-md-4">
                    <select
                      name="bloodGroup"
                      value={formData.healthRecord.bloodGroup}
                      onChange={handleHealthChange}
                      className="form-select"
                    >
                      <option value="">Blood Group</option>
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
                  <div className="col-md-6">
                    <textarea
                      name="allergies"
                      value={formData.healthRecord.allergies}
                      onChange={handleHealthChange}
                      className="form-control"
                      placeholder="Allergies"
                      rows="2"
                    />
                  </div>
                  <div className="col-md-6">
                    <textarea
                      name="medicalConditions"
                      value={formData.healthRecord.medicalConditions}
                      onChange={handleHealthChange}
                      className="form-control"
                      placeholder="Medical Conditions"
                      rows="2"
                    />
                  </div>
                  <div className="col-md-6">
                    <textarea
                      name="medications"
                      value={formData.healthRecord.medications}
                      onChange={handleHealthChange}
                      className="form-control"
                      placeholder="Medications"
                      rows="2"
                    />
                  </div>
                  <div className="col-md-6">
                    <input
                      type="date"
                      name="lastCheckupDate"
                      value={formData.healthRecord.lastCheckupDate}
                      onChange={handleHealthChange}
                      className="form-control"
                      placeholder="Last Checkup Date"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditStudentModal;