import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getUser, isStaff, money } from "./api";
import StatusStamp from "./StatusStamp";

function Dashboard() {
      const user = getUser();
      const staff = isStaff(user);
      const [stats, setStats] = useState(null);
      const [records, setRecords] = useState([]);
      const [failed, setFailed] = useState(false);

      useEffect(() => {
            let active = true;
            // Staff see library-wide numbers and what is overdue; members see their own loans.
            const requests = staff
                  ? [api.get("/borrow/stats"), api.get("/borrow/overdue")]
                  : [api.get("/borrow/my")];
            Promise.all(requests)
                  .then((responses) => {
                        if (!active) return;
                        if (staff) {
                              setStats(responses[0].data);
                              setRecords(responses[1].data);
                        } else {
                              setRecords(responses[0].data.filter((r) => r.status === "ISSUED"));
                        }
                  })
                  .catch(() => active && setFailed(true));
            return () => { active = false; };
      }, [staff]);

      return (
            <>
                  <h1>Welcome, {user.name}</h1>
                  {failed && <p className="notice error">Unable to load your dashboard. Check that the backend is running.</p>}

                  {staff && stats && (
                        <dl className="ledger">
                              <div><dt>Titles in catalogue</dt><dd>{stats.totalBooks}</dd></div>
                              <div><dt>Members</dt><dd>{stats.totalMembers}</dd></div>
                              <div><dt>Books out</dt><dd>{stats.issuedBooks}</dd></div>
                              <div className={stats.overdueBooks > 0 ? "alert" : ""}>
                                    <dt>Overdue</dt><dd>{stats.overdueBooks}</dd>
                              </div>
                        </dl>
                  )}

                  <h2>{staff ? "Overdue books" : "Books you have out"}</h2>
                  {records.length === 0 ? (
                        <p className="muted">
                              {staff
                                    ? "Nothing is overdue."
                                    : <>You have no books out. <Link to="/books">Browse the catalogue</Link>.</>}
                        </p>
                  ) : (
                        <div className="table-wrap">
                              <table>
                                    <thead>
                                          <tr>
                                                <th>Book</th>
                                                {staff && <th>Member</th>}
                                                <th>Status</th>
                                                <th>Fine so far</th>
                                          </tr>
                                    </thead>
                                    <tbody>
                                          {records.map((r) => (
                                                <tr key={r.id}>
                                                      <td>{r.bookTitle}</td>
                                                      {staff && <td>{r.memberName}</td>}
                                                      <td><StatusStamp record={r} /></td>
                                                      <td>{money(r.fine)}</td>
                                                </tr>
                                          ))}
                                    </tbody>
                              </table>
                        </div>
                  )}
            </>
      );
}

export default Dashboard;
