import Address from "../models/addressModel.js";

// @desc   Get all addresses for a user
// @route  GET /api/users/addresses
// @access Private
export const getUserAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    res.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc   Add new address
// @route  POST /api/users/addresses
// @access Private
export const addAddress = async (req, res) => {
  try {
    const { name, phone, address, city, state, pincode, country, isDefault } = req.body;

    // Validate required fields
    if (!name || !phone || !address || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const newAddress = new Address({
      user: req.user._id,
      name,
      phone,
      address,
      city,
      state,
      pincode,
      country: country || "India",
      isDefault: isDefault || false,
    });

    const savedAddress = await newAddress.save();

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: savedAddress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc   Update address
// @route  PUT /api/users/addresses/:id
// @access Private
export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, city, state, pincode, country, isDefault } = req.body;

    // Check if address exists and belongs to user
    const existingAddress = await Address.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Update address
    const updatedAddress = await Address.findByIdAndUpdate(
      id,
      {
        name,
        phone,
        address,
        city,
        state,
        pincode,
        country: country || "India",
        isDefault: isDefault || false,
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Address updated successfully",
      data: updatedAddress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc   Delete address
// @route  DELETE /api/users/addresses/:id
// @access Private
export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if address exists and belongs to user
    const address = await Address.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    await Address.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc   Set address as default
// @route  PUT /api/users/addresses/:id/default
// @access Private
export const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if address exists and belongs to user
    const address = await Address.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Set all other addresses to non-default
    await Address.updateMany(
      { user: req.user._id },
      { $set: { isDefault: false } }
    );

    // Set this address as default
    const updatedAddress = await Address.findByIdAndUpdate(
      id,
      { $set: { isDefault: true } },
      { new: true }
    );

    res.json({
      success: true,
      message: "Default address updated successfully",
      data: updatedAddress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
