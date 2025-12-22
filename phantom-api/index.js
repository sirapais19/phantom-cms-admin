import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

/**
 * ✅ CORS FIX:
 * Allow both dev ports (your CMS is on :8080, Vite sometimes :5173)
 */
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:8080"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // Express 5 wildcard options

/**
 * ✅ IMPORTANT FIX:
 * Increase JSON body limit to support base64 images.
 *
 * Note: base64 makes payload bigger than original file size (~33% bigger),
 * so use a bigger limit than your max upload.
 */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Supabase client (server-side only)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- Helpers: map DB <-> CMS ---
function mapDbToUi(p) {
  return {
    id: p.id,
    fullName: p.full_name,
    jerseyNumber: p.jersey_number,
    roleTag:
      p.role_tag === "CAPTAIN"
        ? "Captain"
        : p.role_tag === "COACH"
        ? "Coach"
        : "Player",
    position: p.position,
    tagline: p.tagline || "",
    bio: p.bio || "",
    photoUrl: p.photo_url || "",
    status: p.status === "ACTIVE" ? "active" : "inactive",
    socials: {
      instagram: p.instagram_url || "",
      tiktok: p.tiktok_url || "",
    },
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

function mapUiToDb(body) {
  return {
    full_name: body.fullName,
    jersey_number: body.jerseyNumber,
    role_tag:
      body.roleTag === "Captain"
        ? "CAPTAIN"
        : body.roleTag === "Coach"
        ? "COACH"
        : "PLAYER",
    position: body.position,
    tagline: body.tagline || null,
    bio: body.bio || null,
    photo_url: body.photoUrl || null,
    status: body.status === "active" ? "ACTIVE" : "INACTIVE",
    instagram_url: body.socials?.instagram || null,
    tiktok_url: body.socials?.tiktok || null,
  };
}

// --- Routes ---
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/api/players", async (req, res) => {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map(mapDbToUi));
});

app.post("/api/players", async (req, res) => {
  try {
    const payload = mapUiToDb(req.body);

    const { data, error } = await supabase
      .from("players")
      .insert(payload)
      .select("*")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(mapDbToUi(data));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error while creating player" });
  }
});

app.put("/api/players/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const payload = mapUiToDb(req.body);

    const { data, error } = await supabase
      .from("players")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(mapDbToUi(data));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error while updating player" });
  }
});

app.delete("/api/players/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("players").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });

  res.status(204).send();
});

/**
 * ✅ Nice error message for "Payload Too Large"
 */
app.use((err, req, res, next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ error: "Upload too large (payload too big)" });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`✅ API running: http://localhost:${PORT}`);
});
