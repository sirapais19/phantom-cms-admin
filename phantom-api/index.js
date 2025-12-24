import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

/**
 * ✅ IMPORTANT FIX:
 * Prevent Express from returning 304 Not Modified (ETag caching).
 * Your frontend likely calls response.json(), but 304 has no body -> page becomes blank.
 */
app.set("etag", false);

// ✅ Always disable caching for API responses
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// ✅ CORS (allow Vercel + localhost)
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:8080",

  // ✅ add your Vercel production domain (if you have it)
  "https://phantom-cms-admin-git-main-siraps-projects.vercel.app/",
]);

// ✅ allow your Vercel preview deployments automatically
const vercelPreviewRegex =
  /^https:\/\/phantom-cms-admin-[a-z0-9-]+-siraps-projects\.vercel\.app$/i;

const corsOptions = {
  origin: (origin, callback) => {
    // requests like Postman/curl may have no origin
    if (!origin) return callback(null, true);

    if (allowedOrigins.has(origin) || vercelPreviewRegex.test(origin)) {
      return callback(null, true);
    }

    console.log("❌ Blocked by CORS:", origin);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

// Important: ensure caches/proxies treat different origins differently
app.use((req, res, next) => {
  res.setHeader("Vary", "Origin");
  next();
});

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));



// ✅ bigger limit for base64 image payloads
app.use(express.json({ limit: "60mb" }));
app.use(express.urlencoded({ extended: true, limit: "60mb" }));

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* -------------------------
   Helpers
-------------------------- */

function toTitleCase(s) {
  if (!s) return "";
  const str = String(s).toLowerCase();
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function normalizeEnum(value) {
  if (value === null || value === undefined) return null;
  return String(value).trim().toUpperCase();
}

function normalizeDate(value) {
  if (!value) return null;

  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const str = String(value).trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // dd/mm/yyyy
  const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);

  return null;
}

/**
 * ✅ More tolerant boolean parser:
 * supports true/false, 1/0, "true"/"false", "on"/"off", "yes"/"no"
 */
function boolFromAny(v) {
  if (v === true || v === false) return v;

  // handle numbers
  if (v === 1) return true;
  if (v === 0) return false;

  const s = String(v ?? "").trim().toLowerCase();
  if (s === "1" || s === "true" || s === "on" || s === "yes") return true;
  if (s === "0" || s === "false" || s === "off" || s === "no") return false;

  return false;
}

/**
 * Parse base64 data URL:
 * data:image/jpeg;base64,xxxxx
 */
function parseDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;

  const mime = match[1];
  const b64 = match[2];
  return { mime, b64 };
}

