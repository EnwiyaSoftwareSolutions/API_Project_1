const express = require("express");
const sdk = require("node-appwrite");
const appwriteClient = require("../config/app");
const auth = require("../middleware/auth");

const Router = express.Router();
const databases = new sdk.Databases(appwriteClient);
const postFields = [
  "title",
  "slug",
  "excerpt",
  "body",
  "content_format",
  "content_type",
  "status",
  "primary_author_id",
  "primary_practice_area_id",
  "primary_jurisdiction_id",
  "seo_title",
  "meta_description",
  "canonical_url_override",
  "robots_index",
  "robots_follow",
  "featured_image_url",
  "featured_image_alt",
  "published_at",
  "last_legal_review_at",
  "next_legal_review_at",
];
const publicFields = [
  "$id",
  "title",
  "slug",
  "excerpt",
  "body",
  "content_format",
  "content_type",
  "status",
  "primary_author_id",
  "primary_practice_area_id",
  "primary_jurisdiction_id",
  "seo_title",
  "meta_description",
  "canonical_url_override",
  "robots_index",
  "robots_follow",
  "featured_image_url",
  "featured_image_alt",
  "published_at",
  "created_at",
  "updated_at",
];
const statuses = ["draft", "review", "scheduled", "published", "archived"];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function collectionConfig() {
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_BLOG;
  return databaseId && collectionId ? { databaseId, collectionId } : null;
}

function projectFields(document, fields) {
  return fields.reduce((result, field) => {
    if (document[field] !== undefined) result[field] = document[field];
    return result;
  }, {});
}

