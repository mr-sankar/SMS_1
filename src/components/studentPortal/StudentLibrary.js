import { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
  Alert,
  Pagination,
  Spinner,
  Tabs,
  Tab,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "animate.css";
import { toast } from "react-toastify";

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

export default function StudentLibrary() {
  const [books, setBooks] = useState([]);
  const [borrowedBooks, setBorrowedBooks] = useState([]);   // Currently borrowed (unreturned)
  const [returnedBooks, setReturnedBooks] = useState([]);   // Borrow history (returned)
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showBorrowConfirmation, setShowBorrowConfirmation] = useState(false);

  const [selectedBook, setSelectedBook] = useState(null);           // For borrowing
  const [selectedBorrowRecord, setSelectedBorrowRecord] = useState(null); // For returning

  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("available");

  const booksPerPage = 12;
  const categories = ["All", "Subject", "GK", "Politics", "Fiction", "Non-Fiction", "Science"];

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBooks(),
        fetchBorrowedBooks(),
        fetchReturnedBooks(),
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/books`, getAuthConfig());
      setBooks(res.data || []);
    } catch (err) {
      setError("Failed to fetch books");
      toast.error("Error fetching books");
    }
  };

  const fetchBorrowedBooks = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/borrowed`, getAuthConfig());
      const myBorrowed = (res.data || []).filter(
        (record) => record?.Borrowers?.name === user?.name
      );
      setBorrowedBooks(myBorrowed);
    } catch (err) {
      console.error(err);
      setBorrowedBooks([]);
    }
  };

  const fetchReturnedBooks = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/returned`, getAuthConfig());
      const myReturned = (res.data || []).filter(
        (record) => record?.Borrowers?.name === user?.name
      );
      setReturnedBooks(myReturned);
    } catch (err) {
      console.error(err);
      setReturnedBooks([]);
    }
  };

  // ==================== BORROW LOGIC ====================
  const handleBorrow = async (studentDetails) => {
    if (borrowedBooks.length >= 2) {
      toast.error("You can borrow a maximum of 2 books at a time.");
      return false;
    }
    if (borrowedBooks.some((r) => r?.book?._id === selectedBook?._id)) {
      toast.error("You have already borrowed this book.");
      return false;
    }

    try {
      await axios.post(
        `${BASE_URL}/api/borrow`,
        { bookId: selectedBook._id, Borrowers: studentDetails },
        getAuthConfig()
      );

      await Promise.all([fetchBooks(), fetchBorrowedBooks()]);
      setShowBorrowModal(false);
      setShowBorrowConfirmation(true);
      setSelectedBook(null);
      toast.success("Book borrowed successfully!");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to borrow book.");
      return false;
    }
  };

  // ==================== RETURN LOGIC ====================
  const handleReturn = async (returnData) => {
    if (!selectedBorrowRecord) return;

    try {
      await axios.post(
        `${BASE_URL}/api/return`,
        {
          borrowId: selectedBorrowRecord._id,
          fineAmount: returnData.fineAmount,
          finePaid: returnData.finePaid,
        },
        getAuthConfig()
      );

      await Promise.all([fetchBorrowedBooks(), fetchReturnedBooks(), fetchBooks()]);
      setShowReturnModal(false);
      setSelectedBorrowRecord(null);
      toast.success("Book returned successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to return book.");
    }
  };

  // Filtered & Paginated Available Books
  const filteredBooks = books.filter((book) => {
    if (!book) return false;
    const matchesSearch =
      (book.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.author || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const paginateBooks = () => {
    const indexOfLast = currentPage * booksPerPage;
    const indexOfFirst = indexOfLast - booksPerPage;
    return filteredBooks.slice(indexOfFirst, indexOfLast);
  };

  const totalBookPages = Math.ceil(filteredBooks.length / booksPerPage);

  const BookCard = ({ book }) => {
    if (!book) return null;

    const imageUrl = book.image
      ? book.image.startsWith("http")
        ? book.image
        : `${BASE_URL}${book.image}`
      : placeholder;

    const isAlreadyBorrowed = borrowedBooks.some((r) => r?.book?._id === book._id);

    return (
      <Col xs={6} sm={4} md={3} className="mb-3">
        <Card className="h-100 shadow-sm animate__animated animate__fadeIn">
          <Card.Img
            variant="top"
            src={imageUrl}
            style={{ height: "140px", objectFit: "cover" }}
            onError={(e) => (e.target.src = "https://via.placeholder.com/150?text=No+Image")}
          />
          <Card.Body className="p-2">
            <Card.Title className="mb-1" style={{ fontSize: "1rem" }}>
              {book.name}
            </Card.Title>
            <Card.Text className="small mb-1">by {book.author}</Card.Text>
            <Card.Text className="small mb-1">Cat: {book.category}</Card.Text>
            <div className="d-flex justify-content-between small">
              <span>Total: {book.total}</span>
              <span className={book.available > 0 ? "text-success" : "text-danger"}>
                Avail: {book.available}
              </span>
            </div>
          </Card.Body>
          <Card.Footer className="bg-transparent p-2">
            {book.available > 0 && !isAlreadyBorrowed ? (
              <Button
                style={{ backgroundColor: "#4C91B6", color: "white" }}
                size="sm"
                className="w-100"
                onClick={() => {
                  setSelectedBook(book);
                  setShowBorrowModal(true);
                }}
              >
                Borrow
              </Button>
            ) : isAlreadyBorrowed ? (
              <Button variant="warning" size="sm" className="w-100" disabled>
                Already Borrowed
              </Button>
            ) : (
              <Button variant="secondary" size="sm" className="w-100" disabled>
                Not Available
              </Button>
            )}
          </Card.Footer>
        </Card>
      </Col>
    );
  };

  // ==================== BORROW MODAL (Full Version) ====================
  const BorrowBookModal = ({ show, handleClose }) => {
    const [studentDetails, setStudentDetails] = useState({
      name: user?.name || "",
      class: "",
      section: "",
      borrowDate: new Date().toISOString().split("T")[0],
      returnDate: "",
    });
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [modalError, setModalError] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
      if (show) {
        const fetchStudentProfile = async () => {
          try {
            const res = await axios.get(
              `${BASE_URL}/api/student/profile?roleId=${user?.roleId || ""}`,
              getAuthConfig()
            );
            const { class: studentClass, section } = res.data || {};
            setStudentDetails((prev) => ({
              ...prev,
              class: studentClass || "",
              section: section || "",
            }));
          } catch (err) {
            setModalError("Failed to fetch profile.");
            toast.error("Error fetching profile data");
          }
        };
        fetchStudentProfile();
      }
    }, [show]);

    const handleChange = (e) => {
      setStudentDetails({ ...studentDetails, [e.target.name]: e.target.value });
      setModalError(null);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setModalError(null);
      setModalLoading(true);

      if (borrowedBooks.length >= 2) {
        setModalError("You cannot borrow more than 2 books.");
        setModalLoading(false);
        return;
      }
      if (!agreeToTerms) {
        setModalError("You must agree to the terms.");
        setModalLoading(false);
        return;
      }
      if (!studentDetails.section) {
        setModalError("Please select a section.");
        setModalLoading(false);
        return;
      }

      // Date validation
      const borrowDate = new Date(studentDetails.borrowDate);
      const returnDate = new Date(studentDetails.returnDate);
      const maxReturn = new Date(borrowDate);
      maxReturn.setDate(maxReturn.getDate() + 5);

      if (returnDate > maxReturn) {
        setModalError("Return date must be within 5 days.");
        setModalLoading(false);
        return;
      }

      const success = await handleBorrow(studentDetails);
      if (success) {
        setAgreeToTerms(false);
        setStudentDetails({
          name: user?.name || "",
          class: "",
          section: "",
          borrowDate: new Date().toISOString().split("T")[0],
          returnDate: "",
        });
      }
      setModalLoading(false);
    };

    return (
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Borrow: {selectedBook?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Student Name</Form.Label>
              <Form.Control type="text" value={studentDetails.name} readOnly plaintext />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Class</Form.Label>
              <Form.Control type="text" value={studentDetails.class} readOnly plaintext />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Section</Form.Label>
              <Form.Select name="section" value={studentDetails.section} onChange={handleChange} required>
                <option value="">Select Section</option>
                <option value="A">A</option>
                <option value="B">B</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Borrow Date</Form.Label>
              <Form.Control type="date" name="borrowDate" value={studentDetails.borrowDate} onChange={handleChange} min={new Date().toISOString().split("T")[0]} required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Return Date (max 5 days)</Form.Label>
              <Form.Control
                type="date"
                name="returnDate"
                value={studentDetails.returnDate}
                onChange={handleChange}
                min={studentDetails.borrowDate}
                max={new Date(new Date(studentDetails.borrowDate).setDate(new Date(studentDetails.borrowDate).getDate() + 5)).toISOString().split("T")[0]}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="I agree to return the book within 5 days. ₹10 fine per day late."
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
              />
            </Form.Group>

            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose} disabled={modalLoading}>
                Close
              </Button>
              <Button variant="primary" type="submit" disabled={modalLoading}>
                {modalLoading ? (
                  <>
                    <Spinner size="sm" animation="border" className="me-2" />
                    Borrowing...
                  </>
                ) : (
                  "Borrow Book"
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>
    );
  };

  // ==================== RETURN MODAL ====================
  const ReturnBookModal = ({ show, handleClose }) => {
    const [actualReturnDate, setActualReturnDate] = useState(new Date().toISOString().split("T")[0]);
    const [finePaid, setFinePaid] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);

    if (!selectedBorrowRecord?.book) return null;

    const dueDate = new Date(selectedBorrowRecord.Borrowers.returnDate);
    const returnDateObj = new Date(actualReturnDate);
    const daysLate = Math.max(0, Math.ceil((returnDateObj - dueDate) / (1000 * 3600 * 24)));
    const fineAmount = daysLate * 10;

    const onSubmit = async (e) => {
      e.preventDefault();
      setModalLoading(true);
      await handleReturn({ fineAmount, finePaid });
      setModalLoading(false);
    };

    return (
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Return: {selectedBorrowRecord.book.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            Due Date: <strong>{dueDate.toLocaleDateString()}</strong>
          </Alert>

          <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Actual Return Date</Form.Label>
              <Form.Control
                type="date"
                value={actualReturnDate}
                onChange={(e) => setActualReturnDate(e.target.value)}
                required
              />
            </Form.Group>

            {daysLate > 0 && (
              <Alert variant="danger">
                Late by {daysLate} day(s). Fine: <strong>₹{fineAmount}</strong>
              </Alert>
            )}

            {fineAmount > 0 && (
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="I confirm I have paid the fine"
                  checked={finePaid}
                  onChange={(e) => setFinePaid(e.target.checked)}
                />
              </Form.Group>
            )}

            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose} disabled={modalLoading}>
                Cancel
              </Button>
              <Button
                variant="success"
                type="submit"
                disabled={modalLoading || (fineAmount > 0 && !finePaid)}
              >
                {modalLoading ? "Processing..." : "Confirm Return"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>
    );
  };

  const BorrowConfirmationModal = ({ show, handleClose }) => (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Borrow Successful</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Book borrowed successfully!</p>
        <Alert variant="warning">
          Reminder: Return within 5 days to avoid ₹10/day fine.
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleClose}>
          OK
        </Button>
      </Modal.Footer>
    </Modal>
  );

  return (
    <Container fluid className="my-4" style={{ maxWidth: "1260px" }}>
      <h1 className="mb-4 text-center text-primary animate__animated animate__fadeIn">
        Student Library Portal
      </h1>

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="available" title="Available Books">
          <Row className="mb-4 align-items-center">
            <Col xs={12} md={8}>
              <Form>
                <Row className="g-2">
                  <Col xs={8}>
                    <Form.Control
                      type="text"
                      placeholder="Search by title or author"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </Col>
                  <Col xs={4}>
                    <Form.Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                </Row>
              </Form>
            </Col>
            <Col xs={12} md={4} className="text-md-end">
              <h5 className="text-white">
                Currently Borrowed: <strong>{borrowedBooks.length}/2</strong>
              </h5>
            </Col>
          </Row>

          {error && <Alert variant="danger">{error}</Alert>}

          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p>Loading books...</p>
            </div>
          ) : (
            <>
              <Row>
                {paginateBooks().map((book) => (
                  <BookCard key={book._id} book={book} />
                ))}
              </Row>

              {totalBookPages > 1 && (
                <Pagination className="justify-content-center mt-4">
                  <Pagination.Prev
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  />
                  {[...Array(totalBookPages)].map((_, i) => (
                    <Pagination.Item
                      key={i + 1}
                      active={i + 1 === currentPage}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    onClick={() => setCurrentPage((p) => Math.min(totalBookPages, p + 1))}
                    disabled={currentPage === totalBookPages}
                  />
                </Pagination>
              )}
            </>
          )}
        </Tab>

        <Tab eventKey="borrowed" title={`Currently Borrowed (${borrowedBooks.length})`}>
          <Row>
            {borrowedBooks.length === 0 ? (
              <Col xs={12}>
                <Alert variant="info">You have no currently borrowed books.</Alert>
              </Col>
            ) : (
              borrowedBooks.map((record) => {
                const book = record?.book;
                return (
                  <Col md={6} key={record._id} className="mb-3">
                    <Card className="shadow-sm">
                      <Card.Body>
                        <h5>{book?.name || "Unknown Book"}</h5>
                        <p><strong>Author:</strong> {book?.author || "N/A"}</p>
                        <p>
                          <strong>Due Date:</strong>{" "}
                          <span className="text-danger">
                            {new Date(record.Borrowers.returnDate).toLocaleDateString()}
                          </span>
                        </p>
                        <Button
                          variant="success"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setSelectedBorrowRecord(record);
                            setShowReturnModal(true);
                          }}
                        >
                          Return Book
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })
            )}
          </Row>
        </Tab>

        <Tab eventKey="history" title={`Borrow History (${returnedBooks.length})`}>
          <Row>
            {returnedBooks.length === 0 ? (
              <Col xs={12}>
                <Alert variant="info">No borrow history yet.</Alert>
              </Col>
            ) : (
              returnedBooks.map((record) => {
                const book = record?.book;
                return (
                  <Col md={6} key={record._id} className="mb-3">
                    <Card className="shadow-sm">
                      <Card.Body>
                        <h5>{book?.name || "Unknown Book"}</h5>
                        <p><strong>Author:</strong> {book?.author || "N/A"}</p>
                        <p>
                          Borrowed: {new Date(record.Borrowers.borrowDate).toLocaleDateString()} | 
                          Returned: {new Date(record.Borrowers.returnDate).toLocaleDateString()}
                        </p>
                        {record.fineAmount > 0 && (
                          <p className="text-danger">
                            Fine: ₹{record.fineAmount} ({record.finePaid ? "Paid" : "Pending"})
                          </p>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })
            )}
          </Row>
        </Tab>
      </Tabs>

      {/* Modals */}
      <BorrowBookModal
        show={showBorrowModal}
        handleClose={() => {
          setShowBorrowModal(false);
          setSelectedBook(null);
        }}
      />

      <ReturnBookModal
        show={showReturnModal}
        handleClose={() => {
          setShowReturnModal(false);
          setSelectedBorrowRecord(null);
        }}
      />

      <BorrowConfirmationModal
        show={showBorrowConfirmation}
        handleClose={() => setShowBorrowConfirmation(false)}
      />
    </Container>
  );
}
