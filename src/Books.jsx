import { useEffect, useState } from "react";
import api, { errorMessage, getUser, isStaff } from "./api";

const emptyForm = {
      title: "",
      author: "",
      isbn: "",
      publishedYear: "",
      totalCopies: "1",
      categoryId: ""
};

function Books() {
      const staff = isStaff(getUser());
      const [books, setBooks] = useState([]);
      const [categories, setCategories] = useState([]);
      const [search, setSearch] = useState("");
      const [formData, setFormData] = useState(emptyForm);
      const [editingId, setEditingId] = useState(null);
      const [newCategory, setNewCategory] = useState("");
      const [notice, setNotice] = useState({ type: "", text: "" });

      useEffect(() => {
            let active = true;
            Promise.all([api.get("/books"), api.get("/categories")])
                  .then(([booksRes, categoriesRes]) => {
                        if (!active) return;
                        setBooks(booksRes.data);
                        setCategories(categoriesRes.data);
                  })
                  .catch(() => active && setNotice({ type: "error", text: "Unable to load the catalogue." }));
            return () => { active = false; };
      }, []);

      async function refreshBooks(term = search) {
            try {
                  const response = await api.get("/books", { params: term ? { search: term } : {} });
                  setBooks(response.data);
            } catch (err) {
                  setNotice({ type: "error", text: errorMessage(err, "Unable to load books.") });
            }
      }

      const handleChange = (e) => {
            setFormData({
                  ...formData,
                  [e.target.name]: e.target.value
            });
      };

      function handleSearch(e) {
            e.preventDefault();
            refreshBooks(search.trim());
      }

      function handleEdit(book) {
            setEditingId(book.id);
            setFormData({
                  title: book.title,
                  author: book.author,
                  isbn: book.isbn,
                  publishedYear: book.publishedYear ?? "",
                  totalCopies: String(book.totalCopies),
                  categoryId: book.category ? String(book.category.id) : ""
            });
            window.scrollTo({ top: 0, behavior: "smooth" });
      }

      function resetForm() {
            setEditingId(null);
            setFormData(emptyForm);
      }

      async function handleSubmit(e) {
            e.preventDefault();
            const payload = {
                  title: formData.title,
                  author: formData.author,
                  isbn: formData.isbn,
                  publishedYear: formData.publishedYear === "" ? null : Number(formData.publishedYear),
                  totalCopies: Number(formData.totalCopies),
                  categoryId: formData.categoryId === "" ? null : Number(formData.categoryId)
            };
            try {
                  if (editingId === null) {
                        await api.post("/books", payload);
                        setNotice({ type: "ok", text: "Book added." });
                  } else {
                        await api.put(`/books/${editingId}`, payload);
                        setNotice({ type: "ok", text: "Book updated." });
                  }
                  resetForm();
                  refreshBooks();
            } catch (err) {
                  setNotice({ type: "error", text: errorMessage(err, "Could not save the book.") });
            }
      }

      async function handleDelete(book) {
            if (!window.confirm(`Delete "${book.title}"?`)) return;
            try {
                  await api.delete(`/books/${book.id}`);
                  setNotice({ type: "ok", text: "Book deleted." });
                  refreshBooks();
            } catch (err) {
                  setNotice({ type: "error", text: errorMessage(err, "Could not delete the book.") });
            }
      }

      async function addCategory(e) {
            e.preventDefault();
            if (!newCategory.trim()) return;
            try {
                  const response = await api.post("/categories", { name: newCategory });
                  setCategories([...categories, response.data].sort((a, b) => a.name.localeCompare(b.name)));
                  setFormData({ ...formData, categoryId: String(response.data.id) });
                  setNewCategory("");
            } catch (err) {
                  setNotice({ type: "error", text: errorMessage(err, "Could not add the category.") });
            }
      }

      return (
            <>
                  <h1>Books</h1>
                  {notice.text && (
                        <p className={`notice ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>
                              {notice.text}
                        </p>
                  )}

                  {staff && (
                        <section>
                              <h2>{editingId === null ? "Add a book" : "Edit book"}</h2>
                              <form className="grid" onSubmit={handleSubmit}>
                                    <div>
                                          <label htmlFor="title">Title</label>
                                          <input id="title" name="title" required value={formData.title} onChange={handleChange} />
                                    </div>
                                    <div>
                                          <label htmlFor="author">Author</label>
                                          <input id="author" name="author" required value={formData.author} onChange={handleChange} />
                                    </div>
                                    <div>
                                          <label htmlFor="isbn">ISBN</label>
                                          <input id="isbn" name="isbn" required value={formData.isbn} onChange={handleChange} />
                                    </div>
                                    <div>
                                          <label htmlFor="publishedYear">Year published</label>
                                          <input id="publishedYear" name="publishedYear" type="number" min="1000" max="2100"
                                                value={formData.publishedYear} onChange={handleChange} />
                                    </div>
                                    <div>
                                          <label htmlFor="totalCopies">Copies owned</label>
                                          <input id="totalCopies" name="totalCopies" type="number" min="1" required
                                                value={formData.totalCopies} onChange={handleChange} />
                                    </div>
                                    <div>
                                          <label htmlFor="categoryId">Category</label>
                                          <select id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange}>
                                                <option value="">No category</option>
                                                {categories.map((c) => (
                                                      <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                          </select>
                                    </div>
                                    <div className="actions">
                                          <button type="submit">{editingId === null ? "Add book" : "Save changes"}</button>
                                          {editingId !== null && (
                                                <button type="button" className="secondary" onClick={resetForm}>Cancel</button>
                                          )}
                                    </div>
                              </form>

                              <form className="inline" onSubmit={addCategory}>
                                    <label htmlFor="newCategory">New category</label>
                                    <input id="newCategory" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
                                    <button type="submit" className="secondary">Add category</button>
                              </form>
                        </section>
                  )}

                  <section>
                        <form className="inline" onSubmit={handleSearch}>
                              <label htmlFor="search">Search by title or author</label>
                              <input id="search" value={search} onChange={(e) => setSearch(e.target.value)} />
                              <button type="submit">Search</button>
                              {search && (
                                    <button type="button" className="secondary"
                                          onClick={() => { setSearch(""); refreshBooks(""); }}>Clear</button>
                              )}
                        </form>

                        {books.length === 0 ? (
                              <p className="muted">No books match. {staff && "Add one with the form above."}</p>
                        ) : (
                              <div className="table-wrap">
                                    <table>
                                          <thead>
                                                <tr>
                                                      <th>Title</th>
                                                      <th>ISBN</th>
                                                      <th>Category</th>
                                                      <th>Year</th>
                                                      <th>Available</th>
                                                      {staff && <th>Actions</th>}
                                                </tr>
                                          </thead>
                                          <tbody>
                                                {books.map((book) => (
                                                      <tr key={book.id}>
                                                            <td>
                                                                  {book.title}
                                                                  <br /><small className="muted">{book.author}</small>
                                                            </td>
                                                            <td>{book.isbn}</td>
                                                            <td>{book.category ? book.category.name : "-"}</td>
                                                            <td>{book.publishedYear ?? "-"}</td>
                                                            <td>
                                                                  {book.availableCopies} of {book.totalCopies}
                                                                  {book.availableCopies === 0 && <span className="stamp overdue">All out</span>}
                                                            </td>
                                                            {staff && (
                                                                  <td className="row-actions">
                                                                        <button className="secondary" onClick={() => handleEdit(book)}>Edit</button>
                                                                        <button className="danger" onClick={() => handleDelete(book)}>Delete</button>
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

export default Books;
