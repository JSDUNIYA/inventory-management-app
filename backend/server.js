// backend/server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

const BASE = process.env.AIRTABLE_BASE_ID;
const TABLE = process.env.AIRTABLE_TABLE_ID;

const URL = `https://api.airtable.com/v0/${BASE}/${TABLE}`;

const headers = {
  Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
  "Content-Type": "application/json",
};

// Reusable Airtable API handler
async function airtableRequest(endpoint = "", options = {}) {
  const response = await fetch(`${URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || "Airtable API request failed"
    );
  }

  return data;
}

// GET: List all inventory records
app.get("/api/inventory", async (req, res) => {
  try {
    let records = [];
    let offset;

    do {
      const params = new URLSearchParams({
        returnFieldsByFieldId: "false",
      });

      if (offset) {
        params.append("offset", offset);
      }

      const data = await airtableRequest(`?${params}`);

      records = [...records, ...data.records];
      offset = data.offset;

    } while (offset);

    res.json(records);

  } catch (error) {
    console.error("GET inventory error:", error.message);

    res.status(500).json({
      message: error.message,
    });
  }
});

// POST: Add inventory item
app.post("/api/inventory", async (req, res) => {
  try {
    const data = await airtableRequest("", {
      method: "POST",
      body: JSON.stringify({
        fields: req.body,
      }),
    });

    res.status(201).json(data);

  } catch (error) {
    console.error("POST inventory error:", error.message);

    res.status(500).json({
      message: error.message,
    });
  }
});

// PATCH: Update inventory quantity
app.patch("/api/inventory/:id", async (req, res) => {
  try {
    const data = await airtableRequest("", {
      method: "PATCH",
      body: JSON.stringify({
        records: [
          {
            id: req.params.id,
            fields: {
              "Quantity in Stock": Number(req.body.quantity),
            },
          },
        ],
      }),
    });

    res.json(data);

  } catch (error) {
    console.error("PATCH inventory error:", error.message);

    res.status(500).json({
      message: error.message,
    });
  }
});

// DELETE: Remove inventory item
app.delete("/api/inventory/:id", async (req, res) => {
  try {
    const data = await airtableRequest(
      `/${req.params.id}`,
      {
        method: "DELETE",
      }
    );

    res.json(data);

  } catch (error) {
    console.error("DELETE inventory error:", error.message);

    res.status(500).json({
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Inventory API running on http://localhost:${PORT}`);
});