import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import '../css/ProductosStyles.css';

// Función para obtener productos
const fetchProductos = async () => {
  const token = localStorage.getItem("token");
  
  console.log("Fetching with token:", token); // Debug log

  if (!token) throw new Error("No token");

  const res = await fetch("http://localhost:5031/api/Productos", {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  if (!res.ok) {
    console.error("Error response:", res.status);
    if (res.status === 401) {
      localStorage.removeItem("token");
      throw new Error("Token expired");
    }
    throw new Error("Failed to fetch");
  }

  return res.json();
};

// Función para crear o actualizar producto
const saveProducto = async ({ isEditing, form }) => {
  const token = localStorage.getItem("token");
  const url = isEditing
    ? `http://localhost:5031/api/productos/${form.id}`
    : "http://localhost:5031/api/productos";

  try {
    const res = await fetch(url, {
      method: isEditing ? "PUT" : "POST",
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

    const text = await res.text(); // Get response as text first
    
    if (!res.ok) {
      throw new Error(text || `Error ${res.status}: Error al guardar producto`);
    }

    // Only try to parse as JSON if there's content
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error('Save product error:', error);
    throw new Error(error.message || "Error al guardar producto");
  }
};

// Función para eliminar producto
const deleteProducto = async (id) => {
  const token = localStorage.getItem("token");
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
  console.log('=== Productos Component Mounted ===');

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isInitializing, setIsInitializing] = useState(true);
  const [form, setForm] = useState({ id: null, name: "", price: "", category: "" });
  const [formError, setFormError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const {
    data: productos = [],
    error,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["productos"],
    queryFn: fetchProductos,
    retry: 1,
    onError: (error) => {
      console.error("Query error:", error);
      if (error.message === "Token expired" || error.message === "No token") {
        navigate("/login", { replace: true });
      }
    }
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

  useEffect(() => {
    const init = async () => {
      console.log('=== Productos Effect Running ===');
      const token = localStorage.getItem("token");
      console.log('Current token:', token);

      if (!token) {
        console.log('No token found, redirecting...');
        navigate("/login", { replace: true });
        return;
      }

      try {
        console.log('Fetching products...');
        await refetch();
        console.log('Products fetched successfully');
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    init();

    return () => {
      console.log('=== Productos Effect Cleanup ===');
    };
  }, [navigate, refetch]);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (isInitializing) {
    return <div>Cargando productos...</div>;
  }

  const categorias = Array.from(new Set(productos.map((p) => p.category))).map((cat, i) => ({
    id: i,
    name: cat,
  }));

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Productos</h2>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
          >
            Cerrar Sesión
          </button>
        </div>

        <form onSubmit={handleSubmit} className="productos-form mb-8">
          <label>
            Nombre
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nombre del producto"
              className="input"
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
              className="input"
            />
          </label>

          <label>
            Categoría
            {isEditing ? (
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="input"
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
                  className="input"
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
            <button type="submit" disabled={mutationSave.isLoading} className="btn">
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
                  className="btn-edit"
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
      </div>
    </main>
  );
};

export default Productos;