import { useEffect, useState } from "react";
import api, { errorMessage, formatDate, getUser, isStaff, money } from "./api";
import StatusStamp from "./StatusStamp";

const FILTERS = [
      { key: "ALL", label: "All" },
      { key: "ISSUED", label: "Out now" },
      { key: "OVERDUE", label: "Overdue" },
      { key: "RETURNED", label: "Returned" }
];

function Borrow() {
      const staff = isStaff(getUser());
      const [records, setRecords] = useState([]);
      const [books, setBooks] = useState([]);
      const [members, setMembers] = useState([]);
      const [issueForm, setIssueForm] = useState({ memberId: "", bookId: "" });
      const [filter, setFilter] = useState("ALL");
      const [notice, setNotice] = useState({ type: "", text: "" });

      useEffect(() => {
            let active = true;
            // Staff run the desk (all records + who/what to issue); members only see their own history.
            const requests = staff
                  ? [api.get("/borrow"), api.get("/books"), api.get("/members")]
                  : [api.get("/borrow/my")];
            Promise.all(requests)
                  .then((responses) => {
                        if (!active) return;
                        setRecords(responses[0].data);
                        if (staff) {
                              setBooks(responses[1].data);
                              setMembers(responses[2].data);
                        }
                  })
                  .catch(() => active && setNotice({ type: "error", text: "Unable to load borrowing records." }));
            return () => { active = false; };
      }, [staff]);

      async function reload() {
            try {
                  const requests = staff
                        ? [api.get("/borrow"), api.get("/books")]
                        : [api.get("/borrow/my")];
                  const responses = await Promise.all(requests);
                  setRecords(responses[0].data);
                  if (staff) setBooks(responses[1].data);
            } catch (err) {
                  setNotice({ type: "error", text: errorMessage(err, "Unable to refresh records.") });
            }
      }

      async function issueBook(e) {
            e.preventDefault();
            try {
                  const response = await api.post("/borrow/issue", {
                        memberId: Number(issueForm.memberId),
                        bookId: Number(issueForm.bookId)
                  });
                  setNotice({
                        type: "ok",
                        text: `Issued "${response.data.bookTitle}" to ${response.data.memberName}. Due ${formatDate(response.data.dueDate)}.`
                  });
                  setIssueForm({ memberId: "", bookId: "" });
                  reload();
            } catch (err) {
                  setNotice({ type: "error", text: errorMessage(err, "Could not issue the book.") });
            }
      }

      async function returnBook(record) {
            try {
                  const response = await api.put(`/borrow/return/${record.id}`);
                  const fine = Number(response.data.fine);
                  setNotice({
                        type: "ok",
                        text: fine > 0
                              ? `"${record.bookTitle}" returned late. Fine to collect: ${money(fine)}.`
                              : `"${record.bookTitle}" returned on time.`
                  });
                  reload();
            } catch (err) {
                  setNotice({ type: "error", text: errorMessage(err, "Could not return the book.") });
            }
      }

      const visible = records.filter((r) => {
            if (filter === "ISSUED") return r.status === "ISSUED";
            if (filter === "OVERDUE") return r.overdue;
            if (filter === "RETURNED") return r.status === "RETURNED";
            return true;
      });
      const availableBooks = books.filter((b) => b.availableCopies > 0);

      return (
            <>
                  <h1>{staff ? "Borrowing" : "My books"}</h1>
                  {notice.text && (
                        <p className={`notice ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>
                              {notice.text}
                        </p>
                  )}

                  {staff && (
                        <section>
                              <h2>Issue a book</h2>
                              <form className="grid" onSubmit={issueBook}>
                                    <div>
                                          <label htmlFor="memberId">Member</label>
                                          <select id="memberId" required value={issueForm.memberId}
                                                onChange={(e) => setIssueForm({ ...issueForm, memberId: e.target.value })}>
                                                <option value="">Choose a member</option>
                                                {members.map((m) => (
                                                      <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                                                ))}
                                          </select>
                                    </div>
                                    <div>
                                          <label htmlFor="bookId">Book</label>
                                          <select id="bookId" required value={issueForm.bookId}
                                                onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}>
                                                <option value="">Choose a book</option>
                                                {availableBooks.map((b) => (
                                                      <option key={b.id} value={b.id}>
                                                            {b.title} ({b.availableCopies} available)
                                                      </option>
                                                ))}
                                          </select>
                                    </div>
                                    <div className="actions">
                                          <button type="submit">Issue book</button>
                                    </div>
                              </form>
                        </section>
                  )}

                  <section>
                        <h2>{staff ? "Records" : "Your borrowing history"}</h2>
                        <div className="tabs" role="group" aria-label="Filter records">
                              {FILTERS.map((f) => (
                                    <button key={f.key} type="button"
                                          className={filter === f.key ? "tab active" : "tab"}
                                          aria-pressed={filter === f.key}
                                          onClick={() => setFilter(f.key)}>{f.label}</button>
                              ))}
                        </div>

                        {visible.length === 0 ? (
                              <p className="muted">No records to show.</p>
                        ) : (
                              <div className="table-wrap">
                                    <table>
                                          <thead>
                                                <tr>
                                                      <th>Book</th>
                                                      {staff && <th>Member</th>}
                                                      <th>Issued</th>
                                                      <th>Status</th>
                                                      <th>Fine</th>
                                                      {staff && <th>Actions</th>}
                                                </tr>
                                          </thead>
                                          <tbody>
                                                {visible.map((r) => (
                                                      <tr key={r.id}>
                                                            <td>{r.bookTitle}</td>
                                                            {staff && <td>{r.memberName}</td>}
                                                            <td>{formatDate(r.issueDate)}</td>
                                                            <td><StatusStamp record={r} /></td>
                                                            <td>{money(r.fine)}</td>
                                                            {staff && (
                                                                  <td className="row-actions">
                                                                        {r.status === "ISSUED" && (
                                                                              <button onClick={() => returnBook(r)}>Return</button>
                                                                        )}
                                                                  </td>
                                                            )}
                                                      </tr>
                                                ))}
                                          </tbody>
                                    </table>
                              </div>
                        )}
                  </section>
            </>
      );
}

export default Borrow;
