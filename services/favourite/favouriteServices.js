import Favourite from "../../models/favouriteModel.js";
import { isValidObjectId } from "mongoose";
import consoleManager from "../../utils/consoleManager.js";

// Add a favourite
export const addFavourite = async (req, res) => {
    try {
        const { user, trips, routes } = req.body;

        // Validation: user is always required
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User is required"
            });
        }

        // Check both: at least one of trips or routes must be provided, not both, not none
        if (
            (!trips && !routes) ||
            (trips && routes) // Both are set, that's invalid
        ) {
            return res.status(400).json({
                success: false,
                message: "Either trips or routes (only one) must be provided"
            });
        }

        // Validate ObjectIds for user
        if (!isValidObjectId(user)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }
        // Validate ObjectId for trips if provided
        if (trips && !isValidObjectId(trips)) {
            return res.status(400).json({
                success: false,
                message: "Invalid trip ID"
            });
        }
        // Validate ObjectId for routes if provided
        if (routes && !isValidObjectId(routes)) {
            return res.status(400).json({
                success: false,
                message: "Invalid route ID"
            });
        }

        // Check if favourite already exists:
        // User and (trips or routes); only one of trips or routes can exist per favourite
        let findQuery = { user };
        if (trips) findQuery.trips = trips;
        if (routes) findQuery.routes = routes;

        const existingFavourite = await Favourite.findOne(findQuery);

        if (existingFavourite) {
            return res.status(409).json({
                success: false,
                message: "This favourite already exists"
            });
        }

        // Create favourite with only one of trips or routes
        const favouriteData = { user };
        if (trips) favouriteData.trips = trips;
        if (routes) favouriteData.routes = routes;

        const favourite = await Favourite.create(favouriteData);

        // Populate references for response
        await favourite.populate('user', 'username email');
        await favourite.populate('trips');
        await favourite.populate('routes');

        return res.status(201).json({
            success: true,
            message: "Favourite added successfully",
            data: favourite
        });
    } catch (error) {
        consoleManager.log("Add favourite error: " + error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Remove multiple favourites for user with array of trip or route IDs, like add
export const removeFavourite = async (req, res) => {
    try {
        const { user, trips, routes } = req.body;

        // User is always required
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User is required"
            });
        }

        // trips or routes only one, and must be array of IDs
        if (
            (!trips && !routes) ||
            (trips && routes)
        ) {
            return res.status(400).json({
                success: false,
                message: "Either trips or routes (only one) (array) must be provided"
            });
        }

        // Validate user id
        if (!isValidObjectId(user)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        let ids = [];
        let key;
        if (trips) {
            if (!Array.isArray(trips) || trips.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Trips must be a non-empty array of IDs"
                });
            }
            for (const tId of trips) {
                if (!isValidObjectId(tId)) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid trip ID: ${tId}`
                    });
                }
            }
            ids = trips;
            key = "trips";
        } else if (routes) {
            if (!Array.isArray(routes) || routes.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Routes must be a non-empty array of IDs"
                });
            }
            for (const rId of routes) {
                if (!isValidObjectId(rId)) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid route ID: ${rId}`
                    });
                }
            }
            ids = routes;
            key = "routes";
        }

        // Remove all matching favourites for user+each trip/route id
        const deleteQuery = {
            user,
            [key]: { $in: ids }
        };

        const result = await Favourite.deleteMany(deleteQuery);

        // If nothing deleted, might want to mention
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "No favourites found for removal"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Favourites removed successfully",
            deletedCount: result.deletedCount
        });
    } catch (error) {
        consoleManager.log("Remove favourite error: " + error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Get all favourites (with optional user filter)
export const getFavourites = async (req, res) => {
    try {
        const { user, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build query
        const query = {};
        if (user && isValidObjectId(user)) {
            query.user = user;
        }

        const [favourites, total] = await Promise.all([
            Favourite.find(query)
                .populate('user', 'username email')
                .populate({
                    path: 'trips',
                    populate: { path: 'route' }
                })
                .populate('routes')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Favourite.countDocuments(query)
        ]);

        return res.status(200).json({
            success: true,
            data: favourites,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        consoleManager.log("Get favourites error: " + error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Get favourite by ID
export const getFavouriteById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid favourite ID"
            });
        }

        const favourite = await Favourite.findById(id)
            .populate('user', 'username email')
            .populate('trips')
            .populate('routes');

        if (!favourite) {
            return res.status(404).json({
                success: false,
                message: "Favourite not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: favourite
        });
    } catch (error) {
        consoleManager.log("Get favourite by ID error: " + error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Update favourite
export const updateFavourite = async (req, res) => {
    try {
        const { id } = req.params;
        const { user, trips, routes } = req.body;

        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid favourite ID"
            });
        }

        // Check if favourite exists
        const existingFavourite = await Favourite.findById(id);
        if (!existingFavourite) {
            return res.status(404).json({
                success: false,
                message: "Favourite not found"
            });
        }

        // Build update object
        const updateData = {};
        if (user !== undefined) {
            if (!isValidObjectId(user)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid user ID"
                });
            }
            updateData.user = user;
        }
        if (trips !== undefined) {
            if (!isValidObjectId(trips)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid trips ID"
                });
            }
            updateData.trips = trips;
        }
        if (routes !== undefined) {
            if (!isValidObjectId(routes)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid routes ID"
                });
            }
            updateData.routes = routes;
        }

        // Check for duplicate if updating
        if (Object.keys(updateData).length > 0) {
            const checkData = {
                user: updateData.user || existingFavourite.user,
                trips: updateData.trips || existingFavourite.trips,
                routes: updateData.routes || existingFavourite.routes
            };

            const duplicate = await Favourite.findOne({
                _id: { $ne: id },
                ...checkData
            });

            if (duplicate) {
                return res.status(409).json({
                    success: false,
                    message: "This favourite combination already exists"
                });
            }
        }

        const updatedFavourite = await Favourite.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('user', 'username email')
            .populate('trips')
            .populate('routes');

        return res.status(200).json({
            success: true,
            message: "Favourite updated successfully",
            data: updatedFavourite
        });
    } catch (error) {
        consoleManager.log("Update favourite error: " + error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Delete favourite
export const deleteFavourite = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid favourite ID"
            });
        }

        const favourite = await Favourite.findByIdAndDelete(id);

        if (!favourite) {
            return res.status(404).json({
                success: false,
                message: "Favourite not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Favourite deleted successfully",
            data: favourite
        });
    } catch (error) {
        consoleManager.log("Delete favourite error: " + error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Get favourites by user (convenience method)
export const getFavouritesByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId || !isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        const favourites = await Favourite.find({ user: userId })
            .populate('user', 'username email')
            .populate('trips')
            .populate('routes')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: favourites
        });
    } catch (error) {
        consoleManager.log("Get favourites by user error: " + error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};
