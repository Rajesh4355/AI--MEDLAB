import bcrypt from "bcryptjs";

// Hash synchronous helper for initial seed
const hashPasswordSync = (password) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

const initialUsers = [
  {
    _id: "65d4a1b2c3d4e5f6a7b8c999",
    name: "System Admin",
    email: "admin@aimedlab.com",
    password: hashPasswordSync("admin123"),
    role: "admin",
    gender: "male",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
    appointments: [],
  },
  {
    _id: "65d4a1b2c3d4e5f6a7b8c998",
    name: "Sarah Jenkins",
    email: "patient@aimedlab.com",
    password: hashPasswordSync("patient123"),
    role: "patient",
    gender: "female",
    bloodType: "O+",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    appointments: [],
  },
  {
    _id: "65d4a1b2c3d4e5f6a7b8c9d0",
    name: "Dr. Alfaz Ahmed",
    email: "doctor@aimedlab.com",
    password: hashPasswordSync("doctor123"),
    role: "doctor",
    gender: "male",
    photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400",
    specialization: "Surgeon",
    ticketPrice: 100,
    appointments: [],
  },
];

const initialDoctors = [
  {
    _id: "65d4a1b2c3d4e5f6a7b8c9d0",
    id: "01",
    name: "Dr. Alfaz Ahmed",
    email: "doctor@aimedlab.com",
    password: hashPasswordSync("doctor123"),
    role: "doctor",
    specialization: "Surgeon",
    ticketPrice: 100,
    photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400",
    averageRating: 4.8,
    totalRating: 272,
    hospital: "Mount Adora Hospital, Sylhet",
    bio: "Chief Surgeon with 15+ years of clinical excellence in general and laparoscopic surgery.",
    about: "Dr. Alfaz Ahmed is a renowned specialist known for precision, compassionate patient care, and modern minimally invasive procedures.",
    isApproved: "approved",
    experiences: [
      { startingDate: "2010-01-01", endingDate: "2023-12-31", position: "Senior Surgeon", hospital: "Mount Adora Hospital" }
    ],
    qualifications: [
      { startingDate: "2000-01-01", endingDate: "2006-05-15", degree: "MBBS, MS", university: "Dhaka Medical College" }
    ],
    timeSlots: [
      { day: "Monday", startingTime: "09:00", endingTime: "13:00" },
      { day: "Wednesday", startingTime: "14:00", endingTime: "18:00" }
    ],
    reviews: [],
    appointments: [],
  },
  {
    _id: "65d4a1b2c3d4e5f6a7b8c9d1",
    id: "02",
    name: "Dr. Saleh Mahmud",
    email: "saleh@aimedlab.com",
    password: hashPasswordSync("doctor123"),
    role: "doctor",
    specialization: "Neurologist",
    ticketPrice: 120,
    photo: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400",
    averageRating: 4.9,
    totalRating: 198,
    hospital: "Apollo Neuroscience Institute",
    bio: "Consultant Neurologist specializing in neurodegenerative conditions and brain health.",
    about: "Dr. Saleh Mahmud has over a decade of experience diagnosing and treating complex neurological disorders with state-of-the-art diagnostic protocols.",
    isApproved: "approved",
    experiences: [
      { startingDate: "2012-03-01", endingDate: "2024-01-01", position: "Lead Neurologist", hospital: "Apollo Neuroscience Institute" }
    ],
    qualifications: [
      { startingDate: "2002-09-01", endingDate: "2008-06-30", degree: "MD, Neurology", university: "Johns Hopkins" }
    ],
    timeSlots: [
      { day: "Tuesday", startingTime: "10:00", endingTime: "15:00" },
      { day: "Thursday", startingTime: "10:00", endingTime: "15:00" }
    ],
    reviews: [],
    appointments: [],
  },
  {
    _id: "65d4a1b2c3d4e5f6a7b8c9d2",
    id: "03",
    name: "Dr. Farid Uddin",
    email: "farid@aimedlab.com",
    password: hashPasswordSync("doctor123"),
    role: "doctor",
    specialization: "Dermatologist",
    ticketPrice: 90,
    photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400",
    averageRating: 4.7,
    totalRating: 310,
    hospital: "City Health & Skin Center",
    bio: "Expert Dermatologist specializing in clinical dermatology, allergy, and skin therapy.",
    about: "Dr. Farid Uddin provides comprehensive diagnosis for complex skin diseases, fungal infections, and autoimmune dermatological manifestations.",
    isApproved: "approved",
    experiences: [
      { startingDate: "2014-06-01", endingDate: "2024-01-01", position: "Consultant Dermatologist", hospital: "City Health & Skin Center" }
    ],
    qualifications: [
      { startingDate: "2005-01-01", endingDate: "2011-12-15", degree: "MBBS, MD Dermatology", university: "King Edward Medical University" }
    ],
    timeSlots: [
      { day: "Monday", startingTime: "14:00", endingTime: "19:00" },
      { day: "Friday", startingTime: "09:00", endingTime: "13:00" }
    ],
    reviews: [],
    appointments: [],
  }
];

