import express from "express";

import {
  getProductById,
  getProducts,
} from "../services/productService.js";

const router = express.Router();

/*
 * GET /products
 */
router.get("/", async (req, res) => {
  try {
    const {
      userId,
      storeType,
      storeName,
      status,
      limit,
      offset,
    } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Missing userId.",
      });
    }

    const result = await getProducts({
      userId: String(userId),
      storeType,
      storeName,
      status,
      limit,
      offset,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Products route error:", error);

    return res.status(500).json({
      success: false,
      error: "Products request failed.",
      details: error.message,
    });
  }
});

/*
 * GET /products/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Missing product ID.",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Missing userId.",
      });
    }

    const product = await getProductById({
      productId: String(id),
      userId: String(userId),
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found.",
      });
    }

    return res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Product details route error:", error);

    return res.status(500).json({
      success: false,
      error: "Product details request failed.",
      details: error.message,
    });
  }
});

export default router;