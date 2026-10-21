import {
  collection, getDocs, getDoc, doc, query, where, addDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const kbCol = collection(db, "knowledgeArticles");

/**
 * List articles. Employees may only read published public articles (the rules
 * reject a query that would return internal docs), so we scope the query by
 * role. Staff see everything.
 */
export async function getArticles({ isStaff }) {
  const q = isStaff
    ? kbCol
    : query(kbCol, where("visibility", "==", "public"), where("status", "==", "published"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getArticle(id) {
  const snap = await getDoc(doc(db, "knowledgeArticles", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function submitArticleFeedback(articleId, uid, helpful) {
  await addDoc(collection(db, "knowledgeArticles", articleId, "feedback"), {
    uid,
    helpful: !!helpful,
    at: serverTimestamp(),
  });
}
