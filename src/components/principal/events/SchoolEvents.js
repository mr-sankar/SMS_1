import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const SchoolEvents = () => {
  const [events, setEvents] = useState([]);
  const formRef = useRef(null);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    announcementDate: "",
    errors: {},
  });
  const [editingEvent, setEditingEvent] = useState(null);
  const [submittedEvents, setSubmittedEvents] = useState([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
 const [newEvent, setNewEvent] = useState({
  name: "",
  type: "",
  date: "",
  imageFile: null,      // ← Changed
  imageUrl: "",         // ← New
  volunteers: [],
  participants: [],
  errors: {},
});

const emptyEvent = {
  name: "",
  type: "",
  date: "",
  imageFile: null,
  imageUrl: "",
  volunteers: [],
  participants: [],
  errors: {},
};

  const ERROR_MESSAGES = {
    required: "This field is required",
    lettersOnly: "Only letters and spaces are allowed",
    pastDate: "Date cannot be in the past",
    invalidUrl: "Must be a valid URL (e.g., http:// or https://)",
    invalidContact: "Must be a 10-digit number starting with 6, 7, 8, or 9",
    positiveNumber: "Count must be a positive number",
    duplicateRole: "This role is already selected",
  };

const validate = () => {
  let errors = {};

  if (!newEvent.name) errors.name = ERROR_MESSAGES.required;
  if (!newEvent.type) errors.type = ERROR_MESSAGES.required;
  else if (!newEvent.type.match(/^[A-Za-z ]+$/)) errors.type = ERROR_MESSAGES.lettersOnly;

  if (!newEvent.date) errors.date = ERROR_MESSAGES.required;
  else if (new Date(newEvent.date) < new Date()) errors.date = ERROR_MESSAGES.pastDate;

  // Image validation: either file OR URL
  if (!newEvent.imageFile && !newEvent.imageUrl.trim()) {
    errors.img = "Either upload an image";
  } else if (newEvent.imageUrl.trim() && 
             !newEvent.imageUrl.match(/^https?:\/\/.+/i)) {
    errors.img = ERROR_MESSAGES.invalidUrl;
  }

  // ... rest of volunteer and participant validation remains same
  // volunteers and participants validation code...

  setNewEvent((prev) => ({ ...prev, errors }));
  return Object.keys(errors).length === 0;
};

  const validateAnnouncement = (announcement) => {
    let errors = {};
    if (!announcement.title) errors.title = ERROR_MESSAGES.required;
    if (!announcement.message) errors.message = ERROR_MESSAGES.required;
    if (!announcement.announcementDate) errors.announcementDate = ERROR_MESSAGES.required;
    else if (new Date(announcement.announcementDate) < new Date().setHours(0, 0, 0, 0))
      errors.announcementDate = ERROR_MESSAGES.pastDate;

    return errors;
  };

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/api/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(response.data);
      setSubmittedEvents(response.data);
    } catch (error) {
      // console.error("Error fetching events:", error);
      Swal.fire("Error", "Could not fetch events.", "error");
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/api/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnnouncements(response.data);
    } catch (error) {
      // console.error("Error fetching announcements:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchAnnouncements();
  }, []);

const handleChange = (e) => {
  const { name, value } = e.target;
  setNewEvent((prev) => ({ 
    ...prev, 
    [name]: value, 
    errors: { ...prev.errors, [name]: "", img: "" } 
  }));
};

// New handler for image URL
const handleImageUrlChange = (e) => {
  setNewEvent((prev) => ({
    ...prev,
    imageUrl: e.target.value,
    imageFile: null,        // Clear file if URL is entered
    errors: { ...prev.errors, img: "" }
  }));
};

