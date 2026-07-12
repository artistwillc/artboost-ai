import express from "express";
import { getStores } from "../services/productService.js";

const router = express.Router();

/*
 * GET /stores
 */
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Missing userId.",
      });
    }

    const stores = await getStores({
      userId: String(userId),
    });

    return res.json({
      success: true,
      total: stores.length,
      stores,
    });
  } catch (error) {
    console.error("Stores route error:", error);

    return res.status(500).json({
      success: false,
      error: "Stores request failed.",
      details: error.message,
    });
  }
});

export default router;