function validatePost(body, existing = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "A JSON object is required" };
  }

  const payload = {};
  for (const field of postFields) {
    if (Object.hasOwn(body, field)) payload[field] = body[field];
  }

  if (
    payload.title !== undefined &&
    (typeof payload.title !== "string" ||
      !payload.title.trim() ||
      payload.title.length > 300)
  ) {
    return { error: "title must be a non-empty string of at most 300 characters" };
  }
  if (
    payload.slug !== undefined &&
    (typeof payload.slug !== "string" ||
      payload.slug.length > 300 ||
      !slugPattern.test(payload.slug))
  ) {
    return { error: "slug must contain lowercase letters, numbers, and hyphens" };
  }
  for (const field of [
    "excerpt",
    "body",
    "content_type",
    "primary_practice_area_id",
    "primary_jurisdiction_id",
    "seo_title",
    "meta_description",
    "canonical_url_override",
    "featured_image_url",
    "featured_image_alt",
  ]) {
    if (payload[field] !== undefined && typeof payload[field] !== "string") {
      return { error: `${field} must be a string` };
    }
  }
  for (const field of ["primary_author_id", "primary_practice_area_id", "primary_jurisdiction_id"]) {
    if (
      payload[field] !== undefined &&
      (typeof payload[field] !== "string" || !payload[field].trim())
    ) {
      return { error: `${field} must be a non-empty string` };
    }
  }
  if (
    payload.content_format !== undefined &&
    payload.content_format !== "markdown"
  ) {
    return { error: "content_format must be markdown" };
  }
  if (
    payload.status !== undefined &&
    !statuses.includes(payload.status)
  ) {
    return { error: `status must be one of: ${statuses.join(", ")}` };
  }
  for (const field of ["robots_index", "robots_follow"]) {
    if (payload[field] !== undefined && typeof payload[field] !== "boolean") {
      return { error: `${field} must be a boolean` };
    }
  }
  if (payload.published_at !== undefined && payload.published_at !== null) {
    if (
      typeof payload.published_at !== "string" ||
      Number.isNaN(Date.parse(payload.published_at))
    ) {
      return { error: "published_at must be a valid date string or null" };
    }
  }
  for (const field of ["last_legal_review_at", "next_legal_review_at"]) {
    if (
      payload[field] !== undefined &&
      payload[field] !== null &&
      (typeof payload[field] !== "string" ||
        Number.isNaN(Date.parse(payload[field])))
    ) {
      return { error: `${field} must be a valid date string or null` };
    }
  }

  if (
    !existing.$id &&
    (!payload.title || !payload.slug || typeof payload.body !== "string" || !payload.body.trim())
  ) {
    return { error: "title, slug, and body are required" };
  }
  if (
    !existing.$id &&
    (typeof payload.primary_author_id !== "string" ||
      !payload.primary_author_id.trim())
  ) {
    return { error: "primary_author_id is required" };
  }

  const status = payload.status || existing.status || "draft";
  if (
    (status === "published" || status === "scheduled") &&
    payload.published_at === null
  ) {
    return { error: `${status} posts require a published_at date` };
  }
  if (status === "published" && !payload.published_at && !existing.published_at) {
    payload.published_at = new Date().toISOString();
  }
  if (status === "scheduled") {
    const scheduledAt = payload.published_at || existing.published_at;
    if (!scheduledAt || Date.parse(scheduledAt) <= Date.now()) {
      return { error: "scheduled posts require a future published_at date" };
    }
  }
  if (!existing.$id) {
    payload.status = status;
    payload.content_format = payload.content_format || "markdown";
    payload.content_type = payload.content_type || "guide";
    payload.robots_index = payload.robots_index ?? true;
    payload.robots_follow = payload.robots_follow ?? true;
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

async function ensureAuthor(databaseId, authorId) {
  const authorCollectionId = process.env.APPWRITE_BLOG_AUTHOR_COLLECTION_ID;
  if (!authorCollectionId) {
    const error = new Error("Blog author collection is not configured");
    error.status = 500;
    throw error;
  }
  let author;
  try {
    author = await databases.getDocument(databaseId, authorCollectionId, authorId);
  } catch (error) {
    if (error.code === 404) {
      const missingAuthorError = new Error("The selected author does not exist");
      missingAuthorError.status = 400;
      throw missingAuthorError;
    }
    throw error;
  }
  if (author.is_active === false) {
    const error = new Error("The selected author is inactive");
    error.status = 400;
    throw error;
  }
}

function handleWriteError(res, error, action) {
  console.error(`Error ${action}:`, error.message);
  if (error.status) return res.status(error.status).json({ error: error.message });
  if (error.code === 404) return res.status(404).json({ error: "Blog post not found" });
  if (error.code === 409) return res.status(409).json({ error: "A post with that slug already exists" });
  return res.status(500).json({ error: `Failed to ${action}` });
}

Router.get("/blog_post", async (req, res) => {
  const config = collectionConfig();
  if (!config) {
    return res.status(500).json({ error: "Appwrite blog collection is not configured" });
  }

  const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
  const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !Number.isSafeInteger(offset) ||
    offset < 0
  ) {
    return res.status(400).json({ error: "limit must be 1-100 and offset must be non-negative" });
  }

  try {
    const result = await databases.listDocuments(
      config.databaseId,
      config.collectionId,
      [
        sdk.Query.equal("status", "published"),
        sdk.Query.lessThanEqual("published_at", new Date().toISOString()),
        sdk.Query.orderDesc("published_at"),
        sdk.Query.limit(limit),
        sdk.Query.offset(offset),
      ],
    );
    return res.status(200).json({
      total: result.total,
      documents: result.documents.map((document) =>
        projectFields(document, publicFields),
      ),
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error.message);
    return res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

Router.get(
  "/blog_post/manage",
  auth,
  auth.requireRoles("admin", "editor"),
  async (req, res) => {
    const config = collectionConfig();
    if (!config) {
      return res.status(500).json({ error: "Appwrite blog collection is not configured" });
    }

    const limit = req.query.limit === undefined ? 100 : Number(req.query.limit);
    const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
    if (
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      !Number.isSafeInteger(offset) ||
      offset < 0
    ) {
      return res.status(400).json({ error: "limit must be 1-100 and offset must be non-negative" });
    }

    try {
      const result = await databases.listDocuments(
        config.databaseId,
        config.collectionId,
        [
          sdk.Query.orderDesc("updated_at"),
          sdk.Query.limit(limit),
          sdk.Query.offset(offset),
        ],
      );
      return res.status(200).json({
        total: result.total,
        documents: result.documents,
      });
    } catch (error) {
      console.error("Error fetching blog posts for management:", error.message);
      return res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  },
);

Router.get("/blog_post/manage/:id", auth, auth.requireRoles("admin", "editor"), async (req, res) => {
  const config = collectionConfig();
  if (!config) {
    return res.status(500).json({ error: "Appwrite blog collection is not configured" });
  }
  try {
    const document = await databases.getDocument(
      config.databaseId,
      config.collectionId,
      req.params.id,
    );
    return res.status(200).json(document);
  } catch (error) {
    console.error("Error fetching blog post:", error.message);
    if (error.code === 404) return res.status(404).json({ error: "Blog post not found" });
    return res.status(500).json({ error: "Failed to fetch blog post" });
  }
});

Router.get("/blog_post/:slug", async (req, res) => {
  const config = collectionConfig();
  if (!config) {
    return res.status(500).json({ error: "Appwrite blog collection is not configured" });
  }
  try {
    const result = await databases.listDocuments(
      config.databaseId,
      config.collectionId,
      [
        sdk.Query.equal("slug", req.params.slug),
        sdk.Query.equal("status", "published"),
        sdk.Query.lessThanEqual("published_at", new Date().toISOString()),
        sdk.Query.limit(1),
      ],
    );
    if (!result.documents.length) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    return res.status(200).json(projectFields(result.documents[0], publicFields));
  } catch (error) {
    console.error("Error fetching blog post:", error.message);
    return res.status(500).json({ error: "Failed to fetch blog post" });
  }
});

Router.post(
  "/blog_post",
  auth,
  auth.requireRoles("admin", "editor"),
  async (req, res) => {
    const config = collectionConfig();
    if (!config) {
      return res.status(500).json({ error: "Appwrite blog collection is not configured" });
    }
    const validated = validatePost(req.body);
    if (validated.error) return res.status(400).json({ error: validated.error });

    try {
      if (
        await ensureUniqueSlug(
          config.databaseId,
          config.collectionId,
          validated.payload.slug,
        )
      ) {
        return res.status(409).json({ error: "A post with that slug already exists" });
      }
      await ensureAuthor(config.databaseId, validated.payload.primary_author_id);
      const now = new Date().toISOString();
      const document = await databases.createDocument(
        config.databaseId,
        config.collectionId,
        sdk.ID.unique(),
        { ...validated.payload, created_at: now, updated_at: now },
      );
      return res.status(201).json(projectFields(document, publicFields));
    } catch (error) {
      return handleWriteError(res, error, "create blog post");
    }
  },
);

Router.patch(
  "/blog_post/:id",
  auth,
  auth.requireRoles("admin", "editor"),
  async (req, res) => {
    const config = collectionConfig();
    if (!config) {
      return res.status(500).json({ error: "Appwrite blog collection is not configured" });
    }
    try {
      const existing = await databases.getDocument(
        config.databaseId,
        config.collectionId,
        req.params.id,
      );
      const validated = validatePost(req.body, existing);
      if (validated.error) {
        return res.status(400).json({ error: validated.error });
      }
      if (
        validated.payload.slug &&
        (await ensureUniqueSlug(
          config.databaseId,
          config.collectionId,
          validated.payload.slug,
          existing.$id,
        ))
      ) {
        return res.status(409).json({ error: "A post with that slug already exists" });
      }
      if (validated.payload.primary_author_id) {
        await ensureAuthor(config.databaseId, validated.payload.primary_author_id);
      }
      const document = await databases.updateDocument(
        config.databaseId,
        config.collectionId,
        req.params.id,
        { ...validated.payload, updated_at: new Date().toISOString() },
      );
      return res.status(200).json(projectFields(document, publicFields));
    } catch (error) {
      return handleWriteError(res, error, "update blog post");
    }
  },
);

Router.delete(
  "/blog_post/:id",
  auth,
  auth.requireRoles("admin", "editor"),
  async (req, res) => {
    const config = collectionConfig();
    if (!config) {
      return res.status(500).json({ error: "Appwrite blog collection is not configured" });
    }
    try {
      const document = await databases.updateDocument(
        config.databaseId,
        config.collectionId,
        req.params.id,
        { status: "archived", updated_at: new Date().toISOString() },
      );
      return res.status(200).json(projectFields(document, publicFields));
    } catch (error) {
      return handleWriteError(res, error, "archive blog post");
    }
  },
);

module.exports = Router;
