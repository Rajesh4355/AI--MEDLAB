import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const isDbConnected = () => mongoose.connection.readyState === 1;

export const generateId = () => crypto.randomBytes(12).toString("hex");

const defaultPasswordHash = bcrypt.hashSync("password123", 10);

export const memoryStore = {
  users: [
    {
      _id: "65f1a0000000000000000001",
      name: "Demo Patient",
      email: "patient@aimedlab.com",
      password: defaultPasswordHash,
      role: "patient",
      gender: "male",
      bloodType: "O+",
      photo: "/img/team-4.jpeg",
      appointments: [],
    },
    {
      _id: "65f1a0000000000000000002",
      name: "Admin User",
      email: "admin@aimedlab.com",
      password: defaultPasswordHash,
      role: "admin",
      gender: "other",
      photo: "/img/team-1.jpeg",
      appointments: [],
    },
  ],
  doctors: [
    {
      _id: "65f1b0000000000000000101",
      name: "Dr. Alfaz Ahmed",
      email: "alfaz@aimedlab.com",
      password: defaultPasswordHash,
      role: "doctor",
      gender: "male",
      phone: 1234567890,
      photo: "/img/team-1.jpeg",
      ticketPrice: 120,
      specialization: "Surgeon",
      bio: "Senior General & Laparoscopic Surgeon with 12+ years experience.",
      about:
        "Dr. Alfaz Ahmed specializes in minimally invasive surgical procedures and post-operative patient recovery.",
      qualifications: [
        {
          startingDate: "2008-09-01",
          endingDate: "2013-06-01",
          degree: "MBBS",
          university: "Dhaka Medical College",
        },
        {
          startingDate: "2014-07-01",
          endingDate: "2018-06-01",
          degree: "MS in General Surgery",
          university: "Mount Adora Medical Institute",
        },
      ],
      experiences: [
        {
          startingDate: "2018-07-01",
          endingDate: "2026-01-01",
          position: "Senior Surgeon",
          hospital: "Mount Adora Hospital, Sylhet",
        },
      ],
      timeSlots: [
        { day: "monday", startingTime: "09:00", endingTime: "13:00" },
        { day: "wednesday", startingTime: "14:00", endingTime: "18:00" },
        { day: "friday", startingTime: "10:00", endingTime: "15:00" },
      ],
      reviews: [],
      averageRating: 4.8,
      totalRating: 272,
      isApproved: "approved",
      appointments: [],
    },
    {
      _id: "65f1b0000000000000000102",
      name: "Dr. Saleh Mahmud",
      email: "saleh@aimedlab.com",
      password: defaultPasswordHash,
      role: "doctor",
      gender: "male",
      phone: 1234567891,
      photo: "/img/team-2.jpeg",
      ticketPrice: 150,
      specialization: "Neurologist",
      bio: "Consultant Neurologist focused on stroke and headache disorders.",
      about:
        "Dr. Saleh Mahmud leads neuro-diagnostic evaluations and preventive brain health programs.",
      qualifications: [
        {
          startingDate: "2007-09-01",
          endingDate: "2012-06-01",
          degree: "MBBS",
          university: "Chittagong Medical College",
        },
        {
          startingDate: "2013-07-01",
          endingDate: "2017-06-01",
          degree: "MD in Neurology",
          university: "National Institute of Neurosciences",
        },
      ],
      experiences: [
        {
          startingDate: "2017-08-01",
          endingDate: "2026-01-01",
          position: "Consultant Neurologist",
          hospital: "Mount Adora Hospital, Sylhet",
        },
      ],
      timeSlots: [
        { day: "tuesday", startingTime: "10:00", endingTime: "14:00" },
        { day: "thursday", startingTime: "15:00", endingTime: "19:00" },
      ],
      reviews: [],
      averageRating: 4.8,
      totalRating: 215,
      isApproved: "approved",
      appointments: [],
    },
    {
      _id: "65f1b0000000000000000103",
      name: "Dr. Farid Uddin",
      email: "farid@aimedlab.com",
      password: defaultPasswordHash,
      role: "doctor",
      gender: "male",
      phone: 1234567892,
      photo: "/img/team-3.jpeg",
      ticketPrice: 100,
      specialization: "Dermatologist",
      bio: "Board-certified Dermatologist treating skin and allergy conditions.",
      about:
        "Dr. Farid Uddin provides comprehensive dermatological care, allergy testing, and skin pathology consultations.",
      qualifications: [
        {
          startingDate: "2009-09-01",
          endingDate: "2014-06-01",
          degree: "MBBS",
          university: "Sylhet MAG Osmani Medical College",
        },
        {
          startingDate: "2015-07-01",
          endingDate: "2018-06-01",
          degree: "DDV Dermatology",
          university: "BSMMU",
        },
      ],
      experiences: [
        {
          startingDate: "2018-09-01",
          endingDate: "2026-01-01",
          position: "Chief Dermatologist",
          hospital: "Mount Adora Hospital, Sylhet",
        },
      ],
      timeSlots: [
        { day: "sunday", startingTime: "09:30", endingTime: "13:30" },
        { day: "wednesday", startingTime: "10:00", endingTime: "14:00" },
      ],
      reviews: [],
      averageRating: 4.9,
      totalRating: 184,
      isApproved: "approved",
      appointments: [],
    },
  ],
  reviews: [],
  bookings: [],
};

export const sanitizeDoc = (doc) => {
  if (!doc) return null;
  const { password, ...rest } = doc;
  return rest;
};
