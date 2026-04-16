import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const BehavioralRecordForm = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    term: "",
    punctuality: { status: "", comments: "" },
    disciplineRecords: [],
    classroomBehaviour: { rating: 3, comments: "" },
    peerInteraction: { quality: "", comments: "" },
    teacherComments: "",
    recordedBy: user?.name || "",
  });

  const [formErrors, setFormErrors] = useState({
    term: "",
    punctualityStatus: "",
    punctualityComments: "",
    disciplineRecords: [],
    classroomBehaviourComments: "",
    peerInteractionQuality: "",
    peerInteractionComments: "",
    teacherComments: "",
  });

  useEffect(() => {
    if (!user?.email || !token) {
      setError("Please log in to access this page.");
      setLoading(false);
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const studentsResponse = await axios.get(
          `${BASE_URL}/api/class-students/${user.email}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStudents(studentsResponse.data.students || []);

        const recordsResponse = await axios.get(
          `${BASE_URL}/api/behavioralRecords/${user.email}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRecords(recordsResponse.data.records || []);
      } catch (err) {
        setError(
          err.response?.status === 404 &&
            err.response?.data?.message?.includes("students")
            ? "No students found in your class."
            : err.response?.status === 404
            ? "No behavioral records found for your class."
            : "Failed to fetch data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.email, token, navigate]);

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setShowModal(false);
    setIsEditing(false);
    setEditingRecord(null);
  };

  const validateField = (name, value) => {
    if (typeof value === "string" && !value.trim()) {
      return "This field is required and cannot be just spaces";
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData };
    let newErrors = { ...formErrors };

    if (name?.includes(".")) {
      const [parent, child] = name.split(".");
      newFormData[parent] = { ...newFormData[parent], [child]: value };
      newErrors[parent + child.charAt(0).toUpperCase() + child.slice(1)] =
        validateField(name, value);
    } else {
      newFormData[name] = value;
      newErrors[name] = validateField(name, value);
    }

    setFormData(newFormData);
    setFormErrors(newErrors);
  };

  const handleRatingChange = (e) => {
    setFormData({
      ...formData,
      classroomBehaviour: {
        ...formData.classroomBehaviour,
        rating: parseInt(e.target.value, 10),
      },
    });
  };

  const addDisciplineRecord = () => {
    setFormData({
      ...formData,
      disciplineRecords: [
        ...formData.disciplineRecords,
        {
          type: "",
          description: "",
          date: new Date().toISOString().slice(0, 10),
        },
      ],
    });
    setFormErrors({
      ...formErrors,
      disciplineRecords: [
        ...formErrors.disciplineRecords,
        { type: "", description: "", date: "" },
      ],
    });
  };

  const handleDisciplineChange = (index, field, value) => {
    const newRecords = [...formData.disciplineRecords];
    newRecords[index][field] = value;
    setFormData({ ...formData, disciplineRecords: newRecords });

    const newDisciplineErrors = [...formErrors.disciplineRecords];
    newDisciplineErrors[index] = {
      ...newDisciplineErrors[index],
      [field]: validateField(`${field}${index}`, value),
    };
    setFormErrors({ ...formErrors, disciplineRecords: newDisciplineErrors });
  };

  const removeDisciplineRecord = (index) => {
    setFormData({
      ...formData,
      disciplineRecords: formData.disciplineRecords.filter(
        (_, i) => i !== index
      ),
    });
    setFormErrors({
      ...formErrors,
      disciplineRecords: formErrors.disciplineRecords.filter(
        (_, i) => i !== index
      ),
    });
  };

  const resetForm = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingRecord(null);
    setFormData({
      term: "",
      punctuality: { status: "", comments: "" },
      disciplineRecords: [],
      classroomBehaviour: { rating: 3, comments: "" },
      peerInteraction: { quality: "", comments: "" },
      teacherComments: "",
      recordedBy: user?.name || "",
    });
    setFormErrors({
      term: "",
      punctualityStatus: "",
      punctualityComments: "",
      disciplineRecords: [],
      classroomBehaviourComments: "",
      peerInteractionQuality: "",
      peerInteractionComments: "",
      teacherComments: "",
    });
  };

  const validateForm = () => {
    const errors = {
      term: validateField("term", formData.term),
      punctualityStatus: validateField(
        "punctuality.status",
        formData.punctuality.status
      ),
      punctualityComments: validateField(
        "punctuality.comments",
        formData.punctuality.comments
      ),
      classroomBehaviourComments: validateField(
        "classroomBehaviour.comments",
        formData.classroomBehaviour.comments
      ),
      peerInteractionQuality: validateField(
        "peerInteraction.quality",
        formData.peerInteraction.quality
      ),
      peerInteractionComments: validateField(
        "peerInteraction.comments",
        formData.peerInteraction.comments
      ),
      teacherComments: validateField(
        "teacherComments",
        formData.teacherComments
      ),
      disciplineRecords: formData.disciplineRecords.map((record, index) => ({
        type: validateField(`disciplineRecords[${index}].type`, record.type),
        description: validateField(
          `disciplineRecords[${index}].description`,
          record.description
        ),
        date: validateField(`disciplineRecords[${index}].date`, record.date),
      })),
    };

    setFormErrors(errors);
    return Object.values(errors).every((error) =>
      typeof error === "string"
        ? !error
        : error.every((e) => !e.type && !e.description && !e.date)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    setLoading(true);
    try {
      let updatedRecord;
      if (isEditing && editingRecord) {
        const response = await axios.put(
          `${BASE_URL}/api/behavioral-records/${editingRecord._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        updatedRecord = response.data.data;
        setRecords(
          records.map((r) => (r._id === editingRecord._id ? updatedRecord : r))
        );
        toast.success("Behavioral record updated successfully");
      } else {
        const response = await axios.post(
          `${BASE_URL}/api/students/${selectedStudent._id}/behavioral-records`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        updatedRecord = response.data.data;
        setRecords([updatedRecord, ...records]);
        toast.success("Behavioral record added successfully");
      }
      resetForm();
    } catch (err) {
      // console.error("Error saving record:", err.response?.data);
      toast.error(err.response?.data?.message || "Failed to save record");
    } finally {
      setLoading(false);
      window.location.reload();
    }
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    setLoading(true);
    try {
      await axios.delete(`${BASE_URL}/api/behavioral-records/${recordId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(records.filter((r) => r._id !== recordId));
      toast.success("Behavioral record deleted successfully");
    } catch (err) {
      // console.error("Error deleting record:", err.response?.data);
      toast.error(err.response?.data?.message || "Failed to delete record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        color: '#0000ff',
        padding: '1rem',
      }}
    >
      <h3 style={{ marginBottom: '1.5rem', fontWeight: 'bold', fontSize: '1.75rem' }}>
        📊 Behavioral Records
      </h3>

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div
            style={{
              width: '3rem',
              height: '3rem',
              border: '5px solid #4C91B6',
              borderTop: '5px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto',
            }}
          ></div>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}
      {error && (
        <div
          style={{
            backgroundColor: 'rgba(255, 99, 71, 0.3)',
            color: '#000',
            padding: '1rem',
            borderRadius: '5px',
            textAlign: 'center',
            marginBottom: '1rem',
            fontSize: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && (
        <div
          style={{
            display: 'flex',
            flexDirection: window.innerWidth < 768 ? 'column' : 'row',
            gap: '1rem',
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          {/* Student List */}
          <div
            style={{
              flex: window.innerWidth < 768 ? '1 1 100%' : '1 1 300px',
              maxWidth: window.innerWidth < 768 ? '100%' : '350px',
              width: '100%',
            }}
          >
            <div
              style={{
                background: 'rgba(39, 45, 49, 0.8)',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  backgroundColor: '#4C91B6',
                  padding: '1rem',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '1.25rem',
                  textAlign: 'center',
                }}
              >
                Students
              </div>
              <div style={{ padding: '1rem' }}>
                <input
                  type="text"
                  placeholder="Search Student..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '5px',
                    border: '1px solid #4C91B6',
                    backgroundColor: '#ffffff',
                    color: '#272d31',
                    marginBottom: '1rem',
                    fontSize: '1rem',
                  }}
                />
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {students.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '1.5rem',
                        color: '#ffffff',
                        fontStyle: 'italic',
                        fontSize: '1rem',
                      }}
                    >
                      No students found
                    </div>
                  ) : (
                    students
                      .filter((student) =>
                        student.name
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase())
                      )
                      .map((student) => (
                        <button
                          key={student._id}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor:
                              selectedStudent?._id === student._id
                                ? 'rgba(76, 145, 182, 0.5)'
                                : 'transparent',
                            color: '#ffffff',
                            border: 'none',
                            textAlign: 'left',
                            borderRadius: '5px',
                            marginBottom: '0.5rem',
                            transition: 'background-color 0.3s',
                            fontSize: '1rem',
                          }}
                          onClick={() => handleStudentClick(student)}
                          onMouseOver={(e) =>
                            (e.target.style.backgroundColor =
                              'rgba(76, 145, 182, 0.3)')
                          }
                          onMouseOut={(e) =>
                            (e.target.style.backgroundColor =
                              selectedStudent?._id === student._id
                                ? 'rgba(76, 145, 182, 0.5)'
                                : 'transparent')
                          }
                        >
                          <strong>{student.name || 'Unknown'}</strong>
                          <br />
                          <small>Roll: {student.rollNumber || 'N/A'}</small>
                        </button>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Student Details */}
          <div
            style={{
              flex: window.innerWidth < 768 ? '1 1 100%' : '2 1 600px',
              width: '100%',
            }}
          >
            {selectedStudent ? (
              <div
                style={{
                  background: 'rgba(39, 45, 49, 0.8)',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#4C91B6',
                    padding: '1rem',
                    color: '#ffffff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <h5
                    style={{
                      margin: 0,
                      fontSize: window.innerWidth < 768 ? '1rem' : '1.25rem',
                    }}
                  >
                    Records for {selectedStudent.name} (Admission No:{' '}
                    {selectedStudent.admissionNo || 'N/A'})
                  </h5>
                  <button
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #ffffff',
                      color: '#ffffff',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'background-color 0.3s',
                      fontSize: '0.875rem',
                    }}
                    onClick={() => setShowModal(true)}
                    onMouseOver={(e) =>
                      (e.target.style.backgroundColor = '#357a9d')
                    }
                    onMouseOut={(e) =>
                      (e.target.style.backgroundColor = 'transparent')
                    }
                  >
                    <FaPlus style={{ marginRight: '0.25rem' }} /> Add
                  </button>
                </div>
                <div style={{ padding: '1rem' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        color: '#ffffff',
                        fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem',
                      }}
                    >
                      <thead
                        style={{ backgroundColor: '#4C91B6', color: '#ffffff' }}
                      >
                        <tr>
                          <th
                            style={{
                              padding: '0.75rem',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                            }}
                          >
                            Term
                          </th>
                          <th
                            style={{
                              padding: '0.75rem',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                            }}
                          >
                            Punctuality
                          </th>
                          <th
                            style={{
                              padding: '0.75rem',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                            }}
                          >
                            Classroom Behaviour
                          </th>
                          <th
                            style={{
                              padding: '0.75rem',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                            }}
                          >
                            Peer Interaction
                          </th>
                          <th
                            style={{
                              padding: '0.75rem',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                            }}
                          >
                            Comments
                          </th>
                          <th
                            style={{
                              padding: '0.75rem',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              textAlign: 'center',
                            }}
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {records
                          .filter(
                            (record) =>
                              record.student._id === selectedStudent._id
                          )
                          .map((record) => (
                            <tr
                              key={record._id}
                              style={{
                                borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                              }}
                            >
                              <td style={{ padding: '0.75rem' }}>
                                {record.term}
                              </td>
                              <td style={{ padding: '0.75rem' }}>
                                {record.punctuality.status || 'N/A'}
                              </td>
                              <td style={{ padding: '0.75rem' }}>
                                {record.classroomBehaviour.rating || 'N/A'}
                              </td>
                              <td style={{ padding: '0.75rem' }}>
                                {record.peerInteraction.quality || 'N/A'}
                              </td>
                              <td style={{ padding: '0.75rem' }}>
                                {record.teacherComments || 'None'}
                              </td>
                              <td
                                style={{
                                  padding: '0.75rem',
                                  textAlign: 'center',
                                }}
                              >
                                <button
                                  style={{
                                    backgroundColor: 'transparent',
                                    border: '1px solid #ffa500',
                                    color: '#ffa500',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '5px',
                                    marginBottom: "5px",
                                    transition: 'background-color 0.3s',
                                    fontSize: '0.875rem',
                                  }}
                                  onClick={() => {
                                    setEditingRecord(record);
                                    setFormData(record);
                                    setIsEditing(true);
                                    setShowModal(true);
                                  }}
                                  onMouseOver={(e) =>
                                    (e.target.style.backgroundColor =
                                      'rgba(255, 165, 0, 0.2)')
                                  }
                                  onMouseOut={(e) =>
                                    (e.target.style.backgroundColor =
                                      'transparent')
                                  }
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  style={{
                                    backgroundColor: 'transparent',
                                    border: '1px solid #ff6347',
                                    color: '#ff6347',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '5px',
                                    transition: 'background-color 0.3s',
                                    fontSize: '0.875rem',
                                  }}
                                  onClick={() => handleDelete(record._id)}
                                  onMouseOver={(e) =>
                                    (e.target.style.backgroundColor =
                                      'rgba(255, 99, 71, 0.2)')
                                  }
                                  onMouseOut={(e) =>
                                    (e.target.style.backgroundColor =
                                      'transparent')
                                  }
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          ))}
                        {records.filter(
                          (r) => r.student._id === selectedStudent._id
                        ).length === 0 && (
                          <tr>
                            <td
                              colSpan="6"
                              style={{
                                textAlign: 'center',
                                padding: '1.5rem',
                                color: '#ffffff',
                                fontSize: '1rem',
                              }}
                            >
                              No records for this student
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: 'rgba(76, 145, 182, 0.3)',
                  color: '#ffffff',
                  padding: '2rem',
                  borderRadius: '10px',
                  textAlign: 'center',
                  fontSize: '1rem',
                }}
              >
                Select a student to view or manage their records
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for Add/Edit */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
            marginTop: "100px",
          }}
        >
          <div
            style={{
              background: 'rgba(39, 45, 49, 0.9)',
              borderRadius: '10px',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div
              style={{
                backgroundColor: '#4C91B6',
                padding: '1rem',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTopLeftRadius: '10px',
                borderTopRightRadius: '10px',
              }}
            >
              <h5
                style={{
                  margin: 0,
                  fontSize: window.innerWidth < 768 ? '1.25rem' : '1.5rem',
                }}
              >
                {isEditing ? 'Edit Behavioral Record' : 'Add New Behavioral Record'}
              </h5>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                }}
                onClick={resetForm}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '1rem' }}>
                    Term
                  </label>
                  <input
                    type="text"
                    name="term"
                    value={formData.term}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '5px',
                      border: `1px solid ${formErrors.term ? '#ff6347' : '#4C91B6'}`,
                      backgroundColor: '#ffffff',
                      color: '#272d31',
                      fontSize: '1rem',
                    }}
                  />
                  {formErrors.term && (
                    <div style={{ color: '#ff6347', fontSize: '0.875rem' }}>
                      {formErrors.term}
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '1rem' }}>
                    Punctuality
                  </label>
                  <select
                    name="punctuality.status"
                    value={formData.punctuality.status}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '5px',
                      border: `1px solid ${
                        formErrors.punctualityStatus ? '#ff6347' : '#4C91B6'
                      }`,
                      backgroundColor: '#ffffff',
                      color: '#272d31',
                      marginBottom: '0.5rem',
                      fontSize: '1rem',
                    }}
                  >
                    <option value="">Select Status</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Satisfactory">Satisfactory</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                    <option value="Poor">Poor</option>
                  </select>
                  {formErrors.punctualityStatus && (
                    <div style={{ color: '#ff6347', fontSize: '0.875rem' }}>
                      {formErrors.punctualityStatus}
                    </div>
                  )}
                  <textarea
                    name="punctuality.comments"
                    value={formData.punctuality.comments}
                    onChange={handleChange}
                    placeholder="Comments"
                    rows="2"
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '5px',
                      border: `1px solid ${
                        formErrors.punctualityComments ? '#ff6347' : '#4C91B6'
                      }`,
                      backgroundColor: '#ffffff',
                      color: '#272d31',
                      fontSize: '1rem',
                    }}
                  />
                  {formErrors.punctualityComments && (
                    <div style={{ color: '#ff6347', fontSize: '0.875rem' }}>
                      {formErrors.punctualityComments}
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '1rem' }}>
                    Classroom Behavior
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formData.classroomBehaviour.rating}
                    onChange={handleRatingChange}
                    style={{
                      width: '100%',
                      marginBottom: '0.5rem',
                    }}
                  />
                  <small
                    style={{
                      display: 'block',
                      color: '#ffffff',
                      opacity: 0.8,
                      fontSize: '0.875rem',
                    }}
                  >
                    Rating: {formData.classroomBehaviour.rating}/5
                  </small>
                  <textarea
                    name="classroomBehaviour.comments"
                    value={formData.classroomBehaviour.comments}
                    onChange={handleChange}
                    placeholder="Comments"
                    rows="2"
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '5px',
                      border: `1px solid ${
                        formErrors.classroomBehaviourComments ? '#ff6347' : '#4C91B6'
                      }`,
                      backgroundColor: '#ffffff',
                      color: '#272d31',
                      fontSize: '1rem',
                    }}
                  />
                  {formErrors.classroomBehaviourComments && (
                    <div style={{ color: '#ff6347', fontSize: '0.875rem' }}>
                      {formErrors.classroomBehaviourComments}
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '1rem' }}>
                    Peer Interaction
                  </label>
                  <select
                    name="peerInteraction.quality"
                    value={formData.peerInteraction.quality}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '5px',
                      border: `1px solid ${
                        formErrors.peerInteractionQuality ? '#ff6347' : '#4C91B6'
                      }`,
                      backgroundColor: '#ffffff',
                      color: '#272d31',
                      marginBottom: '0.5rem',
                      fontSize: '1rem',
                    }}
                  >
                    <option value="">Select Quality</option>
                    <option value="Very Interactive">Very Interactive</option>
                    <option value="Friendly">Friendly</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Occasional Conflicts">Occasional Conflicts</option>
                    <option value="Isolated">Isolated</option>
                    <option value="Bullying Behavior">Bullying Behavior</option>
                  </select>
                  {formErrors.peerInteractionQuality && (
                    <div style={{ color: '#ff6347', fontSize: '0.875rem' }}>
                      {formErrors.peerInteractionQuality}
                    </div>
                  )}
                  <textarea
                    name="peerInteraction.comments"
                    value={formData.peerInteraction.comments}
                    onChange={handleChange}
                    placeholder="Comments"
                    rows="2"
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '5px',
                      border: `1px solid ${
                        formErrors.peerInteractionComments ? '#ff6347' : '#4C91B6'
                      }`,
                      backgroundColor: '#ffffff',
                      color: '#272d31',
                      fontSize: '1rem',
                    }}
                  />
                  {formErrors.peerInteractionComments && (
                    <div style={{ color: '#ff6347', fontSize: '0.875rem' }}>
                      {formErrors.peerInteractionComments}
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '1rem' }}>
                    Teacher Comments
                  </label>
                  <textarea
                    name="teacherComments"
                    value={formData.teacherComments}
                    onChange={handleChange}
                    placeholder="Overall comments"
                    rows="3"
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '5px',
                      border: `1px solid ${
                        formErrors.teacherComments ? '#ff6347' : '#4C91B6'
                      }`,
                      backgroundColor: '#ffffff',
                      color: '#272d31',
                      fontSize: '1rem',
                    }}
                  />
                  {formErrors.teacherComments && (
                    <div style={{ color: '#ff6347', fontSize: '0.875rem' }}>
                      {formErrors.teacherComments}
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '1rem' }}>
                    Discipline Records
                  </label>
                  <button
                    type="button"
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #4C91B6',
                      color: '#4C91B6',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '5px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                      transition: 'background-color 0.3s',
                      fontSize: '0.875rem',
                    }}
                    onClick={addDisciplineRecord}
                    onMouseOver={(e) =>
                      (e.target.style.backgroundColor = 'rgba(76, 145, 182, 0.2)')
                    }
                    onMouseOut={(e) =>
                      (e.target.style.backgroundColor = 'transparent')
                    }
                  >
                    <FaPlus style={{ marginRight: '0.25rem' }} /> Add Discipline
                  </button>
                  {formData.disciplineRecords.map((record, index) => (
                    <div
                      key={index}
                      style={{
                        background: 'rgba(76, 145, 182, 0.1)',
                        padding: '1rem',
                        borderRadius: '5px',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <select
                        value={record.type}
                        onChange={(e) =>
                          handleDisciplineChange(index, 'type', e.target.value)
                        }
                        required
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: '5px',
                          border: `1px solid ${
                            formErrors.disciplineRecords[index]?.type
                              ? '#ff6347'
                              : '#4C91B6'
                          }`,
                          backgroundColor: '#ffffff',
                          color: '#272d31',
                          marginBottom: '0.5rem',
                          fontSize: '1rem',
                        }}
                      >
                        <option value="">Select Type</option>
                        <option value="Verbal Warning">Verbal Warning</option>
                        <option value="Written Warning">Written Warning</option>
                        <option value="Detention">Detention</option>
                        <option value="Parent Conference">Parent Conference</option>
                        <option value="Suspension">Suspension</option>
                        <option value="Expulsion">Expulsion</option>
                        <option value="Other">Other</option>
                      </select>
                      {formErrors.disciplineRecords[index]?.type && (
                        <div style={{ color: '#ff6347', fontSize: '0.875rem' }}>
                          {formErrors.disciplineRecords[index].type}
                        </div>
                      )}
                      <input
                        type="text"
                        value={record.description}
                        onChange={(e) =>
                          handleDisciplineChange(index, 'description', e.target.value)
                        }
                        placeholder="Description"
                        required
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: '5px',
                          border: `1px solid ${
                            formErrors.disciplineRecords[index]?.description
                              ? '#ff6347'
                              : '#4C91B6'
                          }`,
                          backgroundColor: '#ffffff',
                          color: '#272d31',
                          marginBottom: '0.5rem',
                          fontSize: '1rem',
                        }}
                      />
                      {formErrors.disciplineRecords[index]?.description && (
                        <div style={{ color: '#ff6347', fontSize: '0.875rem' }}>
                          {formErrors.disciplineRecords[index].description}
                        </div>
                      )}
                      <input
                        type="date"
                        value={record.date}
                        onChange={(e) =>
                          handleDisciplineChange(index, 'date', e.target.value)
                        }
                        required
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: '5px',
                          border: `1px solid ${
                            formErrors.disciplineRecords[index]?.date
                              ? '#ff6347'
                              : '#4C91B6'
                          }`,
                          backgroundColor: '#ffffff',
                          color: '#272d31',
                          marginBottom: '0.5rem',
                          fontSize: '1rem',
                        }}
                      />
                      {formErrors.disciplineRecords[index]?.date && (
                        <div style={{ color: '#ff6347', fontSize: '0.875rem' }}>
                          {formErrors.disciplineRecords[index].date}
                        </div>
                      )}
                      <button
                        type="button"
                        style={{
                          backgroundColor: 'transparent',
                          border: '1px solid #ff6347',
                          color: '#ff6347',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '5px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          transition: 'background-color 0.3s',
                          fontSize: '0.875rem',
                        }}
                        onClick={() => removeDisciplineRecord(index)}
                        onMouseOver={(e) =>
                          (e.target.style.backgroundColor = 'rgba(255, 99, 71, 0.2)')
                        }
                        onMouseOut={(e) =>
                          (e.target.style.backgroundColor = 'transparent')
                        }
                      >
                        <FaTrash style={{ marginRight: '0.25rem' }} /> Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{
                      backgroundColor: '#4C91B6',
                      border: 'none',
                      color: '#ffffff',
                      padding: '0.5rem 1.5rem',
                      borderRadius: '5px',
                      fontWeight: 'bold',
                      transition: 'background-color 0.3s',
                      fontSize: '1rem',
                    }}
                    onMouseOver={(e) =>
                      (e.target.style.backgroundColor = '#357a9d')
                    }
                    onMouseOut={(e) =>
                      (e.target.style.backgroundColor = '#4C91B6')
                    }
                  >
                    {loading ? 'Saving...' : isEditing ? 'Update' : 'Save'}
                  </button>
                  <button
                    type="button"
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #4C91B6',
                      color: '#4C91B6',
                      padding: '0.5rem 1.5rem',
                      borderRadius: '5px',
                      transition: 'background-color 0.3s',
                      fontSize: '1rem',
                    }}
                    onClick={resetForm}
                    onMouseOver={(e) =>
                      (e.target.style.backgroundColor = 'rgba(76, 145, 182, 0.2)')
                    }
                    onMouseOut={(e) =>
                      (e.target.style.backgroundColor = 'transparent')
                    }
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BehavioralRecordForm;