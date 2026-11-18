
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001/api/inventory";

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    "Item Name": "",
    SKU: "",
    "Quantity in Stock": "",
    "Selling Price": "",
    "Unit Cost": "",
    "Reorder Level": ""
  });

  // Fetch inventory
  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError("");
  
      const response = await axios.get(API);
  
      console.log("Inventory API Response:", response.data);
  
      const records = Array.isArray(response.data)
        ? response.data
        : response.data.records || [];
  
      setItems(records);
  
    } catch (error) {
      console.error("Inventory fetch error:", error);
      setError("Unable to load inventory products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Handle input
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // Add product
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...form,
        "Quantity in Stock": Number(form["Quantity in Stock"]),
        "Selling Price": Number(form["Selling Price"]),
        "Unit Cost": Number(form["Unit Cost"]),
        "Reorder Level": Number(form["Reorder Level"])
      };

      await axios.post(API, payload);

      setForm({
        "Item Name": "",
        SKU: "",
        "Quantity in Stock": "",
        "Selling Price": "",
        "Unit Cost": "",
        "Reorder Level": ""
      });

      fetchInventory();

    } catch (err) {
      alert("Failed to add product: " + err.message);
    }
  };

  // Update quantity
  const updateQuantity = async (id, quantity) => {
    try {
      await axios.patch(`${API}/${id}`, {
        fields: {
          "Quantity in Stock": newQuantity
        }
      });

      fetchInventory();

    } catch (err) {
      alert("Update failed: " + err.message);
    }
  };

  // Delete product
  const deleteItem = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      await axios.delete(`${API}/${id}`);
      fetchInventory();

    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  // Search
  const filteredItems = items.filter((item) => {
    const fields = item.fields || {};

    return (
      fields["Item Name"]?.toLowerCase().includes(search.toLowerCase()) ||
      fields.SKU?.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Summary
  const totalProducts = items.length;

  const totalQuantity = items.reduce(
    (sum, item) =>
      sum + (Number(item.fields["Quantity in Stock"]) || 0),
    0
  );

  const totalValue = items.reduce(
    (sum, item) =>
      sum + (Number(item.fields["Stock Value"]) || 0),
    0
  );

  if (loading) {
    return <h2 className="loading">Loading inventory...</h2>;
  }

  if (error) {
    return (
      <div className="container">
        <h2>Unable to load inventory</h2>
        <p>{error}</p>
        <button onClick={fetchInventory}>Retry</button>
      </div>
    );
  }

  return (
    <div className="container">

      <h1>📦 Inventory Management</h1>

      {/* Dashboard */}

      <div className="summary">

        <div className="card">
          <h3>Total Products</h3>
          <h2>{totalProducts}</h2>
        </div>

        <div className="card">
          <h3>Total Stock</h3>
          <h2>{totalQuantity}</h2>
        </div>

        <div className="card">
          <h3>Stock Value</h3>
          <h2>${totalValue.toLocaleString("en-US")}</h2>
        </div>

      </div>

      {/* Add Product */}

      <h2>Add New Product</h2>

      <form onSubmit={handleSubmit}>

        <input
          name="Item Name"
          placeholder="Product Name"
          value={form["Item Name"]}
          onChange={handleChange}
          required
        />

        <input
          name="SKU"
          placeholder="SKU"
          value={form.SKU}
          onChange={handleChange}
          required
        />

        <input
          name="Quantity in Stock"
          type="number"
          placeholder="Quantity"
          value={form["Quantity in Stock"]}
          onChange={handleChange}
          min="0"
          required
        />

        <input
          name="Selling Price"
          type="number"
          placeholder="Selling Price"
          value={form["Selling Price"]}
          onChange={handleChange}
          min="0"
          required
        />

        <input
          name="Unit Cost"
          type="number"
          placeholder="Unit Cost"
          value={form["Unit Cost"]}
          onChange={handleChange}
          min="0"
          required
        />

        <input
          name="Reorder Level"
          type="number"
          placeholder="Reorder Level"
          value={form["Reorder Level"]}
          onChange={handleChange}
          min="0"
          required
        />

        <button type="submit">Add Product</button>

      </form>

      {/* Search */}

      <h2>Inventory List</h2>

      <input
        className="search"
        placeholder="Search by product name or SKU..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Inventory Table */}

      <table>

        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Quantity</th>
            <th>Selling Price</th>
            <th>Unit Cost</th>
            <th>Stock Value</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {filteredItems.map((item) => {
            const fields = item.fields;

            return (
              <tr key={item.id}>

                <td>{fields["Item Name"]}</td>

                <td>{fields.SKU}</td>

                <td>
                  <input
                    type="number"
                    min="0"
                    defaultValue={fields["Quantity in Stock"] ?? 0}
                    onBlur={(e) => {
                      if (
                        Number(e.target.value) !==
                        Number(fields["Quantity in Stock"])
                      ) {
                        updateQuantity(item.id, e.target.value);
                      }
                    }}
                  />
                </td>

                <td>${fields["Selling Price"]}</td>

                <td>${fields["Unit Cost"]}</td>

                <td>${fields["Stock Value"]}</td>

                <td>{fields["Stock Status"]}</td>

                <td>
                  <button
                    className="delete"
                    onClick={() => deleteItem(item.id)}
                  >
                    Delete
                  </button>
                </td>

              </tr>
            );
          })}

        </tbody>

      </table>

      {filteredItems.length === 0 && (
        <p>No inventory products found.</p>
      )}

    </div>
  );
}

export default App;