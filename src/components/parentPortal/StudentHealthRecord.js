import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Tooltip,
} from "@mui/material";
import {
  MedicalServices,
  Person,
  Favorite,
  Medication,
  Warning,
  EventNote,
  ArrowBack,
  Edit,
} from "@mui/icons-material";

// const BASE_URL =
//   process.env.NODE_ENV === "production"
//     ? process.env.REACT_APP_API_DEPLOYED_URL
//     : process.env.REACT_APP_API_URL;

const BASE_URL = process.env.REACT_APP_API_URL;

const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("Please log in to access this feature");
    throw new Error("No token found");
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

const api = axios.create({
  baseURL: BASE_URL,
  validateStatus: (status) => status >= 200 && status < 500,
});

const StudentHealthRecord = () => {
  const [healthRecord, setHealthRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [openConditionsModal, setOpenConditionsModal] = useState(false);
  const [openMedicationsModal, setOpenMedicationsModal] = useState(false);

  const [conditionsText, setConditionsText] = useState("");
  const [medicationsText, setMedicationsText] = useState("");

  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  const studentId = localStorage.getItem("selectedChild");

  useEffect(() => {
    const fetchHealthRecord = async () => {
      if (!studentId || studentId === "undefined") {
        setError("No student ID provided");
        setLoading(false);
        return;
      }

      try {
        const config = getAuthConfig();
        const response = await api.get(`/api/healthrecord/${studentId}`, config);

        if (response.status === 200) {
          setHealthRecord(response.data);
        } else if (response.status === 404) {
          setHealthRecord(null);
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          toast.error("Session expired. Please log in again.");
          navigate("/login");
        } else if (err.response?.status === 403) {
          setError("Access denied.");
        } else {
          setError("Failed to load health record");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHealthRecord();
  }, [studentId, navigate]);

  const handleBack = () => navigate(-1);

  // Open Conditions Modal
  const handleOpenConditionsModal = () => {
    const currentConditions = healthRecord?.chronicConditions
      ?.map(c => c.condition)
      ?.filter(Boolean)
      ?.join(", ") || "";

    setConditionsText(currentConditions);
    setOpenConditionsModal(true);
  };

  // Open Medications Modal
  const handleOpenMedicationsModal = () => {
    const currentMedications = healthRecord?.medications
      ?.map(m => m.name)
      ?.filter(Boolean)
      ?.join(", ") || "";

    setMedicationsText(currentMedications);
    setOpenMedicationsModal(true);
  };

  // Save Medical Conditions (Comma Separated)
  const handleSaveConditions = async () => {
    if (!healthRecord) return;
    setUpdating(true);

    try {
      const conditionsArray = conditionsText
        .split(",")
        .map(item => item.trim())
        .filter(item => item !== "");

      const config = getAuthConfig();
      const updatedRecord = {
        ...healthRecord,
        chronicConditions: conditionsArray.map(condition => ({ condition })),
      };

      const response = await api.put(`/api/healthrecord/${studentId}`, updatedRecord, config);

      if (response.status === 200) {
        setHealthRecord(response.data.data || updatedRecord);
        toast.success("Medical conditions updated successfully");
        setOpenConditionsModal(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update medical conditions");
    } finally {
      setUpdating(false);
    }
  };

  // Save Medications (Comma Separated)
  const handleSaveMedications = async () => {
    if (!healthRecord) return;
    setUpdating(true);

    try {
      const medicationsArray = medicationsText
        .split(",")
        .map(item => ({ name: item.trim() }))
        .filter(item => item.name !== "");

      const config = getAuthConfig();
      const updatedRecord = {
        ...healthRecord,
        medications: medicationsArray,
      };

      const response = await api.put(`/api/healthrecord/${studentId}`, updatedRecord, config);

      if (response.status === 200) {
        setHealthRecord(response.data.data || updatedRecord);
        toast.success("Medications updated successfully");
        setOpenMedicationsModal(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update medications");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress sx={{ color: "#6366f1" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mb: 2 }}>
          Back
        </Button>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" sx={{ color: "#0000ff", fontWeight: 600, display: "flex", alignItems: "center" }}>
          <MedicalServices sx={{ mr: 1.5, color: "#0000ff" }} />
          Student Health Record
        </Typography>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={handleBack}>
          Back
        </Button>
      </Box>

      {healthRecord ? (
        <Grid container spacing={3}>
          {/* Health Summary */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%", boxShadow: 3, borderRadius: 3 }}>
              <CardHeader title="Health Summary" avatar={<Person color="primary" />} />
              <CardContent>
                <Typography variant="body2" color="text.secondary">Blood Group</Typography>
                <Typography variant="h6" sx={{ mb: 2 }}>{healthRecord.bloodGroup || "N/A"}</Typography>

                <Typography variant="body2" color="text.secondary">Height</Typography>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {healthRecord.height?.value ? `${healthRecord.height.value} ${healthRecord.height.unit || "cm"}` : "N/A"}
                </Typography>

                <Typography variant="body2" color="text.secondary">Weight</Typography>
                <Typography variant="h6">
                  {healthRecord.weight?.value ? `${healthRecord.weight.value} ${healthRecord.weight.unit || "kg"}` : "N/A"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Medical Conditions */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: "100%", boxShadow: 3, borderRadius: 3 }}>
              <CardHeader
                title="Medical Conditions"
                avatar={<Favorite color="primary" />}
                action={
                  <Tooltip title="Edit Medical Conditions">
                    <IconButton onClick={handleOpenConditionsModal} color="primary">
                      <Edit />
                    </IconButton>
                  </Tooltip>
                }
              />
              <CardContent>
                {healthRecord.chronicConditions?.length > 0 ? (
                  <List dense>
                    {healthRecord.chronicConditions.map((cond, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemText primary={`• ${cond.condition}`} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary" align="center" py={3}>
                    No medical conditions recorded
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Medications */}
          <Grid item xs={12}>
            <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
              <CardHeader
                title="Current Medications"
                avatar={<Medication color="primary" />}
                action={
                  <Tooltip title="Edit Medications">
                    <IconButton onClick={handleOpenMedicationsModal} color="primary">
                      <Edit />
                    </IconButton>
                  </Tooltip>
                }
              />
              <CardContent>
                {healthRecord.medications?.length > 0 ? (
                  <List dense>
                    {healthRecord.medications.map((med, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemText primary={`• ${med.name}`} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary" align="center" py={3}>
                    No medications recorded
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Last Checkup & Emergency Notes */}
          {(healthRecord.lastCheckup || healthRecord.emergencyNotes) && (
            <Grid item xs={12}>
              <Grid container spacing={3}>
                {healthRecord.lastCheckup && (
                  <Grid item xs={12} md={8}>
                    <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
                      <CardHeader title="Last Checkup" avatar={<EventNote color="primary" />} />
                      <CardContent>
                        <Grid container spacing={3}>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">Date</Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {healthRecord.lastCheckup.date
                                ? new Date(healthRecord.lastCheckup.date).toLocaleDateString()
                                : "N/A"}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">Doctor</Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {healthRecord.lastCheckup.doctor || "N/A"}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">Findings</Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {healthRecord.lastCheckup.findings || "N/A"}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {healthRecord.emergencyNotes && (
                  <Grid item xs={12} md={4}>
                    <Card sx={{ boxShadow: 3, borderRadius: 3, border: "1px solid #f87171" }}>
                      <CardHeader title="Emergency Notes" avatar={<Warning sx={{ color: "#ef4444" }} />} />
                      <CardContent>
                        <Typography color="error" fontWeight={500}>
                          {healthRecord.emergencyNotes}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Grid>
          )}
        </Grid>
      ) : (
        <Alert severity="info">No health records found for this student.</Alert>
      )}

      {/* ====================== Edit Conditions Modal (Comma Separated) ====================== */}
      <Dialog open={openConditionsModal} onClose={() => setOpenConditionsModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Medical Conditions</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Enter medical conditions separated by commas:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={conditionsText}
            onChange={(e) => setConditionsText(e.target.value)}
            placeholder="Asthma, Diabetes Type 1, Severe Peanut Allergy, Epilepsy"
            helperText="Example: Asthma, High Blood Pressure, Thyroid Disorder"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConditionsModal(false)} disabled={updating}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveConditions}
            variant="contained"
            disabled={updating}
          >
            {updating ? <CircularProgress size={24} color="inherit" /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ====================== Edit Medications Modal (Comma Separated) ====================== */}
      <Dialog open={openMedicationsModal} onClose={() => setOpenMedicationsModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Medications</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Enter medications separated by commas:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={medicationsText}
            onChange={(e) => setMedicationsText(e.target.value)}
            placeholder="Paracetamol 500mg, Insulin injection, Vitamin D 1000 IU, Levothyroxine"
            helperText="Example: Paracetamol, Amoxicillin, Multivitamin"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMedicationsModal(false)} disabled={updating}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveMedications}
            variant="contained"
            disabled={updating}
          >
            {updating ? <CircularProgress size={24} color="inherit" /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentHealthRecord;
