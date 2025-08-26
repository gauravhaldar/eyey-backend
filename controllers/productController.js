import Product from "../models/productModel.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { promises as fs } from "fs";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

// Create Product -- Admin
export const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, stock, brand, frameDimensions, productInformation, newArrival, hotSeller, men, women, kids } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const images = [];

    for (const file of req.files) {
      const cloudinaryResponse = await uploadOnCloudinary(file.path);
      if (cloudinaryResponse) {
        images.push({
          public_id: cloudinaryResponse.public_id,
          url: cloudinaryResponse.url,
        });
      } else {
        console.error(`Failed to upload file ${file.originalname} to Cloudinary`);
      }
    }

    req.body.images = images;
    // Only assign req.body.user if req.admin.id is a valid ObjectId
    if (req.admin.id && mongoose.Types.ObjectId.isValid(req.admin.id)) {
      req.body.user = req.admin.id;
    } else {
      console.warn("Admin ID is not a valid ObjectId, product will be created without a user reference.");
      delete req.body.user; // Ensure the invalid user field is not passed to Mongoose
    }

    const product = await Product.create(req.body);

    // Remove temporary image files after successful upload and product creation
    // This block is removed as cleanup is handled by uploadOnCloudinary.
    // for (const file of req.files) {
    //   await fs.unlink(file.path);
    // }

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.error("Product Validation Error:", errors);
      return res.status(400).json({ message: "Validation Error", errors });
    } else {
      console.error("Error creating product:", error);
      return res.status(500).json({ message: "Server Error" });
    }
  }
};

// Get All Product
export const getProducts = async (req, res, next) => {
  try {
    const query = {};

    // Filter by category if provided in query params
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by hotSeller if provided in query params
    if (req.query.hotSeller) {
      // Convert string "true"/"false" to boolean
      query.hotSeller = req.query.hotSeller === "true";
    }

    // Filter by newArrival if provided in query params
    if (req.query.newArrival) {
      // Convert string "true"/"false" to boolean
      query.newArrival = req.query.newArrival === "true";
    }

    // Filter by men if provided in query params
    if (req.query.men) {
      // Convert string "true"/"false" to boolean
      query.men = req.query.men === "true";
    }

    // Filter by women if provided in query params
    if (req.query.women) {
      // Convert string "true"/"false" to boolean
      query.women = req.query.women === "true";
    }

    // Filter by kids if provided in query params
    if (req.query.kids) {
      // Convert string "true"/"false" to boolean
      query.kids = req.query.kids === "true";
    }

    const products = await Product.find(query);

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get Product Details
export const getProductById = async (req, res, next) => {
  try {
    const productIdOrSlug = req.params.id;

    let product;

    if (mongoose.Types.ObjectId.isValid(productIdOrSlug)) {
      // If it's a valid ObjectId, try to find by ID
      product = await Product.findById(productIdOrSlug);
    }

    if (!product) {
      // If not found by ID or not an ObjectId, try to find by slugified name (case-insensitive)
      const slugRegex = new RegExp(productIdOrSlug.replace(/-/g, ' '), 'i');
      product = await Product.findOne({ name: { $regex: slugRegex } });
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update Product -- Admin
export const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Handle Image Updates
    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary
      for (const image of product.images) {
        await cloudinary.uploader.destroy(image.public_id);
      }

      const newImages = [];
      for (const file of req.files) {
        const cloudinaryResponse = await uploadOnCloudinary(file.path);
        if (cloudinaryResponse) {
          newImages.push({
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.url,
          });
        }
      }
      req.body.images = newImages;
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete Product -- Admin
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Deleting Images from Cloudinary
    for (const image of product.images) {
      await cloudinary.uploader.destroy(image.public_id);
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product Delete Successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
