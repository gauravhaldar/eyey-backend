import User from "../models/userModel.js";
import Product from "../models/productModel.js"; // Add this import

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity = 1, size, color } = req.body;

    // Validation
    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Product ID are required",
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Initialize cartData if empty
    if (!user.cartData) {
      user.cartData = {};
    }

    // Create unique key for product (includes size and color if provided)
    const cartKey =
      size || color
        ? `${productId}_${size || "default"}_${color || "default"}`
        : productId;

    // Add or update cart item with product details
    if (user.cartData[cartKey]) {
      // Item exists, update quantity only
      user.cartData[cartKey].quantity += parseInt(quantity);
      user.cartData[cartKey].updatedAt = new Date();
    } else {
      // New item, add to cart with full product details
      user.cartData[cartKey] = {
        productId,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        images: product.images, // Store all product images
        category: product.category,
        quantity: parseInt(quantity),
        size: size || null,
        color: color || null,
        addedAt: new Date(),
      };
    }

    // Save updated cart
    await user.save();

    res.status(200).json({
      success: true,
      message: "Item added to cart successfully",
      cartData: user.cartData,
      cartCount: Object.keys(user.cartData).length,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add item to cart",
    });
  }
};

// Get user's cart with full product details
export const getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const cartData = user.cartData || {};

    // Get updated product details for each cart item
    const updatedCartData = {};

    for (const [cartKey, cartItem] of Object.entries(cartData)) {
      try {
        // Get fresh product data
        const product = await Product.findById(cartItem.productId);

        if (product) {
          // Update cart item with fresh product data
          updatedCartData[cartKey] = {
            ...cartItem,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            images: product.images,
            category: product.category,
            inStock: product.stock > 0,
            stock: product.stock,
          };
        } else {
          // Product doesn't exist anymore, mark for removal
          console.log(
            `Product ${cartItem.productId} not found, removing from cart`
          );
        }
      } catch (error) {
        console.error(`Error fetching product ${cartItem.productId}:`, error);
      }
    }

    // Update user's cart with fresh data
    if (Object.keys(updatedCartData).length !== Object.keys(cartData).length) {
      user.cartData = updatedCartData;
      await user.save();
    }

    // Calculate totals
    const totalQuantity = Object.values(updatedCartData).reduce(
      (total, item) => total + (item.quantity || 0),
      0
    );

    const totalAmount = Object.values(updatedCartData).reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    const originalTotalAmount = Object.values(updatedCartData).reduce(
      (total, item) =>
        total + (item.originalPrice || item.price) * item.quantity,
      0
    );

    res.status(200).json({
      success: true,
      cartData: updatedCartData,
      cartCount: Object.keys(updatedCartData).length,
      totalQuantity,
      totalAmount,
      originalTotalAmount,
      savings: originalTotalAmount - totalAmount,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get cart data",
    });
  }
};

// Update cart item quantity
export const updateCartQuantity = async (req, res) => {
  try {
    const { userId, cartKey, quantity } = req.body;

    // Validation
    if (!userId || !cartKey || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "User ID, Cart Key, and Quantity are required",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update quantity
    if (user.cartData && user.cartData[cartKey]) {
      user.cartData[cartKey].quantity = parseInt(quantity);
      user.cartData[cartKey].updatedAt = new Date();
      await user.save();

      res.status(200).json({
        success: true,
        message: "Cart quantity updated successfully",
        cartData: user.cartData,
        cartCount: Object.keys(user.cartData).length,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }
  } catch (error) {
    console.error("Update cart quantity error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update cart quantity",
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { userId, cartKey } = req.body;

    // Validation
    if (!userId || !cartKey) {
      return res.status(400).json({
        success: false,
        message: "User ID and Cart Key are required",
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Remove item from cart
    if (user.cartData && user.cartData[cartKey]) {
      delete user.cartData[cartKey];
      await user.save();

      res.status(200).json({
        success: true,
        message: "Item removed from cart successfully",
        cartData: user.cartData,
        cartCount: Object.keys(user.cartData).length,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove item from cart",
    });
  }
};

// Clear entire cart
export const clearCart = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Clear cart
    user.cartData = {};
    await user.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cartData: {},
      cartCount: 0,
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
    });
  }
};

// Get cart summary (count and total items)
export const getCartSummary = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Calculate totals
    const cartData = user.cartData || {};
    const cartCount = Object.keys(cartData).length;
    const totalQuantity = Object.values(cartData).reduce(
      (total, item) => total + (item.quantity || 0),
      0
    );

    res.status(200).json({
      success: true,
      cartCount,
      totalQuantity,
      hasItems: cartCount > 0,
    });
  } catch (error) {
    console.error("Get cart summary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get cart summary",
    });
  }
};
