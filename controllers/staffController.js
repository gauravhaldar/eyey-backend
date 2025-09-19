import Staff from "../models/staffModel.js";

// Create staff
export const createStaff = async (req, res, next) => {
  try {
    const staff = await Staff.create(req.body);
    res.status(201).json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

// Get all staff (with basic pagination and search by name/phone)
export const getStaff = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Staff.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Staff.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)) || 1,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get single staff
export const getStaffById = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });
    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

// Update staff
export const updateStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });
    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

// Delete staff
export const deleteStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });
    res.json({ success: true, message: "Staff deleted" });
  } catch (error) {
    next(error);
  }
};


