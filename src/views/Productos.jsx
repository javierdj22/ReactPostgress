import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import '../css/ProductosStyles.css';

const token = localStorage.getItem("token");

// Función para obtener productos
const fetchProductos = async () => {
  const res = await fetch("http://localhost:5031/api/Productos", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("No autorizado. Debes iniciar sesión.");
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Error al cargar productos");
  }
  return res.json();
};

// Función para crear o actualizar producto
const saveProducto = async ({ isEditing, form }) => {
  const url = isEditing
    ? `http://localhost:5031/api/productos/${form.id}`
    : "http://localhost:5031/api/productos";

  const method = isEditing ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: isEditing ? form.id : 0,
      name: form.name,
      price: parseFloat(form.price),
      category: form.category,
    }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Error al guardar producto");
  }
  return res.json();
};

// Función para eliminar producto
const deleteProducto = async (id) => {
  const res = await fetch(`http://localhost:5031/api/productos/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Error al eliminar producto");
  }
  return true;
};

export const Productos = () => {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ id: null, name: "", price: "", category: "" });
  const [formError, setFormError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const {
    data: productos = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ["productos"],
    queryFn: fetchProductos,
    retry: false,
    onError: (err) => {
      if (err.message === "No autorizado. Debes iniciar sesión.") {
        alert(err.message);
      }
    },
  });

  const mutationSave = useMutation({
    mutationFn: saveProducto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      setForm({ id: null, name: "", price: "", category: "" });
      setIsEditing(false);
      setFormError(null);
    },
    onError: (err) => setFormError(err.message),
  });

  const mutationDelete = useMutation({
    mutationFn: deleteProducto,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productos"] }),
    onError: (err) => alert(err.message || "Error al eliminar"),
  });

  const categorias = Array.from(new Set(productos.map((p) => p.category))).map((cat, i) => ({
    id: i,
    name: cat,
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!form.name.trim()) return "El nombre es obligatorio";
    if (!form.category.trim()) return "La categoría es obligatoria";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      return "El precio debe ser un número positivo";
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) return setFormError(validationError);
    mutationSave.mutate({ isEditing, form });
  };

  const handleEdit = (producto) => {
    setForm({
      id: producto.id,
      name: producto.name,
      price: producto.price.toString(),
      category: producto.category,
    });
    setIsEditing(true);
    setFormError(null);
  };

  const handleDelete = (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
    mutationDelete.mutate(id);
  };

  return (
    <main className="productos-container">
      <h2>Productos</h2>

      <form onSubmit={handleSubmit} className="productos-form">
        <label>
          Nombre
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nombre del producto"
          />
        </label>

        <label>
          Precio
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="Precio"
            step="0.01"
            min="0"
          />
        </label>

        <label>
          Categoría
          {isEditing ? (
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              {categorias.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          ) : (
            <>
              <input
                list="categorias"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Categoría"
              />
              <datalist id="categorias">
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.name} />
                ))}
              </datalist>
            </>
          )}
        </label>

        {formError && <p className="form-error">{formError}</p>}

        <div className="form-buttons">
          <button type="submit" disabled={mutationSave.isLoading}>
            {mutationSave.isLoading
              ? isEditing ? "Actualizando..." : "Guardando..."
              : isEditing ? "Actualizar" : "Agregar"}
          </button>

          {isEditing && (
            <button
              type="button"
              className="btn-cancel"
              onClick={() => {
                setForm({ id: null, name: "", price: "", category: "" });
                setIsEditing(false);
                setFormError(null);
              }}
              disabled={mutationSave.isLoading}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {isLoading && (
        <div className="loader" aria-label="Cargando productos..."></div>
      )}

      {error && <p className="error-message">{error.message}</p>}

      {!isLoading && !error && productos.length === 0 && (
        <p className="info-message">No hay productos para mostrar.</p>
      )}

      <ul className="productos-list">
        {productos.map(p => (
          <li key={p.id} className="producto-item">
            <div className="producto-info">
              <strong>{p.name}</strong> – S/ {p.price.toFixed(2)}
              <span className="producto-category">{p.category}</span>
            </div>
            <div className="producto-actions">
              <button
                onClick={() => handleEdit(p)}
                disabled={mutationSave.isLoading}
                aria-label={`Editar ${p.name}`}
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                disabled={mutationDelete.isLoading}
                aria-label={`Eliminar ${p.name}`}
                className="btn-delete"
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
};

export default Productos;
