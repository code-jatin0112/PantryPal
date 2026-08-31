import { searchAll } from "../services/searchService.js";

export const handleSearch = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const results = await searchAll({
      userId: req.user.id,
      query: req.query.q || req.query.query || "",
      category: req.query.category,
      cuisine: req.query.cuisine,
      maxTime: req.query.maxTime,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

