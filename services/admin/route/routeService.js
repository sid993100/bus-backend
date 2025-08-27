import Route from "../../../models/routemodel.js";


// GET ALL ROUTES
export const getRoutes = async (req, res) => {
    try {
        const routes = await Route.find({}).populate('stops.stop', 'stopName').sort({ routeName: 1 });
        
        if (!routes || routes.length === 0) {
            return res.status(404).json({
                message: "Routes Not Found",
            });
        }
        
        return res.status(200).json({
            message: "Routes Retrieved Successfully",
            data: routes,
            count: routes.length
        });
    } catch (error) {
        return res.status(500).json({
            message: "Backend Error"
        });
    }
};

// GET SINGLE ROUTE BY ID
export const getRoute = async (req, res) => {
    const { id } = req.params;
    
    try {
        const route = await Route.findById(id).populate('stops.stop', 'stopName');
        
        if (!route) {
            return res.status(404).json({
                message: "Route Not Found",
            });
        }
        
        return res.status(200).json({
            message: "Route Retrieved Successfully",
            data: route
        });
    } catch (error) {
        return res.status(500).json({
            message: "Backend Error"
        });
    }
};

// ADD NEW ROUTE
export const addRoute = async (req, res) => {
    const { source, destination, via, routeName, routeLength, stops } = req.body;
    
    if (!source || !destination || !routeLength || !routeName) {
        return res.status(400).json({
            message: "Required fields are missing: source, destination, routeCode, routeLength, routeName"
        });
    }
    
    try {
        const validStops = stops ? stops.filter(s => s.stop) : [];

        let newRoute = await Route.create({
            source,
            destination,
            via,
            routeName,
            routeLength,
            stops: validStops
        });
        
        if (!newRoute) {
            return res.status(500).json({
                message: "Something went Wrong while Creating a Route"
            });
        }
        
        newRoute = await newRoute.populate('stops.stop', 'stopName');
        
        return res.status(201).json({
            message: "Route Created Successfully",
            data: newRoute
        });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({
                message: `${field} must be unique`
            });
        }
        return res.status(500).json({
            message: "Server Error",
            error: error.message
        });
    }
};

// UPDATE ROUTE
export const updateRoute = async (req, res) => {
    const { id } = req.params;
    const { source, destination, via, routeName, routeCode, routeLength, stops } = req.body;
    
    if (!source || !destination || !routeCode || !routeLength || !routeName) {
        return res.status(400).json({
            message: "All details Required"
        });
    }
    
    try {
        const validStops = stops ? stops.filter(s => s.stop) : [];

        const updatedRoute = await Route.findByIdAndUpdate(
            id,
            {
                source,
                destination,
                via,
                routeName,
                routeCode,
                routeLength,
                stops: validStops
            },
            { new: true, runValidators: true }
        ).populate('stops.stop', 'stopName');
        
        if (!updatedRoute) {
            return res.status(404).json({
                message: "Route Not Found"
            });
        }
        
        return res.status(200).json({
            message: "Route Updated Successfully",
            data: updatedRoute
        });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({
                message: `${field} must be unique`
            });
        }
        return res.status(500).json({
            message: "Server Error"
        });
    }
};

// DELETE ROUTE
export const deleteRoute = async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    
    if (user.hierarchy !== "ADMIN") {
        return res.status(403).json({
            message: "Not Admin",
        });
    }
    
    try {
        const route = await Route.findByIdAndDelete(id);
        
        if (!route) {
            return res.status(404).json({
                message: "Route Not Found"
            });
        }
        
        return res.status(200).json({
            message: "Route Deleted Successfully",
            data: route
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server Error"
        });
    }
};

// GET ROUTES BY SOURCE
export const getRoutesBySource = async (req, res) => {
    const user = req.user;
    const { source } = req.params;
    
    if (user.hierarchy !== "ADMIN") {
        return res.status(403).json({
            message: "Not Admin",
        });
    }
    
    try {
        const routes = await Route.find({
            source: source.toUpperCase()
        }).sort({ routeName: 1 });
        
        if (!routes || routes.length === 0) {
            return res.status(404).json({
                message: "No Routes Found for this Source"
            });
        }
        
        return res.status(200).json({
            message: "Routes Retrieved Successfully",
            data: routes,
            count: routes.length
        });
    } catch (error) {
        return res.status(500).json({
            message: "Backend Error"
        });
    }
};

// GET ROUTES BY DESTINATION
export const getRoutesByDestination = async (req, res) => {
    const user = req.user;
    const { destination } = req.params;
    
    if (user.hierarchy !== "ADMIN") {
        return res.status(403).json({
            message: "Not Admin",
        });
    }
    
    try {
        const routes = await Route.find({
            destination: destination.toUpperCase()
        }).sort({ routeName: 1 });
        
        if (!routes || routes.length === 0) {
            return res.status(404).json({
                message: "No Routes Found for this Destination"
            });
        }
        
        return res.status(200).json({
            message: "Routes Retrieved Successfully",
            data: routes,
            count: routes.length
        });
    } catch (error) {
        return res.status(500).json({
            message: "Backend Error"
        });
    }
};

// SEARCH ROUTES (by source to destination)
export const searchRoutes = async (req, res) => {
    const user = req.user;
    const { source, destination } = req.query;
    
    if (user.hierarchy !== "ADMIN") {
        return res.status(403).json({
            message: "Not Admin",
        });
    }
    
    if (!source || !destination) {
        return res.status(400).json({
            message: "Source and Destination are required"
        });
    }
    
    try {
        const routes = await Route.find({
            source: source.toUpperCase(),
            destination: destination.toUpperCase()
        }).sort({ routeLength: 1 }); // Sort by shortest route first
        
        if (!routes || routes.length === 0) {
            return res.status(404).json({
                message: "No Routes Found for this Source-Destination pair"
            });
        }
        
        return res.status(200).json({
            message: "Routes Retrieved Successfully",
            data: routes,
            count: routes.length
        });
    } catch (error) {
        return res.status(500).json({
            message: "Backend Error"
        });
    }
};
