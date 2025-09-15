import Coupon from "../models/couponModel.js";

// Get all coupons
export const getCoupons = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      type = "",
      status = "all",
    } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    if (type && type !== "all") {
      query.type = type;
    }

    if (status === "active") {
      query.isActive = true;
      query.$expr = { $lt: ["$usedCount", "$usageLimit"] };
      // Also check if coupon has started and not expired
      query.$and = [
        { $or: [{ startDate: { $exists: false } }, { startDate: { $lte: new Date() } }] },
        { $or: [{ expiryDate: { $exists: false } }, { expiryDate: { $gte: new Date() } }] }
      ];
    } else if (status === "expired") {
      query.$or = [
        { isActive: false },
        { $expr: { $gte: ["$usedCount", "$usageLimit"] } },
        { expiryDate: { $lt: new Date() } },
      ];
    } else if (status === "scheduled") {
      // New status for coupons that haven't started yet
      query.startDate = { $gt: new Date() };
    }

    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Coupon.countDocuments(query);

    res.json({
      success: true,
      data: coupons,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total: total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new coupon
export const createCoupon = async (req, res) => {
  try {
    
    const {
      name,
      code,
      type,
      amount,
      minValue,
      maxValue,
      usageLimit,
      startDate,
      expiryDate,
    } = req.body;

    if (
      !name ||
      !code ||
      !type ||
      !amount ||
      !minValue ||
      !maxValue ||
      !usageLimit
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    if (minValue >= maxValue) {
      return res.status(400).json({
        success: false,
        message: "Maximum value must be greater than minimum value",
      });
    }

    // Validate start and expiry dates
    if (startDate && startDate.trim() !== "" && expiryDate && expiryDate.trim() !== "") {
      const start = new Date(startDate);
      const expiry = new Date(expiryDate);
      if (start >= expiry) {
        return res.status(400).json({
          success: false,
          message: "Start date must be before expiry date",
        });
      }
    }

    // Create coupon object step by step for debugging
    const couponData = {
      name,
      code: code.toUpperCase(),
      type,
      amount,
      minValue,
      maxValue,
      usageLimit,
    };

    // Add dates only if they have values
    if (startDate && startDate.trim() !== "") {
      couponData.startDate = new Date(startDate);
      console.log("✅ Added startDate:", couponData.startDate);
    } else {
      console.log("❌ No startDate - value:", startDate);
    }

    if (expiryDate && expiryDate.trim() !== "") {
      couponData.expiryDate = new Date(expiryDate);
      console.log("✅ Added expiryDate:", couponData.expiryDate);
    } else {
      console.log("❌ No expiryDate - value:", expiryDate);
    }

    console.log("Final coupon data to save:", couponData);
    const newCoupon = new Coupon(couponData);

    console.log("Creating coupon with data:", {
      name,
      code,
      startDate,
      expiryDate,
      startDateCheck: startDate ? "HAS VALUE" : "NO VALUE",
      expiryDateCheck: expiryDate ? "HAS VALUE" : "NO VALUE",
      parsedStartDate: startDate ? new Date(startDate) : "UNDEFINED",
      parsedExpiryDate: expiryDate ? new Date(expiryDate) : "UNDEFINED",
    });
    
    console.log("About to create coupon object...");
    console.log("newCoupon object:", JSON.stringify({
      name,
      code: code.toUpperCase(),
      type,
      amount,
      minValue,
      maxValue,
      usageLimit,
      startDate: startDate ? new Date(startDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
    }, null, 2));

    const savedCoupon = await newCoupon.save();
    console.log("Saved coupon to database:", savedCoupon);
    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: savedCoupon,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update coupon
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.usedCount;

    const updatedCoupon = await Coupon.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedCoupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.json({
      success: true,
      message: "Coupon updated successfully",
      data: updatedCoupon,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete coupon
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCoupon = await Coupon.findByIdAndDelete(id);

    if (!deletedCoupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Apply coupon
export const applyCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    // Validate input
    if (!code || orderAmount === undefined || orderAmount === null) {
      return res.status(400).json({
        success: false,
        message: "Coupon code and order amount are required",
      });
    }

    if (typeof orderAmount !== "number" || orderAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Order amount must be a positive number",
      });
    }

    console.log("Applying coupon:", { code, orderAmount });

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      console.log("Coupon not found:", code);
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    console.log("Coupon found:", {
      code: coupon.code,
      minValue: coupon.minValue,
      maxValue: coupon.maxValue,
      usedCount: coupon.usedCount,
      usageLimit: coupon.usageLimit,
      startDate: coupon.startDate,
      expiryDate: coupon.expiryDate,
    });

    // Check if coupon has started
    if (coupon.startDate && coupon.startDate > new Date()) {
      console.log("Coupon not yet started:", coupon.startDate);
      return res.status(400).json({
        success: false,
        message: "Coupon is not yet active",
      });
    }

    if (coupon.expiryDate && coupon.expiryDate < new Date()) {
      console.log("Coupon expired:", coupon.expiryDate);
      return res.status(400).json({
        success: false,
        message: "Coupon has expired",
      });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      console.log(
        "Coupon usage limit exceeded:",
        coupon.usedCount,
        ">=",
        coupon.usageLimit
      );
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit exceeded",
      });
    }

    if (orderAmount < coupon.minValue) {
      console.log(
        "Order amount below minimum:",
        orderAmount,
        "<",
        coupon.minValue
      );
      return res.status(400).json({
        success: false,
        message: `Minimum order value should be ₹${coupon.minValue}`,
      });
    }

    if (orderAmount > coupon.maxValue) {
      console.log(
        "Order amount above maximum:",
        orderAmount,
        ">",
        coupon.maxValue
      );
      return res.status(400).json({
        success: false,
        message: `Maximum order value should be ₹${coupon.maxValue}`,
      });
    }

    let discount = 0;
    if (coupon.type === "flat") {
      discount = Math.min(coupon.amount, orderAmount); // Don't allow discount greater than order amount
    } else if (coupon.type === "percentage") {
      discount = Math.floor((orderAmount * coupon.amount) / 100);
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon type",
      });
    }

    // Ensure discount doesn't exceed order amount
    discount = Math.min(discount, orderAmount);

    console.log("Coupon applied successfully:", {
      discount,
      finalAmount: orderAmount - discount,
    });

    res.json({
      success: true,
      data: {
        couponId: coupon._id,
        discount: discount,
        finalAmount: orderAmount - discount,
        couponDetails: coupon,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Use coupon (increment usage count)
export const useCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { $inc: { usedCount: 1 } },
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.json({
      success: true,
      message: "Coupon usage updated",
      data: coupon,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get coupon analytics
export const getCouponAnalytics = async (req, res) => {
  try {
    const totalCoupons = await Coupon.countDocuments();
    
    const activeCoupons = await Coupon.countDocuments({
      isActive: true,
      $expr: { $lt: ["$usedCount", "$usageLimit"] },
      $and: [
        { $or: [{ startDate: { $exists: false } }, { startDate: { $lte: new Date() } }] },
        { $or: [{ expiryDate: { $exists: false } }, { expiryDate: { $gte: new Date() } }] }
      ]
    });
    
    const scheduledCoupons = await Coupon.countDocuments({
      startDate: { $gt: new Date() }
    });
    
    const expiredCoupons = await Coupon.countDocuments({
      $or: [
        { $expr: { $gte: ["$usedCount", "$usageLimit"] } },
        { expiryDate: { $lt: new Date() } },
      ],
    });

    const mostUsed = await Coupon.find().sort({ usedCount: -1 }).limit(5);

    res.json({
      success: true,
      data: {
        totalCoupons,
        activeCoupons,
        scheduledCoupons,
        expiredCoupons,
        mostUsedCoupons: mostUsed,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};