const initialBookings = [
  {
    _id: "booking_seed_01",
    doctor: initialDoctors[0],
    user: "65d4a1b2c3d4e5f6a7b8c998",
    ticketPrice: 100,
    status: "approved",
    isPaid: true,
    createdAt: new Date().toISOString(),
  }
];

const initialReviews = [
  {
    _id: "review_seed_01",
    doctor: "65d4a1b2c3d4e5f6a7b8c9d0",
    user: {
      _id: "65d4a1b2c3d4e5f6a7b8c998",
      name: "Sarah Jenkins",
      photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    },
    reviewText: "Excellent care and thorough explanation of symptoms. Highly recommended!",
    rating: 5,
    createdAt: new Date().toISOString(),
  }
];

class MockStore {
  constructor() {
    this.users = [...initialUsers];
    this.doctors = [...initialDoctors];
    this.bookings = [...initialBookings];
    this.reviews = [...initialReviews];
  }

  // Users
  getUserByEmail(email) {
    if (!email) return null;
    const lower = email.trim().toLowerCase();
    return this.users.find(u => u.email.toLowerCase() === lower) || null;
  }

  getUserById(id) {
    if (!id) return null;
    return this.users.find(u => String(u._id) === String(id)) || null;
  }

  getAllUsers() {
    return this.users.map(({ password, ...rest }) => rest);
  }

  createUser(userData) {
    const newUser = {
      _id: "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      appointments: [],
      ...userData,
    };
    this.users.push(newUser);
    return newUser;
  }

  updateUser(id, updateData) {
    const index = this.users.findIndex(u => String(u._id) === String(id));
    if (index === -1) return null;
    this.users[index] = { ...this.users[index], ...updateData };
    const { password, ...rest } = this.users[index];
    return rest;
  }

  deleteUser(id) {
    const index = this.users.findIndex(u => String(u._id) === String(id));
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }

  // Doctors
  getDoctorByEmail(email) {
    if (!email) return null;
    const lower = email.trim().toLowerCase();
    return this.doctors.find(d => d.email.toLowerCase() === lower) || null;
  }

  getDoctorById(id) {
    if (!id) return null;
    return this.doctors.find(d => String(d._id) === String(id) || String(d.id) === String(id)) || null;
  }

  getAllDoctors(query) {
    if (!query) {
      return this.doctors.map(({ password, ...rest }) => rest);
    }
    const q = query.toLowerCase();
    return this.doctors
      .filter(d => d.name.toLowerCase().includes(q) || d.specialization.toLowerCase().includes(q))
      .map(({ password, ...rest }) => rest);
  }

  createDoctor(doctorData) {
    const newDoctor = {
      _id: "doc_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      averageRating: 5.0,
      totalRating: 1,
      isApproved: "approved",
      experiences: [],
      qualifications: [],
      timeSlots: [],
      reviews: [],
      appointments: [],
      ...doctorData,
    };
    this.doctors.push(newDoctor);
    return newDoctor;
  }

  updateDoctor(id, updateData) {
    const index = this.doctors.findIndex(d => String(d._id) === String(id) || String(d.id) === String(id));
    if (index === -1) return null;
    this.doctors[index] = { ...this.doctors[index], ...updateData };
    const { password, ...rest } = this.doctors[index];
    return rest;
  }

  deleteDoctor(id) {
    const index = this.doctors.findIndex(d => String(d._id) === String(id) || String(d.id) === String(id));
    if (index === -1) return false;
    this.doctors.splice(index, 1);
    return true;
  }

  // Bookings
  createBooking({ doctorId, userId, ticketPrice, session }) {
    const doctor = this.getDoctorById(doctorId);
    const newBooking = {
      _id: "booking_" + Date.now(),
      doctor: doctor || { _id: doctorId, name: "Consulting Specialist", ticketPrice },
      user: userId,
      ticketPrice: ticketPrice || doctor?.ticketPrice || 100,
      session: session?.id || "mock_session_" + Date.now(),
      status: "approved",
      isPaid: true,
      createdAt: new Date().toISOString(),
    };
    this.bookings.push(newBooking);

    // Also link to doctor appointments
    if (doctor) {
      if (!doctor.appointments) doctor.appointments = [];
      doctor.appointments.push({
        patientName: "Patient Appointment",
        payment: "paid",
        price: String(newBooking.ticketPrice),
        bookedOn: new Date().toLocaleDateString(),
        testName: "General Consultation",
      });
    }

    return newBooking;
  }

  getBookingsByUserId(userId) {
    return this.bookings.filter(b => String(b.user) === String(userId));
  }

  getAllBookings() {
    return this.bookings;
  }

  // Reviews
  createReview(reviewData) {
    const newReview = {
      _id: "rev_" + Date.now(),
      createdAt: new Date().toISOString(),
      ...reviewData,
    };
    this.reviews.push(newReview);
    return newReview;
  }

  getAllReviews() {
    return this.reviews;
  }
}

export const mockStore = new MockStore();
export { initialDoctors as fallbackDoctors };
