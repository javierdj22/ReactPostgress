import { useEffect, useState } from "react";

export const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    id: null,
    name: "",
    price: "",
    category: ""
  });
  const [formError, setFormError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://localhost:7275/api/productos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        alert("No autorizado. Debes iniciar sesión.");
        setError("No autorizado");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(await res.text() || "Error al cargar productos");
      const data = await res.json();
      setProductos(data);

      
    
    const categoriasUnicas = data.filter((cat, index, self) =>
      index === self.findIndex((c) => c.category === cat.category)
    );
    setCategorias(categoriasUnicas.map(p => ({ id: p.id, name: p.category })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log("name", name);
    
    console.log("value", value);
    setForm(prev => ({ ...prev, [name]: value }));   
  };

  const validateForm = () => {
    if (!form.name.trim()) return "El nombre es obligatorio";
    if (!form.category.trim()) return "La categoría es obligatoria";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      return "El precio debe ser un número positivo";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) return setFormError(validationError);

    console.log("Form", form);
    try {
      const res = await fetch(
        isEditing
          ? `https://localhost:7275/api/productos/${form.id}`
          : "https://localhost:7275/api/productos",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            id: isEditing? form.id : 0,
            name: form.name,
            price: parseFloat(form.price),
            category: form.category
          })
        }
      );
      if (!res.ok) throw new Error((await res.json()).message || "Error al guardar producto");
      fetchProductos();
      setForm({ id: null, name: "", price: "", category: "" });
      setIsEditing(false);
      setFormError(null);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleEdit = (producto) => {
    setForm({
      id: producto.id,
      name: producto.name,
      price: producto.price.toString(),
      category: producto.category
    });
    setIsEditing(true);
    setFormError(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
      const res = await fetch(`https://localhost:7275/api/productos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error((await res.json()).message || "Error al eliminar producto");
      fetchProductos();
    } catch (err) {
      alert(err.message || "Error de conexión");
    }
  };

  return (
    <div className="container mt-5">
      <h2>Productos</h2>

      <form onSubmit={handleSubmit} className="mb-4">
        {/* Nombre */}
        <div className="mb-3">
          <label className="form-label">Nombre</label>
          <input
            type="text"
            name="name"
            className="form-control"
            value={form.name}
            onChange={handleChange}
            placeholder="Nombre del producto"
          />
        </div>

        {/* Precio */}
        <div className="mb-3">
          <label className="form-label">Precio</label>
          <input
            type="number"
            name="price"
            className="form-control"
            value={form.price}
            onChange={handleChange}
            placeholder="Precio"
            step="0.01"
            min="0"
          />
        </div>

        {/* Categoría */}
        <div className="mb-3">
          <label className="form-label">Categoría</label>
          {isEditing ? (
            <select
              name="category"
              className="form-control"
              value={form.category}
              onChange={handleChange}
            >
              {categorias.map(cat => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          ) : (
            <>
              <input
                list="categorias"
                name="category"
                className="form-control"
                value={form.category}
                onChange={handleChange}
                placeholder="Categoría"
              />
            </>
          )}
        </div>

        {formError && (
          <div className="alert alert-danger">{formError}</div>
        )}

        <button type="submit" className="btn btn-primary">
          {isEditing ? "Actualizar" : "Agregar"}
        </button>
        {isEditing && (
          <button
            type="button"
            className="btn btn-secondary ms-2"
            onClick={() => {
              setForm({ id: null, name: "", price: "", category: "" });
              setIsEditing(false);
              setFormError(null);
            }}
          >
            Cancelar
          </button>
        )}
      </form>

      {/* Estado de carga */}
      {loading && (
        <div className="text-center mt-5">
          <div className="spinner-border" role="status"></div>
        </div>
      )}
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      {!loading && !error && productos.length === 0 && (
        <div className="alert alert-info">No hay productos para mostrar.</div>
      )}

      {/* Lista */}
      <ul className="list-group">
        {productos.map(p => (
          <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>{p.name}</strong> – S/ {p.price.toFixed(2)}
              <span className="badge bg-info ms-2">{p.category}</span>
            </div>
            <div>
              <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(p)}>
                Editar
              </button>
              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.id)}>
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Productos;