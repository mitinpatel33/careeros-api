const { JobTitle, slugify } = require("../models/interview.model");

// Links free text from the candidate profile to the master job title list
exports.resolveJobTitle = async (raw) => {
  const title = String(raw || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  const slug = slugify(title);
  if (!slug) return null;

  try {
    return await JobTitle.findOneAndUpdate(
      { slug },
      {
        $setOnInsert: {
          title,
          slug,
          isCustom: true,
          isActive: true,
          categoryId: null,
        },
      },
      { upsert: true, new: true, lean: true, setDefaultsOnInsert: true },
    );
  } catch (e) {
    if (e.code === 11000) return JobTitle.findOne({ slug }).lean();
    throw e;
  }
};
