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
    } else if (status === "expired") {
      query.$or = [
        { isActive: false },
        { $expr: { $gte: ["$usedCount", "$usageLimit"] } },
        { expiryDate: { $lt: new Date() } },
      ];
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

    const newCoupon = new Coupon({
      name,
      code: code.toUpperCase(),
      type,
      amount,
      minValue,
      maxValue,
      usageLimit,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
    });

    const savedCoupon = await newCoupon.save();
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
      expiryDate: coupon.expiryDate,
    });

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
        expiredCoupons,
        mostUsedCoupons: mostUsed,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