// New handler for file upload
const handleImageFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setNewEvent((prev) => ({
      ...prev,
      imageFile: file,
      imageUrl: "",         // Clear URL if file is selected
      errors: { ...prev.errors, img: "" }
    }));
  }
};

  const handleVolunteerChange = (index, field, value) => {
    const updatedVolunteers = [...newEvent.volunteers];
    updatedVolunteers[index] = { ...updatedVolunteers[index], [field]: value };
    setNewEvent({ ...newEvent, volunteers: updatedVolunteers });
  };

  const handleParticipantChange = (index, field, value) => {
    const updatedParticipants = [...newEvent.participants];
    updatedParticipants[index] = { ...updatedParticipants[index], [field]: field === "count" ? parseInt(value) || 0 : value };
    setNewEvent({ ...newEvent, participants: updatedParticipants });
  };

  const addVolunteer = () => setNewEvent({ ...newEvent, volunteers: [...newEvent.volunteers, { name: "", contact: "", role: "" }] });
  const removeVolunteer = (index) => setNewEvent({ ...newEvent, volunteers: newEvent.volunteers.filter((_, i) => i !== index) });
  const addParticipant = () => setNewEvent({ ...newEvent, participants: [...newEvent.participants, { role: "", count: 1 }] });
  const removeParticipant = (index) => setNewEvent({ ...newEvent, participants: newEvent.participants.filter((_, i) => i !== index) });

  // Check if all 3 roles are selected
  const isAddParticipantDisabled = () => {
    const uniqueRoles = new Set(newEvent.participants.map(p => p.role).filter(role => role));
    return uniqueRoles.size >= 3;
  };

  const handleAnnouncementChange = (e) => {
    setNewAnnouncement({ ...newAnnouncement, [e.target.name]: e.target.value, errors: { ...newAnnouncement.errors, [e.target.name]: "" } });
  };

const handleAddEvent = async () => {
  if (validate()) {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      formData.append("name", newEvent.name);
      formData.append("type", newEvent.type);
      formData.append("date", newEvent.date);
      formData.append("volunteers", JSON.stringify(newEvent.volunteers));
      formData.append("participants", JSON.stringify(newEvent.participants));

      // Send either file or URL
      if (newEvent.imageFile) {
        formData.append("image", newEvent.imageFile);
      } else if (newEvent.imageUrl) {
        formData.append("imageUrl", newEvent.imageUrl);
      }

      const response = await axios.post(
        `${BASE_URL}/api/events`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Swal.fire("Success", response.data.message, "success");
window.location.reload();
      setNewEvent(emptyEvent);
      fetchEvents();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Failed to add event.", "error");
    }
  }
};

