"use client"

import axios from "axios"
import "bootstrap/dist/css/bootstrap.min.css"
import {
  AlertCircle,
  Edit,
  GraduationCap,
  PlusCircle,
  Search,
  Trash2,
  FileText,
  Download,
  Eye,
  Folder,
  FolderOpen,
} from "lucide-react"
import { useCallback, useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import html2pdf from "html2pdf.js"

// PayslipForm Component

const PayslipForm = ({ selectedTeacher, onSave, onClose }) => {
  const printRef = useRef();
  const [errors, setErrors] = useState({});
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [form, setForm] = useState({
    empId: "",
    empName: "",
    doj: "",
    bankName: "",
    accountNo: "",
    location: "",
    department: "",
    designation: "",
    panNo: "",
    epfNo: "",
    monthDays: "30",
    paidDays: "",
    basic: "",
    hra: "",
    conveyance: "",
    medical: "",
    bonus: "",
    pf: "",
    esi: "",
    ptax: "",
  });

  // const BASE_URL =
  //   process.env.NODE_ENV === "production"
  //     ? process.env.REACT_APP_API_DEPLOYED_URL
  //     : process.env.REACT_APP_API_URL;

  const BASE_URL = process.env.REACT_APP_API_URL;

  // Function to calculate days in the selected month
  const getDaysInMonth = (month, year) => {
    if (!month || !year) return "30";
    const monthIndex = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ].indexOf(month);
    if (monthIndex === -1) return "30";
    const yearNum = Number.parseInt(year);
    if (month === "February") {
      const isLeap = (yearNum % 4 === 0 && yearNum % 100 !== 0) || yearNum % 400 === 0;
      return isLeap ? "29" : "28";
    }
    const daysInMonth = [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return daysInMonth[monthIndex].toString();
  };

  // Fetch present days for the selected teacher using teacherId
  const fetchPresentDays = async (teacherId, month, year) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }
      const monthIndex = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ].indexOf(month) + 1;
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      // Calculate total days in the selected month
      const totalWorkingDays = new Date(year, monthIndex, 0).getDate();
      let presentCount = 1;

      // Define holidays for the selected year
      const holidays = {
        2025: [
          "2025-01-26", // Republic Day
          "2025-03-14", // Holi
          "2025-04-10", // Good Friday
          "2025-04-14", // Ambedkar Jayanti
          "2025-08-15", // Independence Day
          "2025-10-02", // Gandhi Jayanti
          "2025-11-01", // Diwali
          "2025-12-25", // Christmas
        ],
      }[year] || [];

      for (let day = 1; day <= totalWorkingDays; day++) {
        const dateToFetch = `${year}-${String(monthIndex).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Skip Sundays and holidays
        const dateObj = new Date(dateToFetch);
        if (dateObj.getDay() === 0 || holidays.includes(dateToFetch)) {
          continue;
        }

        try {
          const res = await axios.get(
            `${BASE_URL}/api/attendance/fetch/${dateToFetch}`,
            config
          );
          if (res.data && res.data.attendanceRecords && res.data.attendanceRecords.length > 0) {
            const teacherRecord = res.data.attendanceRecords.find(
              (record) => record.teacherId === teacherId
            );
            if (teacherRecord && teacherRecord.status === 'Present') {
              presentCount++;
            }
          }
        } catch (err) {
          console.log(`No attendance data for ${dateToFetch}:`, err.response?.data?.message || err.message);
        }
      }

      if (presentCount === 0) {
        console.warn("No present days found for the selected teacher and period");
      }

      return presentCount.toString();
    } catch (error) {
      console.error("Error fetching present days:", error);
      toast.error("Error fetching attendance data");
      return "0";
    }
  };

  // Update monthDays and paidDays when month/year changes
  useEffect(() => {
    if (selectedMonth && selectedYear && selectedTeacher) {
      const days = getDaysInMonth(selectedMonth, selectedYear);
      const fetchAndUpdatePaidDays = async () => {
        const presentDays = await fetchPresentDays(selectedTeacher.teacherId, selectedMonth, selectedYear);
        setForm((prev) => ({
          ...prev,
          monthDays: days,
          paidDays: presentDays,
        }));
        setErrors((prev) => ({
          ...prev,
          monthDays: validateField("monthDays", days, { ...form, monthDays: days }),
          paidDays: validateField("paidDays", presentDays, { ...form, monthDays: days, paidDays: presentDays }),
        }));
      };
      fetchAndUpdatePaidDays();
    }
  }, [selectedMonth, selectedYear, selectedTeacher]);

  useEffect(() => {
    if (selectedTeacher) {
      const salary = Number.parseFloat(selectedTeacher.salary || 0);
      const monthDays = Number.parseInt(selectedMonth && selectedYear ? getDaysInMonth(selectedMonth, selectedYear) : 30);
      const paidDays = Number.parseInt(form.paidDays || monthDays);

      setForm((prev) => {
        // Corrected Percentages
        const perc = {
          basic: 0.5,
          hra: 0.4,
          conveyance: 0.2,
          medical: 0.2,
          bonus: 0.2,
          pf: 0.12,
          esi: 0.0325,
          ptax: 0.015,
        };

        // Full Basic Salary
        const fullBasic = salary * perc.basic;


        // Prorated Basic Salary based on paidDays
        const proratedBasic = monthDays > 0 ? Math.floor((fullBasic * paidDays) / monthDays) : 0;

        // Other components based on full basic salary (not prorated)
        const fullHRA = fullBasic * perc.hra;
        const fullConveyance = fullBasic * perc.conveyance;
        const fullMedical = fullBasic * perc.medical;
        const fullBonus = fullBasic * perc.bonus;
        const fullPF = fullBasic * perc.pf;
        const fullESI = fullBasic * perc.esi;
        const fullPTax = fullBasic * perc.ptax;

        return {
          ...prev,
          empId: selectedTeacher.teacherId || "",
          empName: selectedTeacher.name || "",
          doj: formatDate(selectedTeacher.joiningDate) || "",
          bankName: selectedTeacher.bankName || "",
          accountNo: selectedTeacher.bankAccountNumber || "",
          location: selectedTeacher.location || "",
          department:
            selectedTeacher.staffType === "Teaching"
              ? selectedTeacher.subject
              : selectedTeacher.designation || "",
          designation:
            selectedTeacher.staffType === "Teaching"
              ? "Teacher"
              : selectedTeacher.designation || "",
          panNo: selectedTeacher.panNumber || "",
          epfNo: `EPF${selectedTeacher.teacherId || ""}`,
          monthDays: monthDays.toString(),
          paidDays: paidDays.toString(),
          basic: proratedBasic.toString(),
          hra: Math.floor(fullHRA).toString(),
          conveyance: Math.floor(fullConveyance).toString(),
          medical: Math.floor(fullMedical).toString(),
          bonus: Math.floor(fullBonus).toString(),
          pf: Math.floor(fullPF).toString(),
          esi: Math.floor(fullESI).toString(),
          ptax: Math.floor(fullPTax).toString(),
        };
      });
    }
  }, [selectedTeacher, selectedMonth, selectedYear, form.paidDays]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const validations = {
    empId: { required: true, pattern: /^[A-Z0-9]{3,}$/, message: "Invalid Employee ID (min 3 alphanumeric)" },
    empName: { required: true, pattern: /^[A-Za-z\s]{2,}$/, message: "Invalid Name (min 2 letters)" },
    doj: { required: true, pattern: /^\d{4}-\d{2}-\d{2}$/, message: "Invalid Date (YYYY-MM-DD)" },
    bankName: { required: true, pattern: /^[A-Za-z\s]{2,}$/, message: "Invalid Bank Name" },
    accountNo: { required: true, pattern: /^\d{9,}$/, message: "Invalid Account Number (min 9 digits)" },
    location: { required: true, pattern: /^[A-Za-z\s]{2,}$/, message: "Invalid Location" },
    department: { required: true, pattern: /^[A-Za-z\s]{2,}$/, message: "Invalid Department" },
    designation: { required: true, pattern: /^[A-Za-z\s]{2,}$/, message: "Invalid Designation" },
    panNo: { required: true, pattern: /^[A-Z]{5}\d{4}[A-Z]$/, message: "Invalid PAN Number" },
    epfNo: { required: true, pattern: /^[A-Z0-9]{3,}$/, message: "Invalid EPF Number" },
    monthDays: { required: true, pattern: /^\d{1,2}$/, message: "Invalid Month Days", max: 31 },
    paidDays: { required: true, pattern: /^\d{1,2}$/, message: "Invalid Paid Days", max: form.monthDays },
    basic: { required: true, pattern: /^\d+$/, message: "Invalid Amount" },
    hra: { required: true, pattern: /^\d+$/, message: "Invalid Amount" },
    conveyance: { required: true, pattern: /^\d+$/, message: "Invalid Amount" },
    medical: { required: true, pattern: /^\d+$/, message: "Invalid Amount" },
    bonus: { required: true, pattern: /^\d+$/, message: "Invalid Amount" },
    pf: { required: true, pattern: /^\d+$/, message: "Invalid Amount" },
    esi: { required: true, pattern: /^\d+$/, message: "Invalid Amount" },
    ptax: { required: true, pattern: /^\d+$/, message: "Invalid Amount" },
  };

  const validateField = (name, value, formData = form) => {
    const rules = validations[name];

    if (rules.pattern && value && !rules.pattern.test(value)) return rules.message;
    if (rules.max && Number.parseInt(value) > Number.parseInt(rules.max)) return `Must be ≤ ${rules.max}`;
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(validations).forEach((key) => {
      const error = validateField(key, form[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const totalEarnings = ["basic", "hra", "conveyance", "medical", "bonus"].reduce(
    (sum, key) => sum + (Number.parseFloat(form[key]) || 0),
    0
  );

  const totalDeductions = ["pf", "esi", "ptax"].reduce(
    (sum, key) => sum + (Number.parseFloat(form[key]) || 0),
    0
  );

  const netPay = totalEarnings - totalDeductions;

  const convertToWords = (num) => {
    const a = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    if ((num = num.toString()).length > 9) return "Overflow";
    const n = ("000000000" + num).substr(-9).match(/(\d{2})(\d{2})(\d{2})(\d{3})/);
    if (!n) return "";
    let str = "";
    str += n[1] !== "00" ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + " Crore " : "";
    str += n[2] !== "00" ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + " Lakh " : "";
    str += n[3] !== "00" ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + " Thousand " : "";
    str += n[4] !== "000" ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + " Rupees " : "";
    return str.trim() + " Only";
  };

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to access this feature");
      throw new Error("No token found");
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    };
  };

  const handleGeneratePayslip = async () => {
    if (!selectedMonth || !selectedYear) {
      toast.error('Please select month and year');
      return;
    }

    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      toast.error('Please fix form errors before generating payslip');
      return;
    }

    setIsGenerating(true);

    try {
      // Check for existing payslip for the selected month and year
      const config = getAuthConfig();
      const response = await axios.get(
        `${BASE_URL}/api/teachers/${selectedTeacher._id}/payslips`,
        config
      );
      const existingPayslips = response.data.data || [];
      const duplicatePayslip = existingPayslips.find(
        (payslip) => payslip.month === selectedMonth && payslip.year === selectedYear
      );

      if (duplicatePayslip) {
        toast.error(`A payslip for ${selectedMonth} ${selectedYear} has already been generated.`);
        return;
      }

      // Proceed with payslip generation
      const element = printRef.current;
      const filename = `${form.empId}_salslip_${selectedMonth}_${selectedYear}.pdf`;
      const options = {
        margin: 0.5,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      };

      console.log('Generating PDF for:', form);
      const pdfBlob = await html2pdf().set(options).from(element).outputPdf('blob');

      const formData = new FormData();
      formData.append('month', selectedMonth);
      formData.append('year', selectedYear);
      formData.append('netPay', netPay.toFixed(2));
      formData.append('payslipData', JSON.stringify(form));
      formData.append('payslipPdf', new File([pdfBlob], filename, { type: 'application/pdf' }));

      console.log('Sending payslip data to backend:', {
        month: selectedMonth,
        year: selectedYear,
        netPay: netPay.toFixed(2),
        filename,
      });

      const saveResponse = await axios.post(
        `${BASE_URL}/api/teachers/${selectedTeacher._id}/payslips`,
        formData,
        config
      );

      const payslipData = {
        payslipId: saveResponse.data.data.payslipId,
        teacherId: selectedTeacher._id,
        teacherName: selectedTeacher.name,
        month: selectedMonth,
        year: selectedYear,
        filename: filename,
        generatedDate: new Date().toISOString(),
        payslipData: { ...form },
        netPay: netPay.toFixed(2),
      };

      console.log('Payslip saved successfully:', payslipData);
      onSave(payslipData);
      toast.success('Payslip generated and saved successfully!');
      onClose();
    } catch (error) {
      console.error('Error generating PDF:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error('Error generating payslip: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsGenerating(false);
    }
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="container my-4">
      <style>
        {`
          .custom-table th, .custom-table td {
            border: 1px solid black;
            font-size: 14px;
            padding: 6px;
          }
          .custom-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          input.form-control {
            font-size: 14px;
            padding: 2px 6px;
            height: auto;
          }
          .net-pay-box {
            border: 2px solid black;
            font-weight: bold;
            padding: 12px;
            margin-top: 12px;
            font-size: 18px;
            text-align: center;
            background-color: #fff;
          }
          .error-text {
            color: red;
            font-size: 12px;
            margin-top: 2px;
          }
          .form-control.is-invalid {
            border-color: red;
          }
          @media (max-width: 576px) {
            .custom-table th, .custom-table td {
              font-size: 12px;
              padding: 4px;
            }
            input.form-control {
              font-size: 12px;
            }
            .net-pay-box {
              font-size: 16px;
            }
          }
          .table-responsive {
            overflow-x: auto;
          }
        `}
      </style>

      <div className="row mb-3">
        <div className="col-md-4">
          <label className="form-label">Month *</label>
          <select
            className="form-control"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            required
          >
            <option value="">Select Month</option>
            {months.map((month, index) => (
              <option key={index} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Year *</label>
          <select
            className="form-control"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            required
          >
            <option value="">Select Year</option>
            {years.map((year, index) => (
              <option key={index} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4 d-flex align-items-end">
          <button className="btn btn-success me-2" onClick={handleGeneratePayslip} disabled={isGenerating}>
            <FileText size={16} className="me-1" />
            {isGenerating ? "Generating..." : "Generate Payslip"}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>

      <div ref={printRef} className="border p-4 bg-white shadow">
        <h3 className="text-center">SKILL BRIDGE</h3>
        <h4 className="text-center mb-4 fw-bold">
          PAY SLIP FOR THE MONTH OF {selectedMonth?.toUpperCase()}-{selectedYear}
        </h4>

        <div className="table-responsive">
          <table className="table table-sm table-borderless">
            <tbody>
              <tr>
                <td>
                  <strong>EMP ID:</strong>
                  <input
                    className={`form-control ${errors.empId ? "is-invalid" : ""}`}
                    name="empId"
                    value={form.empId}
                    onChange={handleChange}
                  />
                  {errors.empId && <div className="error-text">{errors.empId}</div>}
                </td>
                <td>
                  <strong>PAN:</strong>
                  <input
                    className={`form-control ${errors.panNo ? "is-invalid" : ""}`}
                    name="panNo"
                    value={form.panNo}
                    onChange={handleChange}
                  />
                  {errors.panNo && <div className="error-text">{errors.panNo}</div>}
                </td>
              </tr>
              <tr>
                <td>
                  <strong>EMP NAME:</strong>
                  <input
                    className={`form-control ${errors.empName ? "is-invalid" : ""}`}
                    name="empName"
                    value={form.empName}
                    onChange={handleChange}
                  />
                  {errors.empName && <div className="error-text">{errors.empName}</div>}
                </td>
                <td>
                  <strong>EPF No.:</strong>
                  <input
                    className={`form-control ${errors.epfNo ? "is-invalid" : ""}`}
                    name="epfNo"
                    value={form.epfNo}
                    onChange={handleChange}
                  />
                  {errors.epfNo && <div className="error-text">{errors.epfNo}</div>}
                </td>
              </tr>
              <tr>
                <td>
                  <strong>DATE OF JOINING:</strong>
                  <input
                    className={`form-control ${errors.doj ? "is-invalid" : ""}`}
                    name="doj"
                    type="date"
                    value={form.doj}
                    onChange={handleChange}
                  />
                  {errors.doj && <div className="error-text">{errors.doj}</div>}
                </td>
                <td>
                  <strong>MONTH DAYS:</strong>
                  <input
                    className={`form-control ${errors.monthDays ? "is-invalid" : ""}`}
                    name="monthDays"
                    value={form.monthDays}
                    onChange={handleChange}
                  />
                  {errors.monthDays && <div className="error-text">{errors.monthDays}</div>}
                </td>
              </tr>
              <tr>
                <td>
                  <strong>BANK:</strong>
                  <input
                    className={`form-control ${errors.bankName ? "is-invalid" : ""}`}
                    name="bankName"
                    value={form.bankName}
                    onChange={handleChange}
                  />
                  {errors.bankName && <div className="error-text">{errors.bankName}</div>}
                </td>
                <td>
                  <strong>PAID DAYS:</strong>
                  <input
                    className={`form-control ${errors.paidDays ? "is-invalid" : ""}`}
                    name="paidDays"
                    value={form.paidDays}
                    onChange={handleChange}
                  />
                  {errors.paidDays && <div className="error-text">{errors.paidDays}</div>}
                </td>
              </tr>
              <tr>
                <td>
                  <strong>BANK A/C NO:</strong>
                  <input
                    className={`form-control ${errors.accountNo ? "is-invalid" : ""}`}
                    name="accountNo"
                    value={form.accountNo}
                    onChange={handleChange}
                  />
                  {errors.accountNo && <div className="error-text">{errors.accountNo}</div>}
                </td>
                <td>
                  <strong>LOCATION:</strong>
                  <input
                    className={`form-control ${errors.location ? "is-invalid" : ""}`}
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                  />
                  {errors.location && <div className="error-text">{errors.location}</div>}
                </td>
              </tr>
              <tr>
                <td>
                  <strong>DEPARTMENT:</strong>
                  <input
                    className={`form-control ${errors.department ? "is-invalid" : ""}`}
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                  />
                  {errors.department && <div className="error-text">{errors.department}</div>}
                </td>
                <td>
                  <strong>DESIGNATION:</strong>
                  <input
                    className={`form-control ${errors.designation ? "is-invalid" : ""}`}
                    name="designation"
                    value={form.designation}
                    onChange={handleChange}
                  />
                  {errors.designation && <div className="error-text">{errors.designation}</div>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="row">
          <div className="col-12 col-md-8 mb-3 mb-md-0">
            <div className="table-responsive">
              <table className="table custom-table text-center">
                <thead>
                  <tr>
                    <th colSpan="3">EARNINGS</th>
                  </tr>
                  <tr>
                    <th>DESCRIPTION</th>
                    <th>ACTUAL</th>
                    <th>EARNED</th>
                  </tr>
                </thead>
                <tbody>
                  {["basic", "hra", "conveyance", "medical", "bonus"].map((field, idx) => (
                    <tr key={idx}>
                      <td>{field.replace(/([A-Z])/g, " $1").toUpperCase()}</td>
                      <td>
                        <input
                          className={`form-control ${errors[field] ? "is-invalid" : ""}`}
                          name={field}
                          value={form[field]}
                          onChange={handleChange}
                        />
                        {errors[field] && <div className="error-text">{errors[field]}</div>}
                      </td>
                      <td>{form[field]}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan="2">TOTAL EARNINGS</th>
                    <th>{totalEarnings.toFixed(2)}</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="table-responsive">
              <table className="table custom-table text-center">
                <thead>
                  <tr>
                    <th colSpan="2">DEDUCTIONS</th>
                  </tr>
                  <tr>
                    <th>DESCRIPTION</th>
                    <th>DEDUCTION</th>
                  </tr>
                </thead>
                <tbody>
                  {["pf", "esi", "ptax"].map((field, idx) => (
                    <tr key={idx}>
                      <td>{field === "pf" ? "PROVIDENT FUND" : field.toUpperCase()}</td>
                      <td>
                        <input
                          className={`form-control ${errors[field] ? "is-invalid" : ""}`}
                          name={field}
                          value={form[field]}
                          onChange={handleChange}
                        />
                        {errors[field] && <div className="error-text">{errors[field]}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan="1">TOTAL DEDUCTIONS</th>
                    <th>{totalDeductions.toFixed(2)}</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="net-pay-box">
          NET PAY ₹ {netPay.toFixed(2)}
          <br />({convertToWords(Math.floor(netPay)).toUpperCase()})
        </div>
        <div className="text-center mt-4">
          <small className="text-muted" color="navblue"><h5>
            Note: This is an electronically generated statement and does not require any signature.</h5>
          </small>
        </div>
      </div>


    </div>
  );
};
// TeacherTable Component
const TeacherTable = ({ teachers, onEdit, onDelete, onTeacherSelect }) => {
  return (
    <div className="table-responsive">
      <style>
        {`
          .table-responsive {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .table {
            width: 100%;
            margin-bottom: 0;
            table-layout: fixed;
            color: #000;
          }

          .table th, .table td {
            vertical-align: middle;
            padding: 12px;
            word-break: break-word;
            border-color: rgba(255, 215, 0, 0.2);
          }

          .table th:nth-child(1), .table td:nth-child(1) { width: 25%; }
          .table th:nth-child(2), .table td:nth-child(2) { width: 20%; }
          .table th:nth-child(3), .table td:nth-child(3) { width: 20%; }
          .table th:nth-child(4), .table td:nth-child(4) { width: 25%; }
          .table th:nth-child(5), .table td:nth-child(5) { 
            width: 10%; 
            min-width: 80px;
          }

          .truncate-text {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
            color: #000;
          }

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
            background: #99a8d6;
            color: #000;
            border: none;
          }

          .btn-group .btn:hover {
            background: #6e85d0;
            color: #000;
          }

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
              border: 1px solid rgba(255, 215, 0, 0.2);
              border-radius: 4px;
            }

            .table tbody td {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding: 10px;
              border: none;
              border-bottom: 1px solid rgba(255, 215, 0, 0.2);
              width: 100% !important;
            }

            .table tbody td:last-child {
              border-bottom: none;
            }

            .table tbody td:before {
              content: attr(data-label);
              font-weight: bold;
              margin-right: 10px;
              color: #99a8d6;
              flex: 0 0 30%;
              min-width: 90px;
            }

            .table tbody td:nth-child(1), .table tbody td:nth-child(4) {
              flex-direction: column;
              align-items: flex-start;
            }

            .table tbody td:nth-child(4) .d-flex {
              flex-direction: column;
              gap: 5px;
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
            background: linear-gradient(135deg, #000000, #3D3D3D, #99a8d6);
            color: #000;
          }

          .hover-bg-light:hover {
            background: linear-gradient(135deg, #2a2a2a, #5a5a5a, #99a8d6);
          }

          .badge {
            background: #99a8d6;
            color: #000;
            border: 1px solid #99a8d6;
          }
        `}
      </style>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th className="border-0 ps-4">Teacher Details</th>
                  <th className="border-0">Contact Information</th>
                  <th className="border-0">Class & Section</th>
                  <th className="border-0">Subject</th>
                  <th className="border-0 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5">
                      <div className="d-flex flex-column align-items-center my-4">
                        <AlertCircle size={40} className="mb-3 opacity-50" />
                        <p className="fs-5 fw-medium mb-1">No teachers found</p>
                        <p className="small">There are no teaching staff in the system yet</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher) => (
                    <tr key={teacher._id} style={{ cursor: "pointer" }} className="hover-bg-light">
                      <td className="ps-4" onClick={() => onTeacherSelect(teacher)} data-label="Teacher Details">
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
                                teacher.profilePic
                                  ? `${process.env.REACT_APP_API_URL}/${teacher.profilePic}`
                                  : "/api/placeholder/48/48"
                              }
                              alt=""
                            />
                          </div>
                          <div className="ms-3">
                            <div className="fw-semibold truncate-text">{teacher.name}</div>
                          </div>
                        </div>
                      </td>
                      <td onClick={() => onTeacherSelect(teacher)} data-label="Contact Information">
                        <div className="truncate-text">{teacher.email}</div>
                        <div className="small truncate-text">{teacher.phoneNo}</div>
                      </td>
                      <td onClick={() => onTeacherSelect(teacher)} data-label="Class & Section">
                        <div
                          className="truncate-text"
                          title={`${teacher.classTeacherFor || "N/A"} - ${teacher.section || "N/A"}`}
                        >
                          {teacher.classTeacherFor && teacher.section
                            ? `${teacher.classTeacherFor} - ${teacher.section}`
                            : "No class assigned"}
                        </div>
                      </td>
                      <td onClick={() => onTeacherSelect(teacher)} data-label="Subject">
                        {teacher.subject ? (
                          <div className="d-flex flex-wrap gap-2">
                            <div
                              className="badge rounded-pill d-flex align-items-center py-2 px-3 truncate-text"
                              title={teacher.subject}
                            >
                              <GraduationCap size={14} className="me-1" />
                              <span className="truncate-text">{teacher.subject}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="badge">No subject</span>
                        )}
                      </td>
                      <td className="text-center" data-label="Actions">
                        <div className="btn-group" role="group">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onEdit(teacher)
                            }}
                            className="btn btn-sm"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Edit Teacher"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(teacher._id)
                            }}
                            className="btn btn-sm"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Delete Teacher"
                          >
                            <Trash2 size={16} />
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
  )
}

// NonTeacherTable Component
const NonTeacherTable = ({ staff, onEdit, onDelete, onStaffSelect, onSort, sortField, sortOrder }) => {
  return (
    <div className="table-responsive">
      <style>
        {`
          .table-responsive {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .table {
            width: 100%;
            margin-bottom: 0;
            table-layout: fixed;
            color: #000;
          }

          .table th, .table td {
            vertical-align: middle;
            padding: 12px;
            word-break: break-word;
            border-color: rgba(255, 215, 0, 0.2);
          }

          .table th:nth-child(1), .table td:nth-child(1) { width: 25%; }
          .table th:nth-child(2), .table td:nth-child(2) { width: 20%; }
          .table th:nth-child(3), .table td:nth-child(3) { width: 20%; }
          .table th:nth-child(4), .table td:nth-child(4) { width: 20%; }
          .table th:nth-child(5), .table td:nth-child(5) { 
            width: 15%; 
            min-width: 120px;
          }

          .truncate-text {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
            color: #000;
          }

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
            background: #99a8d6;
            color: #000;
            border: none;
          }

          .btn-group .btn:hover {
            background: #6e85d0;
            color: #000;
          }

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
              border: 1px solid rgba(255, 215, 0, 0.2);
              border-radius: 4px;
            }

            .table tbody td {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding: 10px;
              border: none;
              border-bottom: 1px solid rgba(255, 215, 0, 0.2);
              width: 100% !important;
            }

            .table tbody td:last-child {
              border-bottom: none;
            }

            .table tbody td:before {
              content: attr(data-label);
              font-weight: bold;
              margin-right: 10px;
              color: #99a8d6;
              flex: 0 0 30%;
              min-width: 90px;
            }

            .table tbody td:nth-child(1), .table tbody td:nth-child(3) {
              flex-direction: column;
              align-items: flex-start;
            }

            .table tbody td:nth-child(3) .d-flex {
              flex-direction: column;
              gap: 5px;
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
            background: transparent !important;
            color: #000;
          }

          .card-body{
            background: transparent !important;
            color: #000;
          }

          .hover-bg-light:hover {
            background: linear-gradient(135deg, #2a2a2a, #5a5a5a,rgb(19, 92, 39));
          }

          .badge {
            background:rgba(110, 133, 208, 0.81);
            color: #000;
            border: 1px solid #99a8d6;
          }
        `}
      </style>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 ps-4" onClick={() => onSort("name")}>
                    Staff Details {sortField === "name" ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}
                  </th>
                  <th className="border-0" onClick={() => onSort("email")}>
                    Contact Information {sortField === "email" ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}
                  </th>
                  <th className="border-0" onClick={() => onSort("designation")}>
                    Designation {sortField === "designation" ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}
                  </th>
                  <th className="border-0" onClick={() => onSort("salary")}>
                    Salary {sortField === "salary" ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}
                  </th>
                  <th className="border-0 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5">
                      <div className="d-flex flex-column align-items-center my-4">
                        <AlertCircle size={40} className="mb-3 opacity-50" />
                        <p className="fs-5 fw-medium mb-1">No staff found</p>
                        <p className="small">There are no non-teaching staff in the system yet</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  staff.map((member) => (
                    <tr key={member._id} style={{ cursor: "pointer" }} className="hover-bg-light">
                      <td className="ps-4" onClick={() => onStaffSelect(member)} data-label="Staff Details">
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
                                member.profilePic
                                  ? `${process.env.REACT_APP_API_URL}/${member.profilePic}`
                                  : "/api/placeholder/48/48"
                              }
                              alt=""
                            />
                          </div>
                          <div className="ms-3">
                            <div className="fw-semibold truncate-text">{member.name}</div>
                          </div>
                        </div>
                      </td>
                      <td onClick={() => onStaffSelect(member)} data-label="Contact Information">
                        <div className="truncate-text">{member.email}</div>
                        <div className="small truncate-text">{member.phoneNo}</div>
                      </td>
                      <td onClick={() => onStaffSelect(member)} data-label="Designation">
                        {member.designation ? (
                          <div className="d-flex flex-wrap gap-2">
                            <div
                              className="badge rounded-pill d-flex align-items-center py-2 px-3 truncate-text"
                              title={member.designation}
                            >
                              <GraduationCap size={14} className="me-1" />
                              <span className="truncate-text">{member.designation}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="badge">No designation</span>
                        )}
                      </td>
                      <td onClick={() => onStaffSelect(member)} data-label="Salary">
                        <div className="truncate-text">₹{member.salary || "N/A"}</div>
                      </td>
                      <td className="text-center" data-label="Actions">
                        <div className="btn-group" role="group">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onEdit(member)
                            }}
                            className="btn btn-sm"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Edit Staff"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(member._id)
                            }}
                            className="btn btn-sm"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Delete Staff"
                          >
                            <Trash2 size={16} />
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
  )
}

const TeacherList = () => {
  const [teachers, setTeachers] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editTeacherId, setEditTeacherId] = useState(null)
  const [passwordError, setPasswordError] = useState("")
  const [idError, setIdError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [timetableError, setTimetableError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [timetable, setTimetable] = useState([])
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [tempFilterClass, setTempFilterClass] = useState("")
  const [tempFilterSection, setTempFilterSection] = useState("")
  const [tempFilterSubject, setTempFilterSubject] = useState("")
  const [filterClass, setFilterClass] = useState("")
  const [filterSection, setFilterSection] = useState("")
  const [filterSubject, setFilterSubject] = useState("")
  const [currentPageTeaching, setCurrentPageTeaching] = useState(1)
  const [currentPageNonTeaching, setCurrentPageNonTeaching] = useState(1)
  const [sortField, setSortField] = useState("")
  const [sortOrder, setSortOrder] = useState("asc")
  const [staffType, setStaffType] = useState("Teaching")
  const [formData, setFormData] = useState({})
  const [nameError, setNameError] = useState("")
  const [bankNameError, setBankNameError] = useState("")
  const [bankAccountError, setBankAccountError] = useState("")
  const [panError, setPanError] = useState("")
  const [locationError, setLocationError] = useState("")

  // Payslip states
  const [showPayslipModal, setShowPayslipModal] = useState(false)
  const [teacherPayslips, setTeacherPayslips] = useState([])
  const [showPayslipHistory, setShowPayslipHistory] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState({})

  const navigate = useNavigate()
  const teachersPerPage = 5

  const classes = [
    "Nursery",
    "LKG",
    "UKG",
    "1st Grade",
    "2nd Grade",
    "3rd Grade",
    "4th Grade",
    "5th Grade",
    "6th Grade",
    "7th Grade",
    "8th Grade",
    "9th Grade",
    "10th Grade",
  ]
  const sections = ["A", "B"]
  const subjects = ["Math", "Science", "English", "History", "Geography", "Hindi", "Computer Science"]

  const classSectionOptions = classes.flatMap((cls) => sections.map((sec) => `${cls}-${sec}`))

  const BASE_URL =
    process.env.NODE_ENV === "production" ? process.env.REACT_APP_API_DEPLOYED_URL : process.env.REACT_APP_API_URL

  const initialTimetable = [
    { time: "9:00 - 9:45", class: "" },
    { time: "9:45 - 10:30", class: "" },
    { time: "10:30 - 10:45", class: "Break" },
    { time: "10:45 - 11:30", class: "" },
    { time: "11:30 - 12:15", class: "" },
    { time: "12:15 - 1:15", class: "Lunch" },
    { time: "1:15 - 2:00", class: "" },
    { time: "2:00 - 2:45", class: "" },
    { time: "2:45 - 3:00", class: "Break" },
    { time: "3:00 - 3:45", class: "" },
    { time: "3:45 - 4:30", class: "" },
  ]

  const getAuthConfig = () => {
    const token = localStorage.getItem("token")
    if (!token) {
      toast.error("Please log in to access this feature")
      throw new Error("No token found")
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }
  }

  const fetchTeachers = useCallback(async () => {
    try {
      const config = getAuthConfig()
      const response = await axios.get(`${BASE_URL}/api/teachers`, config)
      setTeachers(response.data || [])
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token")
        toast.error("Session expired. Please log in again.")
        navigate("/login")
      } else {
        toast.error("Failed to fetch teachers: " + (error.response?.data?.message || error.message))
      }
    }
  }, [navigate])

  // Fetch payslips for a teacher
  const fetchTeacherPayslips = async (teacherId) => {
    try {
      const config = getAuthConfig()
      const response = await axios.get(`${BASE_URL}/api/teachers/${teacherId}/payslips`, config)
      setTeacherPayslips(response.data.data || [])
    } catch (error) {
      console.error("Error fetching payslips:", error)
      toast.error("Failed to fetch payslips: " + (error.response?.data?.message || error.message))
    }
  }

  // Handle save payslip
  const handleSavePayslip = async (payslipData) => {
    try {
      // Refresh payslips from backend to get the latest data
      await fetchTeacherPayslips(selectedTeacher._id)
      toast.success("Payslip saved successfully!")
    } catch (error) {
      console.error("Error saving payslip:", error)
      toast.error("Failed to save payslip")
    }
  }

  // Handle delete payslip
  const handleDeletePayslip = async (payslipId) => {
    if (window.confirm("Are you sure you want to delete this payslip?")) {
      try {
        const config = getAuthConfig()
        await axios.delete(`${BASE_URL}/api/teachers/${selectedTeacher._id}/payslips/${payslipId}`, config)
        setTeacherPayslips((prev) => prev.filter((p) => p.payslipId !== payslipId))
        toast.success("Payslip deleted successfully!")
      } catch (error) {
        console.error("Error deleting payslip:", error)
        toast.error("Failed to delete payslip: " + (error.response?.data?.message || error.message))
      }
    }
  }

  // Handle view payslip PDF
  const handleViewPayslip = async (payslipId) => {
    try {
      const config = getAuthConfig()
      const response = await axios.get(
        `${BASE_URL}/api/teachers/${selectedTeacher._id}/payslips/${payslipId}/download`,
        {
          ...config,
          responseType: "blob",
        },
      )

      const pdfBlob = new Blob([response.data], { type: "application/pdf" })
      const pdfUrl = URL.createObjectURL(pdfBlob)
      window.open(pdfUrl, "_blank")
    } catch (error) {
      console.error("Error viewing payslip:", error)
      toast.error("Failed to view payslip: " + (error.response?.data?.message || error.message))
    }
  }

  // Handle download payslip PDF
  const handleDownloadPayslip = async (payslipId, filename) => {
    try {
      const config = getAuthConfig()
      const response = await axios.get(
        `${BASE_URL}/api/teachers/${selectedTeacher._id}/payslips/${payslipId}/download`,
        {
          ...config,
          responseType: "blob",
        },
      )

      const pdfBlob = new Blob([response.data], { type: "application/pdf" })
      const pdfUrl = URL.createObjectURL(pdfBlob)

      const link = document.createElement("a")
      link.href = pdfUrl
      link.download = filename || `payslip_${payslipId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(pdfUrl)
    } catch (error) {
      console.error("Error downloading payslip:", error)
      toast.error("Failed to download payslip: " + (error.response?.data?.message || error.message))
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  // Fetch payslips when teacher is selected
  useEffect(() => {
    if (selectedTeacher) {
      fetchTeacherPayslips(selectedTeacher._id)
    }
  }, [selectedTeacher])

  const handleAddTeacher = async (newTeacher) => {
    try {
      const isDuplicateId = teachers.some(
        (teacher) => teacher.teacherId === newTeacher.teacherId && teacher._id !== editTeacherId,
      )

      if (isDuplicateId) {
        toast.error(`Staff ID "${newTeacher.teacherId}" already exists. Please use a unique ID.`)
        return
      }
      const formData = new FormData()
      for (const key in newTeacher) {
        if (key === "profilePic" && newTeacher[key] instanceof File) {
          formData.append(key, newTeacher[key])
        } else if (key === "timetable") {
          formData.append("timetable", JSON.stringify(newTeacher.timetable))
        } else {
          formData.append(key, newTeacher[key])
        }
      }

      const config = getAuthConfig()
      let response

      if (editTeacherId) {
        response = await axios.put(`${BASE_URL}/api/teachers/${editTeacherId}`, formData, config)
        setTeachers(teachers.map((t) => (t._id === editTeacherId ? response.data.data : t)))
        toast.success("Teacher updated successfully!")
      } else {
        response = await axios.post(`${BASE_URL}/api/teachers`, formData, config)
        setTeachers([...teachers, response.data.data])
        toast.success("Teacher added successfully!")
      }

      setShowForm(false)
      setEditTeacherId(null)
      setSelectedTeacher(null)
      setShowPassword(false)
      setTimetable(initialTimetable)
      setStaffType("Teaching")
      setFormData({})
      setNameError("")
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save teacher")
    }
  }

  const handleDeleteTeacher = async (id) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      try {
        const config = getAuthConfig()
        await axios.delete(`${BASE_URL}/api/teachers/${id}`, config)
        setTeachers(teachers.filter((teacher) => teacher._id !== id))
        toast.success("Teacher deleted successfully!")
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete teacher")
      }
    }
  }

  const handleEditTeacher = (teacher) => {
    setEditTeacherId(teacher._id)
    setShowForm(true)
    setTimetable(teacher.timetable || initialTimetable)
    setStaffType(teacher.staffType || "Teaching")
    setShowPassword(false)
    setFormData({
      teacherId: teacher.teacherId,
      name: teacher.name,
      email: teacher.email,
      phoneNo: teacher.phoneNo,
      joiningDate: formatDate(teacher.joiningDate),
      dateOfBirth: formatDate(teacher.dateOfBirth),
      gender: teacher.gender,
      address: teacher.address,
      password: teacher.password,
      salary: teacher.salary,
      bankName: teacher.bankName || "",
      bankAccountNumber: teacher.bankAccountNumber || "",
      panNumber: teacher.panNumber || "",
      location: teacher.location || "",
      ...(teacher.staffType === "Teaching" && {
        qualification: teacher.qualification,
        classTeacherFor: teacher.classTeacherFor,
        section: teacher.section,
        subject: teacher.subject,
      }),
      ...(teacher.staffType === "Non-Teaching" && {
        designation: teacher.designation,
      }),
    })
  }

  const validatePassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)

  const validateTeacherId = (id, staffType) => {
    return staffType === "Teaching" ? /^T\d{3}$/.test(id) : /^N\d{3}$/.test(id)
  }

  const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z]{2,}\.[a-zA-Z]{2,}$/.test(email)

  const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone)

  const validateTimetable = (timetable) => {
    const classes = timetable.map((slot) => slot.class).filter((cls) => cls !== "Break" && cls !== "Lunch")
    const uniqueClasses = [...new Set(classes)]
    return classes.length === uniqueClasses.length
  }

  const validateName = (name) => /^[a-zA-Z\s]*$/.test(name)

  const isValidBankNameLocal = (name) => name.trim().length >= 2
  const isValidBankAccountNumberLocal = (accountNumber) => /^\d{9,18}$/.test(accountNumber)
  const isValidPANNumberLocal = (panNumber) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)
  const isValidLocationLocal = (location) => location.trim().length >= 2

  const handleSort = (field) => {
    const order = sortField === field && sortOrder === "asc" ? "desc" : "asc"
    setSortField(field)
    setSortOrder(order)
  }

  const sortedTeachers = [...teachers].sort((a, b) => {
    if (!sortField) return 0
    const aValue = a[sortField] || ""
    const bValue = b[sortField] || ""

    if (sortField === "salary") {
      return sortOrder === "asc" ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue)
    }

    return sortOrder === "asc"
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue))
  })

  const searchedTeachers = sortedTeachers.filter(
    (teacher) =>
      teacher.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.teacherId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${teacher.classTeacherFor ?? ""} - ${teacher.section ?? ""}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.phoneNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.designation?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredTeachers = searchedTeachers.filter(
    (teacher) =>
      (filterClass ? teacher.classTeacherFor === filterClass : true) &&
      (filterSection ? teacher.section === filterSection : true) &&
      (filterSubject ? teacher.subject === filterSubject : true),
  )

  const teachingStaff = filteredTeachers.filter((teacher) => teacher.staffType === "Teaching")
  const nonTeachingStaff = filteredTeachers.filter((teacher) => teacher.staffType === "Non-Teaching")

  const indexOfLastTeacherTeaching = currentPageTeaching * teachersPerPage
  const indexOfFirstTeacherTeaching = indexOfLastTeacherTeaching - teachersPerPage
  const currentTeachingStaff = teachingStaff.slice(indexOfFirstTeacherTeaching, indexOfLastTeacherTeaching)
  const totalPagesTeaching = Math.ceil(teachingStaff.length / teachersPerPage)

  const indexOfLastTeacherNonTeaching = currentPageNonTeaching * teachersPerPage
  const indexOfFirstTeacherNonTeaching = indexOfLastTeacherNonTeaching - teachersPerPage
  const currentNonTeachingStaff = nonTeachingStaff.slice(indexOfFirstTeacherNonTeaching, indexOfLastTeacherNonTeaching)
  const totalPagesNonTeaching = Math.ceil(nonTeachingStaff.length / teachersPerPage)

  const paginate = (pageNumber, tableType) => {
    if (tableType === "teaching") {
      setCurrentPageTeaching(pageNumber)
    } else if (tableType === "nonTeaching") {
      setCurrentPageNonTeaching(pageNumber)
    }
  }

  const today = new Date()
  const maxBirthDate = new Date()
  maxBirthDate.setFullYear(today.getFullYear() - 21)
  const maxBirthDateStr = maxBirthDate.toISOString().split("T")[0]

  const handleTimetableTimeChange = (index, newTime) => {
    const updatedTimetable = [...timetable]
    updatedTimetable[index] = { ...updatedTimetable[index], time: newTime }
    setTimetable(updatedTimetable)
    if (staffType === "Teaching") {
      setTimetableError(validateTimetable(updatedTimetable) ? "" : "Each class in timetable must be unique")
    }
  }

  const handleTimetableClassChange = (index, newClass) => {
    const updatedTimetable = [...timetable]
    updatedTimetable[index] = { ...updatedTimetable[index], class: newClass }
    setTimetable(updatedTimetable)
    if (staffType === "Teaching") {
      setTimetableError(validateTimetable(updatedTimetable) ? "" : "Each class in timetable must be unique")
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toISOString().split("T")[0]
  }

  const handleInputChange = (e) => {
    const { name, value, files } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }))

    switch (name) {
      case "password":
        setPasswordError(
          validatePassword(value)
            ? ""
            : "Password must be at least 8 characters with one uppercase, lowercase, number, and special character.",
        )
        break
      case "teacherId":
        setIdError(
          validateTeacherId(value, staffType)
            ? ""
            : staffType === "Teaching"
              ? "ID must be T followed by 3 digits (e.g., T001)"
              : "ID must be N followed by 3 digits (e.g., N001)",
        )
        break
      case "email":
        setEmailError(validateEmail(value) ? "" : "Email must be valid (e.g., example@domain.topleveldomain)")
        break
      case "phoneNo":
        setPhoneError(validatePhone(value) ? "" : "Phone must be 10 digits starting with 6-9")
        break
      case "name":
        setNameError(validateName(value) ? "" : "Name must contain only letters and spaces")
        break
      case "bankName":
        setBankNameError(isValidBankNameLocal(value) ? "" : "Bank name must be at least 2 characters")
        break
      case "bankAccountNumber":
        setBankAccountError(isValidBankAccountNumberLocal(value) ? "" : "Bank account number must be 9-18 digits")
        break
      case "panNumber":
        setPanError(isValidPANNumberLocal(value.toUpperCase()) ? "" : "PAN number must be in format: ABCDE1234F")
        break
      case "location":
        setLocationError(isValidLocationLocal(value) ? "" : "Location must be at least 2 characters")
        break
      default:
        break
    }
  }

  const handleTeacherSelect = (teacher) => {
    setSelectedTeacher(teacher)
    setShowPayslipHistory(false)
  }

  // Group payslips by year and month for folder structure
  const groupedPayslips = teacherPayslips.reduce((acc, payslip) => {
    const year = payslip.year
    const month = payslip.month

    if (!acc[year]) {
      acc[year] = {}
    }
    if (!acc[year][month]) {
      acc[year][month] = []
    }
    acc[year][month].push(payslip)

    return acc
  }, {})

  const toggleFolder = (folderId) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }))
  }

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
        .btn-success, .btn-primary {
          // background: #99a8d6;
          // color: #000;
          border: none;
        }
        .btn-success:hover, .btn-primary:hover {
          background: #3166d6;
          transform: scale(1.05);
          transition: transform 0.2s ease;
        }
        .btn-secondary {
          background: #3D3D3D;
          color: #99a8d6;
          border: none;
        }
        .btn-secondary:hover {
          background: #4a4a4a;
        }
        .input-group input:focus {
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
          border-color: #99a8d6;
        }
        .modal-content {
          animation: zoomIn 0.3s ease;
          color: #000;
        }
        .modal-header {
          background: #99a8d6;
          color: #000;
        }
        .form-control {
          background: rgba(255, 255, 255, 0.1);
          border-color: #99a8d6;
          color: #000;
        }
        .form-control::placeholder {
          color:rgb(185, 199, 243);
        }
        .form-control:focus {
          background: rgba(255, 255, 255, 0.2);
          border-color: #99a8d6;
          color: #000;
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
        .text-primary {
          color: #0000ff !important;
        }
        .text-muted {
          color:rgb(13, 13, 14) !important;
        }
        
        .payslip-section {
          background: linear-gradient(135deg, #f8f9fa, #e9ecef);
          border-radius: 8px;
          padding: 10px;
          margin-top: 20px;
          // border: 1px solid #99a8d6;
        }
        
       .payslip-header {
  display: flex;
  flex-direction: column;
  align-items: center; /* center horizontally */
  gap: 10px; /* space between title and buttons */
  text-align: center;
}

.payslip-header > div {
  display: flex;
  flex-direction: column; /* stack buttons vertically */
  gap: 10px; /* space between buttons */
  align-items: center;
}

        
        .payslip-title {
          color: #99a8d6;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 3px;
        }
        
        .btn-generate-pdf {
          background: #28a745;
          color: white;
          border: none;
          padding: 4px 10px;
          border-radius: 5px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
        }
        
        .btn-generate-pdf:hover {
          background: #218838;
          transform: translateY(-2px);
        }
        
        .btn-view-history {
          background: #17a2b8;
          color: white;
          border: none;
          padding: 4px 10px;
          border-radius: 5px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          margin-left: 10px;
        }
        
        .btn-view-history:hover {
          background: #138496;
          transform: translateY(-2px);
        }
        
        .payslip-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 5px;
        }
        
        .payslip-info-item {
          background: white;
          padding: 5px;
          
          border-radius: 5px;
          border-left: 4px solid #99a8d6;
        }
        
        .payslip-info-label {
          font-size: 12px;
          color: #6c757d;
          margin-bottom: 5px;
        }
        
        .payslip-info-value {
          font-weight: bold;
          color: #333;
        }
        
        .payslip-history-table {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .payslip-history-table table {
          width: 100%;
          margin: 0;
        }
        
        .payslip-history-table th {
          background: #99a8d6;
          color: #000;
          padding: 12px;
          text-align: center;
          font-weight: bold;
        }
        
        .payslip-history-table td {
          padding: 10px;
          text-align: center;
          border-bottom: 1px solid #eee;
        }
        
        .payslip-history-table .btn-sm {
          padding: 4px 8px;
          font-size: 12px;
          margin: 0 2px;
        }
        
        
        .no-payslips {
          text-align: center;
          padding: 40px;
          color: #6c757d;
        }

        .folder-structure {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-top: 20px;
        }
        
        .folder-item {
          border-bottom: 1px solid #eee;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .folder-item:hover {
          background-color: #f8f9fa;
        }
        
        .folder-header {
          padding: 12px 15px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: bold;
          color: #495057;
        }
        
        .folder-content {
          padding: 0 15px 15px 40px;
          background-color: #f8f9fa;
        }
        
        .payslip-file {
          display: flex;
          // align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          // margin-left: 2px 0;
          background: white;
          border-radius: 4px;
          border: 1px solid #dee2e6;
        }
        
        .payslip-file-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .payslip-file-actions {
          display: flex;
          gap: 5px;
        }
      `}</style>

      <div className="container-fluid p-4" style={{ minHeight: "100vh" }}>
        <div className="row mb-4 align-items-center">
          <div className="col">
            <h1 className="h3 fw-bold text-primary mb-0 animate__animated animate__fadeInDown">Teachers Management</h1>
            <p className="text-muted small animate__animated animate__fadeInDown animate__delay-1s">
              Manage teacher records efficiently
            </p>
          </div>
          <div className="col-auto">
            <button
              className="btn btn-primary shadow-sm d-flex align-items-center animate__animated animate__fadeInRight"
              onClick={() => {
                setShowForm(true)
                setEditTeacherId(null)
                setTimetable(initialTimetable)
                setShowPassword(false)
                setStaffType("Teaching")
                setFormData({})
              }}
            >
              <PlusCircle size={18} className="me-2" />
              Add Teacher
            </button>
          </div>
        </div>

        {!showForm && !selectedTeacher && (
          <div className="row mb-4">
            <div className="col-12 col-md-6 mx-auto">
              <div className="input-group shadow-sm animate__animated animate__fadeInUp">
                <span className="input-group-text bg-light border-0">
                  <Search size={20} className="text-black" />
                </span>
                <input
                  type="text"
                  className="form-control border-0 py-2 text-muted"
                  placeholder="Search teachers by name, ID, class, phone, subject, or designation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ transition: "all 0.3s ease" }}
                />
              </div>
            </div>
          </div>
        )}

        {showFilterModal && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-lg border-0">
                <div className="modal-header">
                  <h5 className="modal-title">Filter Teachers</h5>
                  <button type="button" className="btn-close" onClick={() => setShowFilterModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Class</label>
                    <select
                      className="form-control"
                      value={tempFilterClass}
                      onChange={(e) => setTempFilterClass(e.target.value)}
                    >
                      <option value="">All Classes</option>
                      {classes.map((cls, index) => (
                        <option key={index} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Section</label>
                    <select
                      className="form-control"
                      value={tempFilterSection}
                      onChange={(e) => setTempFilterSection(e.target.value)}
                    >
                      <option value="">All Sections</option>
                      {sections.map((sec, index) => (
                        <option key={index} value={sec}>
                          {sec}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Subject</label>
                    <select
                      className="form-control"
                      value={tempFilterSubject}
                      onChange={(e) => setTempFilterSubject(e.target.value)}
                    >
                      <option value="">All Subjects</option>
                      {subjects.map((sub, index) => (
                        <option key={index} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowFilterModal(false)}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setFilterClass(tempFilterClass)
                      setFilterSection(tempFilterSection)
                      setFilterSubject(tempFilterSubject)
                      setShowFilterModal(false)
                      setCurrentPageTeaching(1)
                      setCurrentPageNonTeaching(1)
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payslip Modal */}
        {showPayslipModal && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content shadow-lg border-0">
                <div className="modal-header">
                  <h5 className="modal-title d-flex align-items-center">
                    <FileText size={20} className="me-2" />
                    Generate Payslip for {selectedTeacher?.name}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowPayslipModal(false)}></button>
                </div>
                <div className="modal-body" style={{ maxHeight: "80vh", overflowY: "auto" }}>
                  <PayslipForm
                    selectedTeacher={selectedTeacher}
                    onSave={handleSavePayslip}
                    onClose={() => setShowPayslipModal(false)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {!showForm && !selectedTeacher && (
          <>
            <div className="row animate__animated animate__zoomIn">
              <div className="col-12">
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h3 className="mb-0 text-primary">Teaching Staff List</h3>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowFilterModal(true)}>
                      <i className="bi bi-funnel"></i> Filter
                    </button>
                  </div>
                  <div className="card-body p-0">
                    <TeacherTable
                      teachers={currentTeachingStaff}
                      onEdit={handleEditTeacher}
                      onDelete={handleDeleteTeacher}
                      onTeacherSelect={handleTeacherSelect}
                    />
                    {teachingStaff.length > 0 && (
                      <div className="d-flex justify-content-between align-items-center border-top p-3 bg-light">
                        <div className="showing-text">
                          <p className="mb-0 small text-muted">
                            Showing <span className="fw-semibold">{indexOfFirstTeacherTeaching + 1}</span> to{" "}
                            <span className="fw-semibold">
                              {Math.min(indexOfLastTeacherTeaching, teachingStaff.length)}
                            </span>{" "}
                            of <span className="fw-semibold">{teachingStaff.length}</span> results
                          </p>
                        </div>
                        <nav aria-label="Page navigation">
                          <ul className="pagination mb-0">
                            <li className={`page-item ${currentPageTeaching === 1 ? "disabled" : ""}`}>
                              <button
                                className="page-link"
                                onClick={() => paginate(currentPageTeaching - 1, "teaching")}
                              >
                                <span aria-hidden="true">«</span>
                              </button>
                            </li>
                            {[...Array(totalPagesTeaching)].map((_, index) => (
                              <li
                                key={index}
                                className={`page-item ${currentPageTeaching === index + 1 ? "active" : ""}`}
                              >
                                <button className="page-link" onClick={() => paginate(index + 1, "teaching")}>
                                  {index + 1}
                                </button>
                              </li>
                            ))}
                            <li className={`page-item ${currentPageTeaching === totalPagesTeaching ? "disabled" : ""}`}>
                              <button
                                className="page-link"
                                onClick={() => paginate(currentPageTeaching + 1, "teaching")}
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
                  <div className="card-header">
                    <h3 className="mb-0 text-primary">Non-Teaching Staff List</h3>
                  </div>
                  <div className="card-body p-0">
                    <NonTeacherTable
                      staff={currentNonTeachingStaff}
                      onEdit={handleEditTeacher}
                      onDelete={handleDeleteTeacher}
                      onStaffSelect={handleTeacherSelect}
                      onSort={handleSort}
                      sortField={sortField}
                      sortOrder={sortOrder}
                    />
                    {nonTeachingStaff.length > 0 && (
                      <div className="d-flex justify-content-between align-items-center border-top p-3 bg-light">
                        <div className="showing-text">
                          <p className="mb-0 small text-muted">
                            Showing <span className="fw-semibold">{indexOfFirstTeacherNonTeaching + 1}</span> to{" "}
                            <span className="fw-semibold">
                              {Math.min(indexOfLastTeacherNonTeaching, nonTeachingStaff.length)}
                            </span>{" "}
                            of <span className="fw-semibold">{nonTeachingStaff.length}</span> results
                          </p>
                        </div>
                        <nav aria-label="Page navigation">
                          <ul className="pagination mb-0">
                            <li className={`page-item ${currentPageNonTeaching === 1 ? "disabled" : ""}`}>
                              <button
                                className="page-link"
                                onClick={() => paginate(currentPageNonTeaching - 1, "nonTeaching")}
                              >
                                <span aria-hidden="true">«</span>
                              </button>
                            </li>
                            {[...Array(totalPagesNonTeaching)].map((_, index) => (
                              <li
                                key={index}
                                className={`page-item ${currentPageNonTeaching === index + 1 ? "active" : ""}`}
                              >
                                <button className="page-link" onClick={() => paginate(index + 1, "nonTeaching")}>
                                  {index + 1}
                                </button>
                              </li>
                            ))}
                            <li
                              className={`page-item ${currentPageNonTeaching === totalPagesNonTeaching ? "disabled" : ""
                                }`}
                            >
                              <button
                                className="page-link"
                                onClick={() => paginate(currentPageNonTeaching + 1, "nonTeaching")}
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
            <div className="card-header">
              <h3 className="mb-0">{editTeacherId ? "Edit Staff" : "Add Staff"}</h3>
            </div>
            <div className="card-body">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const newTeacher = {
                    ...formData,
                    staffType,
                    ...(formData.profilePic && {
                      profilePic: formData.profilePic,
                    }),
                    ...(staffType === "Teaching" && { timetable }),
                  }

                  if (
                    !formData.teacherId ||
                    !formData.name ||
                    !formData.email ||
                    !formData.phoneNo ||
                    !formData.joiningDate ||
                    !formData.dateOfBirth ||
                    !formData.gender ||
                    !formData.address ||
                    !formData.password ||
                    !formData.salary ||
                    !formData.bankName ||
                    !formData.bankAccountNumber ||
                    !formData.panNumber ||
                    !formData.location ||
                    (staffType === "Teaching" &&
                      (!formData.qualification ||
                        !formData.classTeacherFor ||
                        !formData.section ||
                        !formData.subject)) ||
                    (staffType === "Non-Teaching" && !formData.designation) ||
                    (!formData.profilePic && !editTeacherId)
                  ) {
                    toast.error("All fields are required!")
                    return
                  }

                  if (
                    passwordError ||
                    idError ||
                    emailError ||
                    phoneError ||
                    timetableError ||
                    nameError ||
                    bankNameError ||
                    bankAccountError ||
                    panError ||
                    locationError
                  ) {
                    toast.error("Please fix all errors before submitting")
                    return
                  }

                  handleAddTeacher(newTeacher)
                }}
              >
                <div className="row g-3">
                  <div className="col-md-6">
                    <select
                      name="staffType"
                      className="form-control"
                      value={staffType}
                      onChange={(e) => {
                        setStaffType(e.target.value)
                        setFormData((prev) => ({
                          ...prev,
                          staffType: e.target.value,
                        }))
                        setIdError(
                          validateTeacherId(formData.teacherId || "", e.target.value)
                            ? ""
                            : e.target.value === "Teaching"
                              ? "ID must be T followed by 3 digits (e.g., T001)"
                              : "ID must be N followed by 3 digits (e.g., N001)",
                        )
                      }}
                    >
                      <option value="Teaching">Teaching</option>
                      <option value="Non-Teaching">Non-Teaching</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="teacherId"
                      placeholder="Staff ID (e.g., T001 or N001)"
                      className="form-control"
                      required
                      value={formData.teacherId || ""}
                      onChange={handleInputChange}
                    />
                    {idError && <p className="text-danger small">{idError}</p>}
                  </div>
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="name"
                      placeholder="Name"
                      className="form-control"
                      required
                      value={formData.name || ""}
                      onChange={handleInputChange}
                    />
                    {nameError && <p className="text-danger small">{nameError}</p>}
                  </div>
                  <div className="col-md-6">
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      className="form-control"
                      required
                      value={formData.email || ""}
                      onChange={handleInputChange}
                    />
                    {emailError && <p className="text-danger small">{emailError}</p>}
                  </div>
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="phoneNo"
                      placeholder="Phone (e.g., 9876543210)"
                      className="form-control"
                      maxLength={10}
                      required
                      value={formData.phoneNo || ""}
                      onChange={handleInputChange}
                    />
                    {phoneError && <p className="text-danger small">{phoneError}</p>}
                  </div>
                  {staffType === "Teaching" && (
                    <>
                      <div className="col-md-6">
                        <input
                          type="text"
                          name="qualification"
                          placeholder="Qualification"
                          className="form-control"
                          required
                          value={formData.qualification || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <select
                          name="subject"
                          className="form-control"
                          required
                          value={formData.subject || ""}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Subject</option>
                          {subjects.map((subject, index) => (
                            <option key={index} value={subject}>
                              {subject}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <select
                          name="classTeacherFor"
                          className="form-control"
                          required
                          value={formData.classTeacherFor || ""}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Class</option>
                          {classes.map((cls, index) => (
                            <option key={index} value={cls}>
                              {cls}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <select
                          name="section"
                          className="form-control"
                          required
                          value={formData.section || ""}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Section</option>
                          {sections.map((sec, index) => (
                            <option key={index} value={sec}>
                              {sec}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                  {staffType === "Non-Teaching" && (
                    <div className="col-md-6">
                      <input
                        type="text"
                        name="designation"
                        placeholder="Designation"
                        className="form-control"
                        required
                        value={formData.designation || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}
                  <div className="col-md-6">
                    <input
                      type="date"
                      name="joiningDate"
                      className="form-control"
                      required
                      value={formData.joiningDate || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <input
                      type="date"
                      name="dateOfBirth"
                      className="form-control"
                      required
                      max={maxBirthDateStr}
                      value={formData.dateOfBirth || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <select
                      name="gender"
                      className="form-control"
                      required
                      value={formData.gender || ""}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="address"
                      placeholder="Address"
                      className="form-control"
                      required
                      value={formData.address || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <input
                      type="file"
                      name="profilePic"
                      className="form-control"
                      required={!editTeacherId}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <div className="input-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        className="form-control"
                        required
                        value={formData.password || ""}
                        onChange={handleInputChange}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <i className="bi bi-eye-slash"></i> : <i className="bi bi-eye"></i>}
                      </button>
                    </div>
                    {passwordError && <p className="text-danger small">{passwordError}</p>}
                  </div>
                  <div className="col-md-6">
                    <input
                      type="number"
                      name="salary"
                      placeholder="Salary"
                      className="form-control"
                      required
                      min="1"
                      step="0.01"
                      value={formData.salary || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12">
                    <h5 className="text-primary mb-3 mt-4">
                      <FileText size={20} className="me-2" />
                      Payslip Information
                    </h5>
                  </div>
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="bankName"
                      placeholder="Bank Name"
                      className="form-control"
                      required
                      value={formData.bankName || ""}
                      onChange={handleInputChange}
                    />
                    {bankNameError && <p className="text-danger small">{bankNameError}</p>}
                  </div>
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="bankAccountNumber"
                      placeholder="Bank Account Number (9-18 digits)"
                      className="form-control"
                      required
                      maxLength={18}
                      value={formData.bankAccountNumber || ""}
                      onChange={handleInputChange}
                    />
                    {bankAccountError && <p className="text-danger small">{bankAccountError}</p>}
                  </div>
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="panNumber"
                      placeholder="PAN Number (ABCDE1234F)"
                      className="form-control"
                      required
                      maxLength={10}
                      style={{ textTransform: "uppercase" }}
                      value={formData.panNumber || ""}
                      onChange={handleInputChange}
                    />
                    {panError && <p className="text-danger small">{panError}</p>}
                  </div>
                  <div className="col-md-6">
                    <input
                      type="text"
                      name="location"
                      placeholder="Location"
                      className="form-control"
                      required
                      value={formData.location || ""}
                      onChange={handleInputChange}
                    />
                    {locationError && <p className="text-danger small">{locationError}</p>}
                  </div>
                  {staffType === "Teaching" && (
                    <div className="col-12">
                      <h4>Timetable</h4>
                      {timetableError && <p className="text-danger small">{timetableError}</p>}
                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <thead>
                            <tr>
                              <th>Time</th>
                              <th>Class & Section</th>
                            </tr>
                          </thead>
                          <tbody>
                            {timetable.map((slot, index) => (
                              <tr key={index}>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={slot.time}
                                    onChange={(e) => handleTimetableTimeChange(index, e.target.value)}
                                  />
                                </td>
                                <td>
                                  {slot.class === "Break" || slot.class === "Lunch" ? (
                                    <input type="text" className="form-control" value={slot.class} disabled />
                                  ) : (
                                    <select
                                      className="form-control"
                                      value={slot.class}
                                      onChange={(e) => handleTimetableClassChange(index, e.target.value)}
                                    >
                                      <option value="">Select Class & Section</option>
                                      {classSectionOptions.map((option, idx) => (
                                        <option key={idx} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
                <div className="d-flex gap-2 mt-3">
                  <button type="submit" className="btn btn-primary">
                    {editTeacherId ? "Update" : "Submit"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowForm(false)
                      setShowPassword(false)
                      setFormData({})
                      setBankNameError("")
                      setBankAccountError("")
                      setPanError("")
                      setLocationError("")
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedTeacher && (
          <div className="card shadow-lg border-0 animate__animated animate__zoomIn">
            <div className="card-header">
              <h3 className="mb-0">Staff Details</h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h4>{selectedTeacher.name}</h4>
                  <p>{selectedTeacher.email}</p>
                  <p>{selectedTeacher.phoneNo}</p>
                  <p>
                    <strong>Address:</strong> {selectedTeacher.address}
                  </p>
                  <p>
                    <strong>Joining Date:</strong> {formatDate(selectedTeacher.joiningDate)}
                  </p>
                  <p>
                    <strong>Date of Birth:</strong> {formatDate(selectedTeacher.dateOfBirth)}
                  </p>
                  <p>
                    <strong>Salary:</strong> ₹{selectedTeacher.salary}
                  </p>
                  <p>
                    <strong>Gender:</strong> {selectedTeacher.gender}
                  </p>
                  {selectedTeacher.staffType === "Teaching" && (
                    <>
                      <p>
                        <strong>Qualification:</strong> {selectedTeacher.qualification}
                      </p>
                      <p>
                        <strong>Subject:</strong> {selectedTeacher.subject}
                      </p>
                    </>
                  )}
                  {selectedTeacher.staffType === "Non-Teaching" && (
                    <p>
                      <strong>Designation:</strong> {selectedTeacher.designation}
                    </p>
                  )}
                </div>
                {selectedTeacher.staffType === "Teaching" && (
                  <div className="col-md-6">
                    <h4>Timetable</h4>
                    <div className="table-responsive">
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Class & Section</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedTeacher.timetable?.map((slot, index) => (
                            <tr key={index}>
                              <td>{slot.time}</td>
                              <td>{slot.class}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Payslips Section */}
              <div className="payslip-section">
                <div className="payslip-header">
                  <h4 className="payslip-title">
                    <FileText size={20} />
                    Payslip Information
                  </h4>
                  <div>
                    <button className="btn-generate-pdf" onClick={() => setShowPayslipModal(true)}>
                      <FileText size={16} />
                      Create Payslip
                    </button>
                    {teacherPayslips.length > 0 && (
                      <button className="btn-view-history mb-4 me-3" onClick={() => setShowPayslipHistory(!showPayslipHistory)}>
                        <Folder size={16} />
                        View Payslips ({teacherPayslips.length})
                      </button>
                    )}
                  </div>
                </div>
                {/* <div className="payslip-info">
                  <div className="payslip-info-item">
                    <div className="payslip-info-label">Employee ID</div>
                    <div className="payslip-info-value">{selectedTeacher.teacherId}</div>
                  </div>
                  <div className="payslip-info-item">
                    <div className="payslip-info-label">Employee Name</div>
                    <div className="payslip-info-value">{selectedTeacher.name}</div>
                  </div>
                  <div className="payslip-info-item">
                    <div className="payslip-info-label">Bank Name</div>
                    <div className="payslip-info-value">{selectedTeacher.bankName || "Not provided"}</div>
                  </div>
                  <div className="payslip-info-item">
                    <div className="payslip-info-label">Bank Account Number</div>
                    <div className="payslip-info-value">
                      {selectedTeacher.bankAccountNumber
                        ? `****${selectedTeacher.bankAccountNumber.slice(-4)}`
                        : "Not provided"}
                    </div>
                  </div>
                  <div className="payslip-info-item">
                    <div className="payslip-info-label">PAN Number</div>
                    <div className="payslip-info-value">
                      {selectedTeacher.panNumber
                        ? `${selectedTeacher.panNumber.slice(0, 3)}****${selectedTeacher.panNumber.slice(-2)}`
                        : "Not provided"}
                    </div>
                  </div>
                  <div className="payslip-info-item">
                    <div className="payslip-info-label">Location</div>
                    <div className="payslip-info-value">{selectedTeacher.location || "Not provided"}</div>
                  </div>
                  <div className="payslip-info-item">
                    <div className="payslip-info-label">Department</div>
                    <div className="payslip-info-value">
                      {selectedTeacher.staffType === "Teaching"
                        ? `${selectedTeacher.subject} - ${selectedTeacher.classTeacherFor}`
                        : selectedTeacher.designation}
                    </div>
                  </div>
                  <div className="payslip-info-item">
                    <div className="payslip-info-label">Basic Salary</div>
                    <div className="payslip-info-value">₹{selectedTeacher.salary}</div>
                  </div>
                </div> */}

                {/* Payslip History Folder Structure */}
                {showPayslipHistory && (
                  <div className="mt-4">
                    <h5 className="mb-3">Payslip History</h5>
                    {teacherPayslips.length === 0 ? (
                      <div className="no-payslips">
                        <FileText size={48} className="mb-3 opacity-50" />
                        <p>No payslips generated yet</p>
                      </div>
                    ) : (
                      <div className="folder-structure">
                        {Object.keys(groupedPayslips)
                          .sort((a, b) => b - a)
                          .map((year) => (
                            <div key={year}>
                              <div className="folder-item" onClick={() => toggleFolder(year)}>
                                <div className="folder-header">
                                  {expandedFolders[year] ? <FolderOpen size={20} /> : <Folder size={20} />}
                                  <span>{year}</span>
                                  <span className="text-muted">
                                    ({Object.keys(groupedPayslips[year]).length} months)
                                  </span>
                                </div>
                              </div>
                              {expandedFolders[year] && (
                                <div className="folder-content">
                                  {Object.keys(groupedPayslips[year])
                                    .sort((a, b) => {
                                      const monthOrder = [
                                        "January",
                                        "February",
                                        "March",
                                        "April",
                                        "May",
                                        "June",
                                        "July",
                                        "August",
                                        "September",
                                        "October",
                                        "November",
                                        "December",
                                      ]
                                      return monthOrder.indexOf(b) - monthOrder.indexOf(a)
                                    })
                                    .map((month) => (
                                      <div key={month}>
                                        <div className="folder-item" onClick={() => toggleFolder(`${year}-${month}`)}>
                                          <div className="folder-header">
                                            {expandedFolders[`${year}-${month}`] ? (
                                              <FolderOpen size={18} />
                                            ) : (
                                              <Folder size={18} />
                                            )}
                                            <span>{month}</span>
                                            <span className="text-muted">
                                              ({groupedPayslips[year][month].length} payslips)
                                            </span>
                                          </div>
                                        </div>
                                        {expandedFolders[`${year}-${month}`] && (
                                          <div className="folder-content">
                                            {groupedPayslips[year][month]
                                              .sort((a, b) => new Date(b.generatedDate) - new Date(a.generatedDate))
                                              .map((payslip) => (
                                                <div key={payslip.payslipId} className="p-2 border rounded mb-2 bg-light">
                                                  <div className="row align-items-center">
                                                    {/* File Info */}
                                                    <div className="col-md-8 col-12 d-flex align-items-start gap-2">
                                                      <FileText size={16} className="mt-1" />
                                                      <div>
                                                        <div className="fw-bold text-break border rounded p-1 bg-white">
                                                          {payslip.filename}
                                                        </div>
                                                        <div className="small text-muted mt-1">
                                                          Net Pay: ₹{payslip.netPay} | Generated:{" "}
                                                          {new Date(payslip.generatedDate).toLocaleDateString()}
                                                        </div>
                                                      </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="col-md-4 col-12 mt-2 mt-md-0 text-md-end text-start">
                                                      <button
                                                        className="btn btn-success btn-sm me-1"
                                                        onClick={() => handleViewPayslip(payslip.payslipId)}
                                                        title="View PDF"
                                                      >
                                                        <Eye size={14} />
                                                      </button>
                                                      <button
                                                        className="btn btn-primary btn-sm me-1"
                                                        onClick={() =>
                                                          handleDownloadPayslip(payslip.payslipId, payslip.filename)
                                                        }
                                                        title="Download PDF"
                                                      >
                                                        <Download size={14} />
                                                      </button>
                                                      <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDeletePayslip(payslip.payslipId)}
                                                        title="Delete Payslip"
                                                      >
                                                        <Trash2 size={14} />
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                          </div>
                                        )}

                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button className="btn btn-primary mt-3" onClick={() => setSelectedTeacher(null)}>
                Back to List
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default TeacherList
