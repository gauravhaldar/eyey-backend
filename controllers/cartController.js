import User from "../models/userModel.js";
import Product from "../models/productModel.js"; // Add this import

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity = 1, size, color } = req.body;

    console.log("🚀 BACKEND: AddToCart request received");
    console.log("📝 Request data:", {
      userId,
      productId,
      quantity,
      size,
      color,
    });

    // Validation
    if (!userId || !productId) {
      console.log(
        "❌ BACKEND: Validation failed - missing userId or productId"
      );
      return res.status(400).json({
        success: false,
        message: "User ID and Product ID are required",
      });
    }

    // Check if product exists
    console.log("🔍 BACKEND: Looking up product:", productId);
    const product = await Product.findById(productId);
    if (!product) {
      console.log("❌ BACKEND: Product not found:", productId);
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    console.log("✅ BACKEND: Product found:", product.name);

    // Find user
    console.log("🔍 BACKEND: Looking up user:", userId);
    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ BACKEND: User not found:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    console.log("✅ BACKEND: User found:", user.email || user._id);

    // Initialize cartData if empty
    if (!user.cartData) {
      user.cartData = {};
      console.log("🔧 BACKEND: Initialized empty cart for user");
    }

    // Create unique key for product (includes size and color if provided)
    const cartKey =
      size || color
        ? `${productId}_${size || "default"}_${color || "default"}`
        : productId;

    console.log("🔑 BACKEND: Generated cart key:", cartKey);
    console.log(
      "🔍 BACKEND: Current cart data before modification:",
      JSON.stringify(user.cartData, null, 2)
    );

    // Add or update cart item with product details
    if (user.cartData[cartKey]) {
      // Item exists, update quantity only
      const oldQuantity = user.cartData[cartKey].quantity;
      user.cartData[cartKey].quantity += parseInt(quantity);
      user.cartData[cartKey].updatedAt = new Date();
      console.log(
        `🔄 BACKEND: Updated existing item quantity: ${oldQuantity} -> ${user.cartData[cartKey].quantity}`
      );
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
      console.log("➕ BACKEND: Added new item to cart:", product.name);
    }

    // IMPORTANT: Mark the cartData field as modified for Mongoose
    user.markModified("cartData");
    console.log("🔧 BACKEND: Marked cartData as modified for Mongoose");
    console.log(
      "🔍 BACKEND: Cart data after modification:",
      JSON.stringify(user.cartData, null, 2)
    );

    // Save updated cart to database
    console.log("💾 BACKEND: Saving cart to database...");
    console.log(
      "🔍 BACKEND: Cart data before save:",
      JSON.stringify(user.cartData, null, 2)
    );

    const saveResult = await user.save();
    console.log("✅ BACKEND: Cart saved successfully to database");
    console.log("🔍 BACKEND: Save result:", saveResult ? "Success" : "Failed");

    // Verify the save by re-fetching the user
    const verifyUser = await User.findById(userId);
    console.log(
      "🔍 BACKEND: Verification - Cart data after save:",
      JSON.stringify(verifyUser.cartData, null, 2)
    );

    const cartCount = Object.keys(user.cartData).length;
    const verifyCartCount = Object.keys(verifyUser.cartData).length;
    console.log("📊 BACKEND: Cart summary - Items (before save):", cartCount);
    console.log(
      "� BACKEND: Cart summary - Items (after save verification):",
      verifyCartCount
    );
    console.log(
      "�📦 BACKEND: Cart contents (before save):",
      Object.keys(user.cartData)
    );
    console.log(
      "📦 BACKEND: Cart contents (after save verification):",
      Object.keys(verifyUser.cartData)
    );

    const response = {
      success: true,
      message: "Item added to cart successfully",
      cartData: user.cartData,
      cartCount: cartCount,
    };

    console.log("📤 BACKEND: Sending response to frontend");
    res.status(200).json(response);
  } catch (error) {
    console.error("🚨 BACKEND: Add to cart error:", error);
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

    console.log("🔍 BACKEND: GetCart request for user:", userId);

    // Validation
    if (!userId) {
      console.log("❌ BACKEND: Missing userId in getCart");
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Find user
    console.log("🔍 BACKEND: Looking up user in database...");
    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ BACKEND: User not found in getCart");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("✅ BACKEND: User found, checking cart data...");
    const cartData = user.cartData || {};
    console.log("📦 BACKEND: Raw cart data from database:", cartData);
    console.log("📊 BACKEND: Cart items count:", Object.keys(cartData).length);

    // Get updated product details for each cart item
    const updatedCartData = {};

    for (const [cartKey, cartItem] of Object.entries(cartData)) {
      try {
        console.log(
          `🔍 BACKEND: Processing cart item [${cartKey}]:`,
          cartItem.name
        );

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
          console.log(
            `✅ BACKEND: Updated cart item [${cartKey}] with fresh product data`
          );
        } else {
          // Product doesn't exist anymore, mark for removal
          console.log(
            `❌ BACKEND: Product ${cartItem.productId} not found, removing from cart`
          );
        }
      } catch (error) {
        console.error(
          `🚨 BACKEND: Error fetching product ${cartItem.productId}:`,
          error
        );
      }
    }

    // Update user's cart with fresh data
    if (Object.keys(updatedCartData).length !== Object.keys(cartData).length) {
      console.log("🔄 BACKEND: Cart data changed, updating database...");
      user.cartData = updatedCartData;
      await user.save();
      console.log("✅ BACKEND: Cart updated in database");
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

    const responseData = {
      success: true,
      cartData: updatedCartData,
      cartCount: Object.keys(updatedCartData).length,
      totalQuantity,
      totalAmount,
      originalTotalAmount,
      savings: originalTotalAmount - totalAmount,
    };

    console.log("📤 BACKEND: Sending cart response:");
    console.log("   - Cart count:", responseData.cartCount);
    console.log("   - Total quantity:", responseData.totalQuantity);
    console.log("   - Total amount:", responseData.totalAmount);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("🚨 BACKEND: Get cart error:", error);
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

    console.log("🔄 BACKEND: UpdateCartQuantity request received");
    console.log("📝 Request data:", { userId, cartKey, quantity });

    // Validation
    if (!userId || !cartKey || quantity === undefined) {
      console.log("❌ BACKEND: Validation failed - missing required fields");
      return res.status(400).json({
        success: false,
        message: "User ID, Cart Key, and Quantity are required",
      });
    }

    if (quantity < 1) {
      console.log("❌ BACKEND: Invalid quantity - must be at least 1");
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    // Find user
    console.log("🔍 BACKEND: Looking up user:", userId);
    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ BACKEND: User not found");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(
      "✅ BACKEND: User found, updating quantity for cart key:",
      cartKey
    );

    // Update quantity
    if (user.cartData && user.cartData[cartKey]) {
      const oldQuantity = user.cartData[cartKey].quantity;
      user.cartData[cartKey].quantity = parseInt(quantity);
      user.cartData[cartKey].updatedAt = new Date();

      console.log(
        `🔄 BACKEND: Updated quantity: ${oldQuantity} -> ${quantity}`
      );

      // IMPORTANT: Mark the cartData field as modified for Mongoose
      user.markModified("cartData");
      console.log("🔧 BACKEND: Marked cartData as modified");

      await user.save();
      console.log("✅ BACKEND: Quantity update saved to database");

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

    console.log("🗑️ BACKEND: RemoveFromCart request received");
    console.log("📝 Request data:", { userId, cartKey });

    // Validation
    if (!userId || !cartKey) {
      console.log("❌ BACKEND: Validation failed - missing userId or cartKey");
      return res.status(400).json({
        success: false,
        message: "User ID and Cart Key are required",
      });
    }

    // Find user
    console.log("🔍 BACKEND: Looking up user:", userId);
    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ BACKEND: User not found");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(
      "✅ BACKEND: User found, removing item with cart key:",
      cartKey
    );

    // Remove item from cart
    if (user.cartData && user.cartData[cartKey]) {
      const itemName = user.cartData[cartKey].name;
      delete user.cartData[cartKey];

      console.log(`🗑️ BACKEND: Removed item: ${itemName}`);

      // IMPORTANT: Mark the cartData field as modified for Mongoose
      user.markModified("cartData");
      console.log("🔧 BACKEND: Marked cartData as modified");

      await user.save();
      console.log("✅ BACKEND: Item removal saved to database");

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

    // IMPORTANT: Mark the cartData field as modified for Mongoose
    user.markModified("cartData");
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