const handleUpdateEvent = async () => {
  if (validate()) {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      formData.append("name", newEvent.name);
      formData.append("type", newEvent.type);
      formData.append("date", newEvent.date);
      formData.append("volunteers", JSON.stringify(newEvent.volunteers));
      formData.append("participants", JSON.stringify(newEvent.participants));

      if (newEvent.imageFile) {
        formData.append("image", newEvent.imageFile);
      } else if (newEvent.imageUrl) {
        formData.append("imageUrl", newEvent.imageUrl);
      }

      const response = await axios.put(
        `${BASE_URL}/api/events/${editingEvent._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Swal.fire("Success", "Event updated successfully!", "success");

      setEditingEvent(null);
      setNewEvent(emptyEvent);
      fetchEvents();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Failed to update event.", "error");
    }
  }
};



  const handleDeleteEvent = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`${BASE_URL}/api/events/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          Swal.fire("Deleted", "Event removed successfully!", "success");
          fetchEvents();
        } catch (error) {
          Swal.fire("Error", "Failed to delete event.", "error");
        }
      }
    });
  };

 const handleEditEvent = (event) => {
  setEditingEvent(event);
  setNewEvent({
    name: event.name || "",
    type: event.type || "",
    date: event.date ? event.date.split("T")[0] + "T" + event.date.split("T")[1]?.substring(0, 5) : "",
    imageFile: null,
    imageUrl: event.img?.startsWith("http") ? event.img : "",  // If it's external URL
    volunteers: event.volunteers || [],
    participants: event.participants || [],
    errors: {},
  });
  formRef.current.scrollIntoView({ behavior: "smooth" });
};

  const handleAddAnnouncement = async () => {
    const errors = validateAnnouncement(newAnnouncement);
    setNewAnnouncement((prev) => ({ ...prev, errors }));
    if (Object.keys(errors).length === 0) {
      try {
        const token = localStorage.getItem("token");
        await axios.post(`${BASE_URL}/api/announcements`, newAnnouncement, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire("Success", "Announcement added successfully!", "success");
        setNewAnnouncement({ title: "", message: "", announcementDate: "", errors: {} });
        fetchAnnouncements();
      } catch (error) {
        Swal.fire("Error", "Failed to add announcement.", "error");
      }
    } else {
      Swal.fire("Error", "Please fix the errors in the form.", "error");
    }
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement({ ...announcement });
  };

  const handleUpdateAnnouncement = async () => {
    const errors = validateAnnouncement(editingAnnouncement);
    if (Object.keys(errors).length === 0) {
      try {
        const token = localStorage.getItem("token");
        await axios.put(
          `${BASE_URL}/api/announcements/${editingAnnouncement._id}`,
          editingAnnouncement,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire("Success", "Announcement updated successfully!", "success");
        setEditingAnnouncement(null);
        fetchAnnouncements();
      } catch (error) {
        Swal.fire("Error", "Failed to update announcement.", "error");
      }
    } else {
      setEditingAnnouncement((prev) => ({ ...prev, errors }));
      Swal.fire("Error", "Please fix the errors in the form.", "error");
    }
  };

  const handleDeleteAnnouncement = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`${BASE_URL}/api/announcements/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          Swal.fire("Deleted", "Announcement removed successfully!", "success");
          fetchAnnouncements();
        } catch (error) {
          Swal.fire("Error", "Failed to delete announcement.", "error");
        }
      }
    });
  };

  return (
    <div className="container py-5  min-vh-100"  style={{
      backgroundColor: "white",
      color: "#0000ff"
    }}
    >
      <h1 className="text-center mb-3 ms-4 text-red shadow-none"   style={{color:"#0000ff",fontSize: "48px" }}>School Events & Announcements</h1>

      {/* Event Form */}
      <div ref={formRef} className="card mb-5 shadow-none border-0">
        <div className="card-body">
          <h2 className="card-title text-center mb-4"
             style={{
           
              color: "#0000ff"
            }}>{editingEvent ? "Edit Event" : "Create New Event"}
            
          </h2>
          <div className="row g-3">
            <div className="col-md-12">
              <input
                type="text"
                name="name"
                placeholder="Event Name"
                value={newEvent.name}
                onChange={handleChange}
                className="form-control"
                 style={{ border: "2px solid #000", width:"50%"}}
              />
              {newEvent.errors.name && <small className="text-danger">{newEvent.errors.name}</small>}
            </div>
            
            <div className="col-md-12">
              <input
                type="text"
                name="type"
                placeholder="Event Type"
                value={newEvent.type}
                onChange={handleChange}
                className="form-control"
                 style={{ border: "2px solid #000", width:"50%" }}
              />
              {newEvent.errors.type && <small className="text-danger">{newEvent.errors.type}</small>}
            </div>
            <div className="col-md-12">
              <input
                type="datetime-local"
                name="date"
                value={newEvent.date}
                onChange={handleChange}
                className="form-control"
                 style={{ border: "2px solid #000", width:"50%" }}
              />
              {newEvent.errors.date && <small className="text-danger">{newEvent.errors.date}</small>}
            </div>
            <div className="col-12">
  <label className="form-label fw-bold">Event Image</label>
  <div className="row g-3">
    {/* File Upload */}
    <div className="col-md-6">
      <input
        type="file"
        name="image"
        accept="image/*"
        onChange={handleImageFileChange}
        className="form-control"
         style={{ border: "2px solid #000" }}
      />
      <small className="text-muted">Upload image file</small>
    </div>


  </div>
  
  {newEvent.errors.img && (
    <small className="text-danger d-block mt-1">{newEvent.errors.img}</small>
  )}

  {/* Preview */}
  {(newEvent.imageFile || newEvent.imageUrl) && (
    <div className="mt-3">
      <small className="text-success">Image Preview:</small>
      <img
        src={newEvent.imageFile 
          ? URL.createObjectURL(newEvent.imageFile) 
          : newEvent.imageUrl}
        alt="Preview"
        style={{ 
          maxHeight: "180px", 
          maxWidth: "100%", 
          objectFit: "contain",
          border: "1px solid #ddd",
          borderRadius: "8px",
          marginTop: "8px"
        }}
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    </div>
  )}
</div>
          </div>

          {/* Volunteers */}
          <h3 className="mt-4 mb-2" 
           style={{
           
            color: "#2D3A57"
          }} >Volunteers</h3>
          {newEvent.volunteers.map((vol, index) => (
            <div key={index} className="row g-3 mb-3 align-items-center">
              <div className="col-md-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={vol.name}
                  onChange={(e) => handleVolunteerChange(index, "name", e.target.value)}
                  className="form-control"
                />
                {newEvent.errors[`volunteer-${index}-name`] && (
                  <small className="text-danger">{newEvent.errors[`volunteer-${index}-name`]}</small>
                )}
              </div>
              
              <div className="col-md-3">
                <input
                  type="text"
                  placeholder="Contact"
                  value={vol.contact}
                  onChange={(e) => handleVolunteerChange(index, "contact", e.target.value)}
                  className="form-control"
                />
                {newEvent.errors[`volunteer-${index}-contact`] && (
                  <small className="text-danger">{newEvent.errors[`volunteer-${index}-contact`]}</small>
                )}
              </div>
              <div className="col-md-3">
                <input
                  type="text"
                  placeholder="Role"
                  value={vol.role}
                  onChange={(e) => handleVolunteerChange(index, "role", e.target.value)}
                  className="form-control"
                />
                {newEvent.errors[`volunteer-${index}-role`] && (
                  <small className="text-danger">{newEvent.errors[`volunteer-${index}-role`]}</small>
                )}
              </div>
              <div className="col-md-3">
                <button
                  onClick={() => removeVolunteer(index)}
                  className="btn btn-danger w-100"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button onClick={addVolunteer} className="btn btn-primary mt-2">Add Volunteer</button>

          {/* Participants */}
          <h3 className="mt-4 mb-2"
             style={{
           
              color: "#2D3A57"
            }}>Participants</h3>
          {newEvent.participants.map((part, index) => (
            <div key={index} className="row g-3 mb-3 align-items-center">
              <div className="col-md-4">
                <select
                  value={part.role}
                  onChange={(e) => handleParticipantChange(index, "role", e.target.value)}
                  className="form-select"
                >
                  <option value="">Select Role</option>
                  <option value="Student">Student</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Guest">Guest</option>
                </select>
                {newEvent.errors[`participant-${index}-role`] && (
                  <small className="text-danger">{newEvent.errors[`participant-${index}-role`]}</small>
                )}
              </div>
              <div className="col-md-4">
                <input
                  type="number"
                  placeholder="Count"
                  value={part.count}
                  onChange={(e) => handleParticipantChange(index, "count", e.target.value)}
                  className="form-control"
                />
                {newEvent.errors[`participant-${index}-count`] && (
                  <small className="text-danger">{newEvent.errors[`participant-${index}-count`]}</small>
                )}
              </div>
              <div className="col-md-4">
                <button
                  onClick={() => removeParticipant(index)}
                  className="btn btn-danger w-100"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button 
            onClick={addParticipant} 
            className="btn btn-primary mt-2"
            disabled={isAddParticipantDisabled()}
          >
            Add Participant
          </button>

          <div className="d-flex gap-3 mt-4">
            <button
              onClick={editingEvent ? handleUpdateEvent : handleAddEvent}
              className="btn btn-info"
            >
              {editingEvent ? "Update Event" : "Create Event"}
            </button>
            {editingEvent && (
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setNewEvent({ name: "", type: "", date: "", img: "", volunteers: [], participants: [], errors: {} });
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Submitted Events */}
      <h2 className="mb-4 " style={{ color: "#0000ff" }}>Upcoming Events</h2>
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {submittedEvents.length > 0 ? (
          submittedEvents.map((event) => (
            <div key={event._id} className="col">
              <div className="card h-100 shadow-sm">
                <img
  src={`${BASE_URL}${event.img}`}
  alt={event.name}
  style={{ height: "200px", objectFit: "cover" }}
/>
                <div className="card-body">
                  <h3 className="card-title text-primary">{event.name}</h3>
                  <p className="card-text">Type: {event.type}</p>
                  <p className="card-text">Date: {new Date(event.date).toLocaleString()}</p>
                  <h5 className="mt-2">Volunteers:</h5>
                  {event.volunteers.map((v, i) => (
                    <p key={i} className="text-muted mb-1">{v.name} ({v.role})</p>
                  ))}
                  <h5 className="mt-2">Participants:</h5>
                  {event.participants.map((p, i) => (
                    <p key={i} className="text-muted mb-1">{p.role}: {p.count}</p>
                  ))}
                </div>
                <div className="card-footer d-flex gap-2">
                  <button
                    onClick={() => handleEditEvent(event)}
                    className="btn  flex-grow-1"
                    style={
                      {
                        backgroundColor: "#99a8d6",
                        color:' color: #000',
                        border:'none'
                   
                      }
                    }
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event._id)}
                    className="btn  flex-grow-1"
                    style={
                      {
                        backgroundColor: "#99a8d6",
                        color:' color: #000',
                        border:'none'
                   
                      }
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted">No events yet.</p>
        )}
      </div>

      {/* Announcement Form */}
      <div className="card mt-5 shadow-sm">
        <div className="card-body"
        style={
          {
            background: "linear-gradient(135deg, #0B0E10, #7091E6, #0B0E10)",
        
       
          }
        }
        >
          <h2 className="card-title text-center text-white mb-4">Add Announcement</h2>
          <div className="row g-3">
            <div className="col-md-4">
              <input
                type="text"
                name="title"
                placeholder="Title"
                value={newAnnouncement.title}
                onChange={handleAnnouncementChange}
                className="form-control"
              />
              {newAnnouncement.errors.title && (
                <small className="text-danger">{newAnnouncement.errors.title}</small>
              )}
            </div>
            <div className="col-md-4">
              <input
                type="text"
                name="message"
                placeholder="Message"
                value={newAnnouncement.message}
                onChange={handleAnnouncementChange}
                className="form-control"
              />
              {newAnnouncement.errors.message && (
                <small className="text-danger">{newAnnouncement.errors.message}</small>
              )}
            </div>
            <div className="col-md-4">
              <input
                type="date"
                name="announcementDate"
                value={newAnnouncement.announcementDate}
                onChange={handleAnnouncementChange}
                className="form-control"
              />
              {newAnnouncement.errors.announcementDate && (
                <small className="text-danger">{newAnnouncement.errors.announcementDate}</small>
              )}
            </div>
          </div>
          <button
            onClick={handleAddAnnouncement}
            className="btn btn-primary mt-4 w-100"
            style={
              {
                backgroundColor: "#99a8d6",
                color:'black',
                border:'none'
           
              }
            }

          >
            Add Announcement
          </button>
        </div>
      </div>

      {/* Announcements */}
      <h2 className="mt-5 mb-4" style={{ color: "#0000ff" }}>Announcements</h2>
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <div key={announcement._id} className="col">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  {editingAnnouncement && editingAnnouncement._id === announcement._id ? (
                    <div>
                      <input
                        type="text"
                        value={editingAnnouncement.title}
                        onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                        className="form-control mb-2"
                      />
                      {editingAnnouncement.errors?.title && (
                        <small className="text-danger">{editingAnnouncement.errors.title}</small>
                      )}
                      <input
                        type="text"
                        value={editingAnnouncement.message}
                        onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, message: e.target.value })}
                        className="form-control mb-2"
                      />
                      {editingAnnouncement.errors?.message && (
                        <small className="text-danger">{editingAnnouncement.errors.message}</small>
                      )}
                      <input
                        type="date"
                        value={editingAnnouncement.announcementDate}
                        onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, announcementDate: e.target.value })}
                        className="form-control mb-2"
                      />
                      {editingAnnouncement.errors?.announcementDate && (
                        <small className="text-danger">{editingAnnouncement.errors.announcementDate}</small>
                      )}
                      <div className="d-flex gap-2">
                        <button
                          onClick={handleUpdateAnnouncement}
                          className="btn btn-success flex-grow-1"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingAnnouncement(null)}
                          className="btn btn-secondary flex-grow-1"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="card-title text-primary">📢 {announcement.title}</h3>
                      <p className="card-text">📝 {announcement.message}</p>
                      <p className="text-muted">
                        📅 {new Date(announcement.announcementDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
                {!editingAnnouncement || editingAnnouncement._id !== announcement._id ? (
                  <div className="card-footer d-flex gap-2">
                    <button
                      onClick={() => handleEditAnnouncement(announcement)}
                      className="btn btn-warning flex-grow-1"
                      style={
                        {
                          backgroundColor: "#99a8d6",
                          color:'black',
                          border:'none',
                        }
                      }
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAnnouncement(announcement._id)}
                      className="btn  flex-grow-1"
                      style={
                        {
                          backgroundColor: "#99a8d6",
                          color:'black',
                          border:'none'
                        }
                      }
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted">No announcements available.</p>
        )}
      </div>
    </div>
  );
};

export default SchoolEvents;