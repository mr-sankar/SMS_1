import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  CircularProgress,
  Grid,
} from "@mui/material";
import { motion } from "framer-motion";
import axios from "axios";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";

const GOOGLE_MAPS_API_KEY = "AIzaSyAh5_Kpyp50F3pTseyYR9YzOm8JDuZ6CVo";

const loadGoogleMapsScript = (callback) => {
  if (window.google && window.google.maps) {
    callback();
    return;
  }

  const existingScript = document.getElementById("google-maps-script");
  if (!existingScript) {
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => callback();
    script.onerror = () => {
      console.error("Failed to load Google Maps script");
      callback();
    };

    document.head.appendChild(script);
  } else {
    callback();
  }
};

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL || "http://localhost:5000";

const BusDetails = () => {
  const location = useLocation();
  const [buses, setBuses] = useState(location.state?.buses || []);
  const [loading, setLoading] = useState(!location.state?.buses);
  const [selectedBus, setSelectedBus] = useState(null);
  const [busLocation, setBusLocation] = useState(null);
  const [mapScriptLoaded, setMapScriptLoaded] = useState(false);
  const [error, setError] = useState(null);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const locationIntervalRef = useRef(null);

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found, please log in");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    if (!location.state?.buses) {
      const fetchBuses = async () => {
        setLoading(true);
        try {
          const config = getAuthConfig();
          const response = await axios.get(`${BASE_URL}/driver-profiles`, config);
          setBuses(response.data);
        } catch (error) {
          console.error("Error fetching buses:", error);
          setError("Failed to load bus data");
        } finally {
          setLoading(false);
        }
      };
      fetchBuses();
    }
  }, [location.state]);

  useEffect(() => {
    loadGoogleMapsScript(() => {
      setMapScriptLoaded(true);
    });

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
      if (mapInstanceRef.current && markerRef.current) {
        markerRef.current.setMap(null);
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  const fetchBusLocation = async (busNumber, retryCount = 0, maxRetries = 3) => {
    try {
      const config = getAuthConfig();
      const response = await axios.get(
        `${BASE_URL}/driver/route/${busNumber}/location`,
        config
      );

      if (!response.data.success) {
        if (retryCount < maxRetries) {
          // console.warn(`Retry ${retryCount + 1} for bus ${busNumber}`);
          return fetchBusLocation(busNumber, retryCount + 1, maxRetries);
        }
        return { error: true, message: response.data.message || "Location not available" };
      }

      return {
        success: true,
        latitude: response.data.latitude,
        longitude: response.data.longitude,
      };
    } catch (error) {
      // console.error("Error fetching bus location:", error);
      if (retryCount < maxRetries) {
        return fetchBusLocation(busNumber, retryCount + 1, maxRetries);
      }
      return {
        error: true,
        message: error.response?.data?.message || "Failed to fetch location",
      };
    }
  };

  const initializeMap = (latitude, longitude) => {
    if (!window.google || !mapRef.current || !latitude || !longitude) return;

    if (mapInstanceRef.current) {
      markerRef.current.setMap(null);
    }

    const mapOptions = {
      center: { lat: latitude, lng: longitude },
      zoom: 15,
      mapTypeId: "roadmap",
    };

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
    markerRef.current = new window.google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map: mapInstanceRef.current,
      title: `Bus ${selectedBus?.busNumber} Location`,
    });
  };

  const updateMapLocation = (latitude, longitude) => {
    if (!latitude || !longitude) return;

    if (!mapInstanceRef.current || !markerRef.current) {
      initializeMap(latitude, longitude);
    } else {
      const newPosition = new window.google.maps.LatLng(latitude, longitude);
      markerRef.current.setPosition(newPosition);
      mapInstanceRef.current.panTo(newPosition);
    }
  };

  const handleCardClick = async (bus) => {
    if (selectedBus?.busNumber === bus.busNumber) {
      setSelectedBus(null);
      setBusLocation(null);
      setError(null);
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.setMap(null);
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    } else {
      setSelectedBus(bus);
      setError(null);
      const location = await fetchBusLocation(bus.busNumber);
      if (location.error) {
        setError(location.message);
        setBusLocation(null);
      } else {
        setBusLocation(location);
        if (location.success && mapScriptLoaded) {
          updateMapLocation(location.latitude, location.longitude);
        }
      }
    }
  };

  useEffect(() => {
    if (!selectedBus || !mapScriptLoaded) return;

    const updateLocation = async () => {
      const location = await fetchBusLocation(selectedBus.busNumber);
      if (location.error) {
        setError(location.message);
        setBusLocation(null);
      } else {
        setBusLocation(location);
        if (location.success) {
          updateMapLocation(location.latitude, location.longitude);
        }
      }
    };

    updateLocation();
    locationIntervalRef.current = setInterval(updateLocation, 3000);

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  }, [selectedBus, mapScriptLoaded]);

  if (loading) {
    return (
      <Box sx={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        bgcolor: "#f5f5f5"
      }}>
        <CircularProgress sx={{ color: "#1976d2" }} />
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ 
        p: { 
          xxs: 1, 
          xs: 1.5, 
          sm: 2, 
          md: 3 
        }, 
        maxWidth: { 
          xxs: "100%", 
          sm: "800px", 
          md: "1000px", 
          lg: "1200px" 
        }, 
        margin: "auto",
        minHeight: "100vh",
        bgcolor: "#f5f5f5",
        boxSizing: "border-box"
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            mb: { xxs: 1.5, xs: 2, sm: 2.5, md: 3 },
            fontSize: { 
              xxs: "1.25rem", 
              xs: "1.5rem", 
              sm: "1.75rem", 
              md: "2rem" 
            },
            fontWeight: 700,
            color: "#1a3c5e",
            textAlign: { xxs: "center", sm: "left" }
          }}
        >
          Bus Details
        </Typography>

        {error && (
          <Typography 
            color="error" 
            sx={{ 
              mb: { xxs: 1, xs: 1.5, sm: 2 },
              fontSize: { 
                xxs: "0.75rem", 
                xs: "0.875rem", 
                sm: "1rem" 
              },
              textAlign: "center",
              bgcolor: "#fee2e2",
              p: 1,
              borderRadius: "4px"
            }}
          >
            {error}
          </Typography>
        )}

        <Grid 
          container 
          spacing={{ 
            xxs: 1, 
            xs: 1.5, 
            sm: 2, 
            md: 3 
          }}
          sx={{ justifyContent: "center" }}
        >
          {buses.length > 0 ? (
            buses.map((bus) => (
              <Grid 
                item 
                xxs={12} 
                xs={6} 
                sm={4} 
                md={4} 
                key={bus._id}
              >
                <Card 
                  sx={{ 
                    bgcolor: selectedBus?.busNumber === bus.busNumber ? '#e3f2fd' : 'white',
                    transition: 'background-color 0.3s, transform 0.2s',
                    width: "100%",
                    minWidth: { xxs: "280px" },
                    maxWidth: { xxs: "340px", xs: "380px", sm: "none" },
                    mx: "auto",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 6px 16px rgba(0, 0, 0, 0.15)"
                    }
                  }}
                >
                  <CardActionArea 
                    onClick={() => handleCardClick(bus)}
                    sx={{ 
                      p: { xxs: 0.75, xs: 1, sm: 1.25 } 
                    }}
                  >
                    <CardContent 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        py: { xxs: 1.25, xs: 1.5, sm: 2 },
                        px: { xxs: 1.25, xs: 1.5, sm: 2 }
                      }}
                    >
                      <DirectionsBusIcon 
                        sx={{ 
                          color: '#1976d2', 
                          fontSize: { 
                            xxs: 24, 
                            xs: 26, 
                            sm: 30, 
                            md: 34 
                          },
                          mr: { xxs: 0.75, xs: 1, sm: 1.25 }
                        }} 
                      />
                      <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600, 
                            color: '#1976d2',
                            fontSize: { 
                              xxs: "0.875rem", 
                              xs: "0.9375rem", 
                              sm: "1rem", 
                              md: "1.125rem" 
                            },
                            lineHeight: 1.3,
                            mb: { xxs: 0.25, xs: 0.5 }
                          }}
                        >
                          Bus {bus.busNumber}
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 500, 
                            color: '#d81b60',
                            fontSize: { 
                              xxs: "0.75rem", 
                              xs: "0.8125rem", 
                              sm: "0.875rem", 
                              md: "0.9375rem" 
                            },
                            lineHeight: 1.4,
                            wordBreak: "break-word"
                          }}
                        >
                          {bus.driverName}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xxs={12}>
              <Typography 
                sx={{ 
                  fontSize: { 
                    xxs: "0.875rem", 
                    xs: "1rem", 
                    sm: "1.125rem" 
                  },
                  color: "#4b5563",
                  textAlign: "center",
                  py: 2
                }}
              >
                No buses available
              </Typography>
            </Grid>
          )}
        </Grid>

        {selectedBus && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
          >
            <Box 
              sx={{ 
                mt: { xxs: 2, xs: 2.5, sm: 3, md: 4 }, 
                p: { xxs: 1.25, xs: 1.5, sm: 2, md: 2.5 }, 
                bgcolor: "#ffffff", 
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                overflow: "hidden"
              }}
            >
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mb: { xxs: 1, xs: 1.5, sm: 2 },
                  fontSize: { 
                    xxs: "0.8125rem", 
                    xs: "0.875rem", 
                    sm: "1rem", 
                    md: "1.125rem" 
                  },
                  fontWeight: 600,
                  color: "#1a3c5e",
                  lineHeight: 1.4,
                  wordBreak: "break-word",
                  overflowWrap: "break-word"
                }}
              >
                Location for {selectedBus.driverName} (Bus {selectedBus.busNumber})
              </Typography>
              <Box 
                sx={{ 
                  height: { 
                    xxs: "250px", 
                    xs: "300px", 
                    sm: "350px", 
                    md: "400px" 
                  }, 
                  borderRadius: "8px", 
                  overflow: "hidden",
                  border: "1px solid #e5e7eb"
                }}
              >
                {!mapScriptLoaded ? (
                  <Box 
                    sx={{ 
                      display: "flex", 
                      justifyContent: "center", 
                      alignItems: "center", 
                      height: "100%",
                      bgcolor: "#f1f5f9"
                    }}
                  >
                    <CircularProgress sx={{ color: "#1976d2" }} />
                  </Box>
                ) : !busLocation || !busLocation.success ? (
                  <Box 
                    sx={{ 
                      display: "flex", 
                      justifyContent: "center", 
                      alignItems: "center", 
                      height: "100%",
                      bgcolor: "#f1f5f9"
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: "#4b5563",
                        fontSize: { 
                          xxs: "0.75rem", 
                          xs: "0.875rem", 
                          sm: "1rem" 
                        }
                      }}
                    >
                      {error || "Loading location..."}
                    </Typography>
                  </Box>
                ) : (
                  <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
                )}
              </Box>
              {busLocation && busLocation.success && !error && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mt: { xxs: 0.5, xs: 1 }, 
                    color: "#4b5563",
                    fontSize: { 
                      xxs: "0.75rem", 
                      xs: "0.875rem", 
                      sm: "1rem" 
                    }
                  }}
                >
                  Last Updated: {new Date().toLocaleString()}
                </Typography>
              )}
            </Box>
          </motion.div>
        )}
      </Box>
    </motion.div>
  );
};

export default BusDetails;