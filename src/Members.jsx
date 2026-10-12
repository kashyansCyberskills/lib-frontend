import { useEffect, useState } from "react";
import api, { errorMessage, formatDate, getUser } from "./api";

const ROLES = ["MEMBER", "LIBRARIAN", "ADMIN"];

function Members() {
      const me = getUser();
      const isAdmin = me.role === "ADMIN";
      const [members, setMembers] = useState([]);
      const [notice, setNotice] = useState({ type: "", text: "" });

      useEffect(() => {
            let active = true;
            api.get("/members")
                  .then((response) => active && setMembers(response.data))
                  .catch(() => active && setNotice({ type: "error", text: "Unable to load members." }));
            return () => { active = false; };
      }, []);

      async function changeRole(member, role) {
            try {
                  const response = await api.put(`/members/${member.id}/role`, { role });
                  setMembers(members.map((m) => (m.id === member.id ? response.data : m)));
                  setNotice({ type: "ok", text: `${member.name} is now ${role.toLowerCase()}.` });
            } catch (err) {
                  setNotice({ type: "error", text: errorMessage(err, "Could not change the role.") });
            }
      }

      async function deleteMember(member) {
            if (!window.confirm(`Delete ${member.name}'s account?`)) return;
            try {
                  await api.delete(`/members/${member.id}`);
                  setMembers(members.filter((m) => m.id !== member.id));
                  setNotice({ type: "ok", text: "Member deleted." });
            } catch (err) {
                  setNotice({ type: "error", text: errorMessage(err, "Could not delete the member.") });
            }
      }

      return (
            <>
                  <h1>Members</h1>
                  {notice.text && (
                        <p className={`notice ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>
                              {notice.text}
                        </p>
                  )}
                  {!isAdmin && <p className="muted">Only an admin can change roles or delete accounts.</p>}

                  <div className="table-wrap">
                        <table>
                              <thead>
                                    <tr>
                                          <th>ID</th>
                                          <th>Name</th>
                                          <th>Email</th>
                                          <th>Phone</th>
                                          <th>Joined</th>
                                          <th>Role</th>
                                          {isAdmin && <th>Actions</th>}
                                    </tr>
                              </thead>
                              <tbody>
                                    {members.map((member) => (
                                          <tr key={member.id}>
                                                <td>{member.id}</td>
                                                <td>{member.name}</td>
                                                <td>{member.email}</td>
                                                <td>{member.phone || "-"}</td>
                                                <td>{formatDate(member.joinedOn)}</td>
                                                <td>
                                                      {isAdmin && member.id !== Number(me.id) ? (
                                                            <select aria-label={`Role for ${member.name}`} value={member.role}
                                                                  onChange={(e) => changeRole(member, e.target.value)}>
                                                                  {ROLES.map((r) => <option key={r} value={r}>{r.toLowerCase()}</option>)}
                                                            </select>
                                                      ) : member.role.toLowerCase()}
                                                </td>
                                                {isAdmin && (
                                                      <td className="row-actions">
                                                            {member.id !== Number(me.id) && (
                                                                  <button className="danger" onClick={() => deleteMember(member)}>Delete</button>
                                                            )}
                                                      </td>
                                                )}
                                          </tr>
                                    ))}
                              </tbody>
                        </table>
                  </div>
            </>
      );
}

export default Members;
