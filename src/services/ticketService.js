import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const ticketsCollection = collection(db, "tickets");

export async function createTicket(ticketData) {
  const docRef = await addDoc(ticketsCollection, {
    ...ticketData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: docRef.id,
  };
}

export async function getAllTickets() {
  const q = query(ticketsCollection, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));
}

export async function getTicketById(ticketId) {
  const docRef = doc(db, "tickets", ticketId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function getTicketsByEmail(email) {
  const q = query(
    ticketsCollection,
    where("email", "==", email),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));
}

export async function updateTicket(ticketId, updates) {
  const docRef = doc(db, "tickets", ticketId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function getTicketStats() {
  const tickets = await getAllTickets();

  return {
    total: tickets.length,
    open: tickets.filter((ticket) => ticket.status === "Open").length,
    inProgress: tickets.filter((ticket) => ticket.status === "In Progress").length,
    resolved: tickets.filter((ticket) => ticket.status === "Resolved").length,
    highPriority: tickets.filter((ticket) => ticket.priority === "High").length,
  };
}