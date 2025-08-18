import Region from "../../../models/regionModel.js";

// GET all regions
export const getRegions = async (req, res) => {
  try {
    const regions = await Region.find({});
    if (!regions || regions.length === 0) {
      return res.status(404).json({ message: 'No regions found' });
    }
    return res.status(200).json({ data: regions });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error' });
  }
};

// GET a region by ID
export const getRegion = async (req, res) => {
  const { id } = req.params;
  try {
    const region = await Region.findById(id);
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }
    return res.status(200).json({ data: region });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error' });
  }
};

// CREATE a new region
export const addRegion = async (req, res) => {
  const { name, communicationAddress, location } = req.body;
  if (!name || !communicationAddress || !location || !location.coordinates) {
    return res.status(400).json({ message: "All details required" });
  }
  try {
    const newRegion = await Region.create({
      name,
      communicationAddress,
      location: {
        type: "Point",
        coordinates: location.coordinates, // [longitude, latitude]
      },
    });
    return res.status(201).json({ message: "Created", data: newRegion });
  } catch (error) {
    if (error.code === 11000) {
      // unique constraint on name
      return res.status(409).json({ message: "Region name must be unique" });
    }
    return res.status(500).json({ message: "Server Error" });
  }
};

// UPDATE a region
export const updateRegion = async (req, res) => {
  const { id } = req.params;
  const { name, communicationAddress, location } = req.body;
  if (!name || !communicationAddress || !location || !location.coordinates) {
    return res.status(400).json({ message: "All details required" });
  }
  try {
    const updatedRegion = await Region.findByIdAndUpdate(
      id,
      {
        name,
        communicationAddress,
        location: {
          type: "Point",
          coordinates: location.coordinates
        }
      },
      { new: true, runValidators: true }
    );
    if (!updatedRegion) {
      return res.status(404).json({ message: "Region not found" });
    }
    return res.status(200).json({ message: "Updated", data: updatedRegion });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};

// DELETE a region
export const deleteRegion = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Region.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Region not found" });
    }
    return res.status(200).json({ message: "Deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};
