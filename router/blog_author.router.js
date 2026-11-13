const express = require("express");
const sdk = require("node-appwrite");
const appwriteClient = require("../config/app");
const auth = require("../middleware/auth");

const Router = express.Router();
const databases = new sdk.Databases(appwriteClient);
const authorFields = [
  "display_name",
  "slug",
  "role",
  "credentials",
  "bio",
  "profile_url",
  "bar_admissions",
  "is_active",
];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function collectionConfig() {
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_BLOG_AUTHOR_COLLECTION_ID;
  return databaseId && collectionId ? { databaseId, collectionId } : null;
}

function publicAuthor(author) {
  return {
    $id: author.$id,
    display_name: author.display_name,
    slug: author.slug,
    role: author.role,
    credentials: author.credentials,
    bio: author.bio,
    profile_url: author.profile_url,
    bar_admissions: author.bar_admissions,
  };
}

function validateAuthor(body, isUpdate = false) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "A JSON object is required" };
  }
  const payload = {};
  for (const field of authorFields) {
    if (Object.hasOwn(body, field)) payload[field] = body[field];
  }

  if (
    payload.display_name !== undefined &&
    (typeof payload.display_name !== "string" ||
      !payload.display_name.trim() ||
      payload.display_name.length > 200)
  ) {
    return { error: "display_name must be a non-empty string of at most 200 characters" };
  }
  if (
    payload.slug !== undefined &&
    (typeof payload.slug !== "string" ||
      payload.slug.length > 200 ||
      !slugPattern.test(payload.slug))
  ) {
    return { error: "slug must contain lowercase letters, numbers, and hyphens" };
  }
  for (const field of ["role", "credentials", "bio", "profile_url"]) {
    if (payload[field] !== undefined && typeof payload[field] !== "string") {
      return { error: `${field} must be a string` };
    }
  }
  if (
    payload.bar_admissions !== undefined &&
    (!Array.isArray(payload.bar_admissions) ||
      !payload.bar_admissions.every((item) => typeof item === "string"))
  ) {
    return { error: "bar_admissions must be an array of strings" };
  }
  if (
    payload.is_active !== undefined &&
    typeof payload.is_active !== "boolean"
  ) {
    return { error: "is_active must be a boolean" };
  }
  if (!isUpdate && (!payload.display_name || !payload.slug)) {
    return { error: "display_name and slug are required" };
  }
  return { payload };
}

async function ensureUniqueSlug(databaseId, collectionId, slug, exceptId) {
  const result = await databases.listDocuments(databaseId, collectionId, [
    sdk.Query.equal("slug", slug),
    sdk.Query.limit(100),
  ]);
  return result.documents.some((document) => document.$id !== exceptId);
}

function handleAuthorError(res, error, action) {
  console.error(`Error ${action}:`, error.message);
  if (error.code === 404) return res.status(404).json({ error: "Blog author not found" });
  if (error.code === 409) return res.status(409).json({ error: "An author with that slug already exists" });
  return res.status(500).json({ error: `Failed to ${action}` });
}

Router.get("/blog_author", async (req, res) => {
  const config = collectionConfig();
  if (!config) {
    return res.status(500).json({ error: "Appwrite blog author collection is not configured" });
  }
  try {
    const result = await databases.listDocuments(
      config.databaseId,
      config.collectionId,
      [
        sdk.Query.equal("is_active", true),
        sdk.Query.orderAsc("display_name"),
        sdk.Query.limit(100),
      ],
    );
    return res.status(200).json({
      total: result.total,
      documents: result.documents.map(publicAuthor),
    });
  } catch (error) {
    console.error("Error fetching blog authors:", error.message);
    return res.status(500).json({ error: "Failed to fetch blog authors" });
  }
});

Router.get(
  "/blog_author/manage/:id",
  auth,
  auth.requireRoles("admin", "editor"),
  async (req, res) => {
    const config = collectionConfig();
    if (!config) {
      return res.status(500).json({ error: "Appwrite blog author collection is not configured" });
    }
    try {
      const author = await databases.getDocument(
        config.databaseId,
        config.collectionId,
        req.params.id,
      );
      return res.status(200).json(author);
    } catch (error) {
      return handleAuthorError(res, error, "fetch blog author");
    }
  },
);

Router.get("/blog_author/:slug", async (req, res) => {
  const config = collectionConfig();
  if (!config) {
    return res.status(500).json({ error: "Appwrite blog author collection is not configured" });
  }
  try {
    const result = await databases.listDocuments(
      config.databaseId,
      config.collectionId,
      [
        sdk.Query.equal("slug", req.params.slug),
        sdk.Query.equal("is_active", true),
        sdk.Query.limit(1),
      ],
    );
    if (!result.documents.length) {
      return res.status(404).json({ error: "Blog author not found" });
    }
    return res.status(200).json(publicAuthor(result.documents[0]));
  } catch (error) {
    console.error("Error fetching blog author:", error.message);
    return res.status(500).json({ error: "Failed to fetch blog author" });
  }
});

Router.post(
  "/blog_author",
  auth,
  auth.requireRoles("admin", "editor"),
  async (req, res) => {
    const config = collectionConfig();
    if (!config) {
      return res.status(500).json({ error: "Appwrite blog author collection is not configured" });
    }
    const validated = validateAuthor(req.body);
    if (validated.error) return res.status(400).json({ error: validated.error });
    try {
      if (
        await ensureUniqueSlug(
          config.databaseId,
          config.collectionId,
          validated.payload.slug,
        )
      ) {
        return res.status(409).json({ error: "An author with that slug already exists" });
      }
      const author = await databases.createDocument(
        config.databaseId,
        config.collectionId,
        sdk.ID.unique(),
        {
          ...validated.payload,
          is_active: validated.payload.is_active ?? true,
        },
      );
      return res.status(201).json(publicAuthor(author));
    } catch (error) {
      return handleAuthorError(res, error, "create blog author");
    }
  },
);

Router.patch(
  "/blog_author/:id",
  auth,
  auth.requireRoles("admin", "editor"),
  async (req, res) => {
    const config = collectionConfig();
    if (!config) {
      return res.status(500).json({ error: "Appwrite blog author collection is not configured" });
    }
    const validated = validateAuthor(req.body, true);
    if (validated.error) return res.status(400).json({ error: validated.error });
    try {
      if (
        validated.payload.slug &&
        (await ensureUniqueSlug(
          config.databaseId,
          config.collectionId,
          validated.payload.slug,
          req.params.id,
        ))
      ) {
        return res.status(409).json({ error: "An author with that slug already exists" });
      }
      const author = await databases.updateDocument(
        config.databaseId,
        config.collectionId,
        req.params.id,
        validated.payload,
      );
      return res.status(200).json(publicAuthor(author));
    } catch (error) {
      return handleAuthorError(res, error, "update blog author");
    }
  },
);

Router.delete(
  "/blog_author/:id",
  auth,
  auth.requireRoles("admin", "editor"),
  async (req, res) => {
    const config = collectionConfig();
    if (!config) {
      return res.status(500).json({ error: "Appwrite blog author collection is not configured" });
    }
    try {
      const author = await databases.updateDocument(
        config.databaseId,
        config.collectionId,
        req.params.id,
        { is_active: false },
      );
      return res.status(200).json(publicAuthor(author));
    } catch (error) {
      return handleAuthorError(res, error, "deactivate blog author");
    }
  },
);

module.exports = Router;