function extFromMime(mime) {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

/**
 * Upload DataURL to Supabase Storage bucket and return public URL
 */
async function uploadDataUrlToStorage({
  bucket,
  folder,
  dataUrl,
  filenameBase,
}) {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) throw new Error("Invalid image dataUrl");

  const { mime, b64 } = parsed;
  const ext = extFromMime(mime);

  const buffer = Buffer.from(b64, "base64");

  // use deterministic filename so each update replaces the old file
  const path = `${folder}/${filenameBase}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: mime,
    upsert: true,
    cacheControl: "3600",
  });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// ✅ Count helper (safe)
async function safeCount(builder) {
  const { count, error } = await builder;
  if (error) {
    // If table doesn't exist yet (e.g., news), return 0 instead of crashing dashboard
    if (error.code === "42P01") return 0;
    throw error;
  }
  return count || 0;
}

/* -------------------------
   Players mapping
-------------------------- */
function mapDbToUiPlayer(p) {
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

function mapUiToDbPlayer(body) {
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
    ultiscore_url: body.socials?.ultiscore || null,
  };
}


/* -------------------------
   Achievements mapping
-------------------------- */
function mapDbToUiAchievement(a) {
  return {
    id: a.id,
    year: a.year,
    title: a.title,
    description: a.description || "",
    category: a.category || "",
    isFeatured: !!a.is_featured,
    sortOrder: a.sort_order ?? 0,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  };
}

/**
 * ✅ FIXED:
 * accept more possible frontend keys so "Featured" switch actually saves
 * - isFeatured
 * - is_featured
 * - featured
 * - "on"/"off"
 */
function mapUiToDbAchievement(body) {
  const rawFeatured =
    body.isFeatured ??
    body.is_featured ??
    body.featured ?? // ✅ common frontend name
    body.isFeaturedAchievement; // (optional, harmless)

  return {
    year: Number(body.year),
    title: body.title,
    description: body.description || null,
    category: body.category || null,
    is_featured: boolFromAny(rawFeatured),
    sort_order:
      body.sortOrder !== undefined && body.sortOrder !== null
        ? Number(body.sortOrder)
        : 0,
  };
}

/* -------------------------
   Tournaments mapping
-------------------------- */
function mapDbToUiTournament(t) {
  return {
    id: t.id,
    name: t.name,
    startDate: t.start_date,
    endDate: t.end_date,
    location: t.location,
    division: toTitleCase(t.division),
    status: toTitleCase(t.status),
    isNext: !!t.is_next,
    isFeatured: !!t.is_featured,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
}

function mapUiToDbTournament(body) {
  const isNext =
    body.isNext ??
    body.is_next ??
    body.featuredNextTournament ??
    body.isFeaturedNext ??
    false;

  const isFeatured = body.isFeatured ?? body.is_featured ?? body.featured ?? false;

  return {
    name: body.name ?? body.tournamentName ?? body.tournament_name,
    start_date: normalizeDate(body.startDate ?? body.start_date),
    end_date: normalizeDate(body.endDate ?? body.end_date),
    location: body.location,
    division: normalizeEnum(body.division), // "Open" -> "OPEN"
    status: normalizeEnum(body.status), // "Upcoming" -> "UPCOMING"
    is_next: boolFromAny(isNext),
    is_featured: boolFromAny(isFeatured),
  };
}

/* -------------------------
   Team Media helpers
-------------------------- */
const TEAM_MEDIA_BUCKET = "team-media";
const TEAM_MEDIA_FOLDER = "assets";

/**
 * Store a SINGLE ROW in public.team_media
 */
const TEAM_MEDIA_ID = "00000000-0000-0000-0000-000000000001";

function mapDbToUiTeamMedia(row) {
  return {
    teamPhotoUrl: row?.team_photo_url || "",
    heroBannerUrl: row?.hero_banner_url || "",
    teamLogoUrl: row?.team_logo_url || "",
  };
}

function mapUiToDbTeamMedia(body) {
  const teamPhoto =
    body.teamPhotoUrl ?? body.teamPhoto ?? body.team_photo ?? null;
  const heroBanner =
    body.heroBannerUrl ?? body.heroBanner ?? body.hero_banner ?? null;
  const teamLogo = body.teamLogoUrl ?? body.teamLogo ?? body.team_logo ?? null;

  return {
    id: TEAM_MEDIA_ID,
    team_photo_url: teamPhoto,
    hero_banner_url: heroBanner,
    team_logo_url: teamLogo,
    updated_at: new Date().toISOString(),
  };
}

function pickMediaField(type) {
  const t = String(type || "").toLowerCase();
  if (t.includes("photo")) return "teamPhotoUrl";
  if (t.includes("hero")) return "heroBannerUrl";
  if (t.includes("logo")) return "teamLogoUrl";
  return null;
}

/* -------------------------
   Routes
-------------------------- */
app.get("/api/health", (req, res) => res.json({ ok: true }));

/* -------------------------
   ✅ DASHBOARD
   GET /api/dashboard
-------------------------- */
app.get("/api/dashboard", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Cards
    const activePlayers = await safeCount(
      supabase
        .from("players")
        .select("id", { count: "exact", head: true })
        .eq("status", "ACTIVE")
    );

    const achievements = await safeCount(
      supabase.from("achievements").select("id", { count: "exact", head: true })
    );

    const upcomingTournaments = await safeCount(
      supabase
        .from("tournaments")
        .select("id", { count: "exact", head: true })
        .eq("status", "UPCOMING")
        .gte("end_date", today)
    );

    // News is optional (safe if table not created yet)
    const publishedNews = await safeCount(
      supabase.from("news").select("id", { count: "exact", head: true }).eq("status", "PUBLISHED")
    );

    // Recent activity
    const limit = 10;

    const playersRecent = await supabase
      .from("players")
      .select("id, full_name, status, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit);

    const achievementsRecent = await supabase
      .from("achievements")
      .select("id, title, year, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit);

    const tournamentsRecent = await supabase
      .from("tournaments")
      .select("id, name, status, start_date, end_date, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit);

    // News may not exist -> don't crash dashboard
    let newsRecent = { data: [], error: null };
    try {
      const tmp = await supabase
        .from("news")
        .select("id, title, status, created_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (tmp.error && tmp.error.code !== "42P01") throw tmp.error;
      newsRecent = tmp;
    } catch (e) {
      newsRecent = { data: [], error: null };
    }

    if (playersRecent.error) throw playersRecent.error;
    if (achievementsRecent.error) throw achievementsRecent.error;
    if (tournamentsRecent.error) throw tournamentsRecent.error;

    const activity = [
      ...(playersRecent.data || []).map((p) => ({
        type: "player",
        id: p.id,
        title: p.full_name,
        subtitle: `Player • ${p.status}`,
        timestamp: p.updated_at || p.created_at,
      })),
      ...(achievementsRecent.data || []).map((a) => ({
        type: "achievement",
        id: a.id,
        title: a.title,
        subtitle: `Achievement • ${a.year}`,
        timestamp: a.updated_at || a.created_at,
      })),
      ...(tournamentsRecent.data || []).map((t) => ({
        type: "tournament",
        id: t.id,
        title: t.name,
        subtitle: `Tournament • ${t.status}`,
        timestamp: t.updated_at || t.created_at,
      })),
      ...(newsRecent.data || []).map((n) => ({
        type: "news",
        id: n.id,
        title: n.title,
        subtitle: `News • ${n.status}`,
        timestamp: n.updated_at || n.created_at,
      })),
    ]
      .filter((x) => x.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    // ✅ also return "dashboard-friendly" aliases in case your frontend expects them
    return res.json({
      stats: {
        activePlayers,
        achievements,
        upcomingTournaments,
        publishedNews,
        // aliases:
        totalPlayers: activePlayers,
        totalAchievements: achievements,
      },
      recentActivity: activity,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return res.status(500).json({ error: err.message || "Dashboard failed" });
  }
});

/** Players */
app.get("/api/players", async (req, res) => {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map(mapDbToUiPlayer));
});

app.post("/api/players", async (req, res) => {
  const payload = mapUiToDbPlayer(req.body);

  const { data, error } = await supabase
    .from("players")
    .insert(payload)
    .select("*")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(mapDbToUiPlayer(data));
});

app.put("/api/players/:id", async (req, res) => {
  const { id } = req.params;
  const payload = mapUiToDbPlayer(req.body);

  const { data, error } = await supabase
    .from("players")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(mapDbToUiPlayer(data));
});

app.delete("/api/players/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("players").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });

  res.status(204).send();
});

/** Achievements */
app.get("/api/achievements", async (req, res) => {
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .order("year", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map(mapDbToUiAchievement));
});

app.post("/api/achievements", async (req, res) => {
  const payload = mapUiToDbAchievement(req.body);

  if (!payload.title || !payload.year) {
    return res.status(400).json({ error: "title and year are required" });
  }

  const { data, error } = await supabase
    .from("achievements")
    .insert(payload)
    .select("*")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(mapDbToUiAchievement(data));
});

app.put("/api/achievements/:id", async (req, res) => {
  const { id } = req.params;
  const payload = mapUiToDbAchievement(req.body);

  const { data, error } = await supabase
    .from("achievements")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(mapDbToUiAchievement(data));
});

app.delete("/api/achievements/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("achievements").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });

  res.status(204).send();
});

/** Tournaments */
app.get("/api/tournaments", async (req, res) => {
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .order("start_date", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map(mapDbToUiTournament));
});

app.post("/api/tournaments", async (req, res) => {
  const payload = mapUiToDbTournament(req.body);

  if (!payload.name) return res.status(400).json({ error: "name is required" });
  if (!payload.start_date)
    return res.status(400).json({ error: "startDate is required" });
  if (!payload.end_date)
    return res.status(400).json({ error: "endDate is required" });
  if (!payload.location)
    return res.status(400).json({ error: "location is required" });
  if (!payload.division)
    return res.status(400).json({ error: "division is required" });
  if (!payload.status)
    return res.status(400).json({ error: "status is required" });

  const { data, error } = await supabase
    .from("tournaments")
    .insert(payload)
    .select("*")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(mapDbToUiTournament(data));
});

app.put("/api/tournaments/:id", async (req, res) => {
  const { id } = req.params;
  const payload = mapUiToDbTournament(req.body);

  const { data, error } = await supabase
    .from("tournaments")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(mapDbToUiTournament(data));
});

app.delete("/api/tournaments/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("tournaments").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });

  res.status(204).send();
});

/** ✅ TEAM MEDIA */
app.get("/api/team-media", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("team_media")
      .select("*")
      .eq("id", TEAM_MEDIA_ID)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });

    return res.json(mapDbToUiTeamMedia(data));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to load team media" });
  }
});

app.put("/api/team-media", async (req, res) => {
  try {
    const body = req.body || {};

    // -------- format B (single update) --------
    if (body.type && body.dataUrl) {
      const uiField = pickMediaField(body.type);
      if (!uiField) return res.status(400).json({ error: "Invalid type" });

      let finalUrl = body.dataUrl;

      // If it's base64, upload to storage
      if (typeof finalUrl === "string" && finalUrl.startsWith("data:")) {
        const filenameBase =
          uiField === "teamPhotoUrl"
            ? "team_photo"
            : uiField === "heroBannerUrl"
            ? "hero_banner"
            : "team_logo";

        finalUrl = await uploadDataUrlToStorage({
          bucket: TEAM_MEDIA_BUCKET,
          folder: TEAM_MEDIA_FOLDER,
          dataUrl: finalUrl,
          filenameBase,
        });
      }

      // Load existing row
      const { data: current, error: curErr } = await supabase
        .from("team_media")
        .select("*")
        .eq("id", TEAM_MEDIA_ID)
        .maybeSingle();

      if (curErr) return res.status(500).json({ error: curErr.message });

      const mergedUi = {
        ...mapDbToUiTeamMedia(current),
        [uiField]: finalUrl,
      };

      const payload = mapUiToDbTeamMedia(mergedUi);

      const { data, error } = await supabase
        .from("team_media")
        .upsert(payload, { onConflict: "id" })
        .select("*")
        .single();

      if (error) return res.status(500).json({ error: error.message });

      return res.json(mapDbToUiTeamMedia(data));
    }

    // -------- format A (full update) --------
    const ui = {
      teamPhotoUrl: body.teamPhotoUrl ?? body.teamPhoto ?? body.team_photo ?? "",
      heroBannerUrl: body.heroBannerUrl ?? body.heroBanner ?? body.hero_banner ?? "",
      teamLogoUrl: body.teamLogoUrl ?? body.teamLogo ?? body.team_logo ?? "",
    };

    if (ui.teamPhotoUrl?.startsWith?.("data:")) {
      ui.teamPhotoUrl = await uploadDataUrlToStorage({
        bucket: TEAM_MEDIA_BUCKET,
        folder: TEAM_MEDIA_FOLDER,
        dataUrl: ui.teamPhotoUrl,
        filenameBase: "team_photo",
      });
    }

    if (ui.heroBannerUrl?.startsWith?.("data:")) {
      ui.heroBannerUrl = await uploadDataUrlToStorage({
        bucket: TEAM_MEDIA_BUCKET,
        folder: TEAM_MEDIA_FOLDER,
        dataUrl: ui.heroBannerUrl,
        filenameBase: "hero_banner",
      });
    }

    if (ui.teamLogoUrl?.startsWith?.("data:")) {
      ui.teamLogoUrl = await uploadDataUrlToStorage({
        bucket: TEAM_MEDIA_BUCKET,
        folder: TEAM_MEDIA_FOLDER,
        dataUrl: ui.teamLogoUrl,
        filenameBase: "team_logo",
      });
    }

    const payload = mapUiToDbTeamMedia(ui);

    const { data, error } = await supabase
      .from("team_media")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.json(mapDbToUiTeamMedia(data));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Failed to update team media" });
  }
});

// Optional: allow POST to behave like PUT (if your frontend uses POST)
app.post("/api/team-media", async (req, res) => {
  req.method = "PUT";
  return app._router.handle(req, res);
});

app.listen(PORT, () => {
  console.log(`✅ API running: http://localhost:${PORT}`);
});
