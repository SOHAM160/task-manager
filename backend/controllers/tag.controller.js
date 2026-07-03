const Tag = require("../models/Tag");

// GET /api/tags
exports.getTags = async (req, res) => {
  try {
    const user = req.user;
    const tags = await Tag.find({ userId: user._id }).sort({ name: 1 });

    const transformed = tags.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      color: t.color,
      createdAt: t.createdAt,
    }));

    return res.json(transformed);
  } catch (err) {
    console.error("[GET_TAGS_ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/tags
exports.createTag = async (req, res) => {
  try {
    const user = req.user;
    let { name, color } = req.body;

    name = (name || "").trim().toLowerCase();
    if (!name) {
      return res.status(400).json({ error: "Tag name is required" });
    }

    if (!color) {
      color = "#6B7280";
    }

    // Check if tag already exists for user
    const existingTag = await Tag.findOne({ name, userId: user._id });
    if (existingTag) {
      return res
        .status(400)
        .json({ error: "Tag with this name already exists" });
    }

    const tag = await Tag.create({ name, color, userId: user._id });

    return res.json({
      id: tag._id.toString(),
      name: tag.name,
      color: tag.color,
      createdAt: tag.createdAt,
    });
  } catch (err) {
    console.error("[CREATE_TAG_ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
