import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { getMyNotifications, markRead } from "../../services/notificationService";

export default function NotificationCenter() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = useCallback(async () => {
    try { setItems(await getMyNotifications(currentUser.uid)); } catch { /* best effort */ }
  }, [currentUser]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  async function openItem(n) {
    if (!n.read) { await markRead(n.id); }
    setOpen(false);
    await load();
    if (n.link) navigate(n.link);
  }

  return (
    <div className="notif" ref={ref}>
      <button className="notif-btn" aria-label="Notifications" onClick={() => { setOpen((v) => !v); if (!open) load(); }}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7M10 21h4" /></svg>
        {unread > 0 && <span className="notif-badge">{unread}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-head">Notifications</div>
          {items.length === 0 ? (
            <p className="notif-empty">You're all caught up.</p>
          ) : (
            <ul>
              {items.map((n) => (
                <li key={n.id}>
                  <button className={`notif-item ${n.read ? "" : "unread"}`} onClick={() => openItem(n)}>
                    {n.message}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
