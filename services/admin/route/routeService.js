import Route from "../../../models/routemodel.js";

const populatedFields = [
  { path: 'source', select: 'stopName stopCode' },
  { path: 'destination', select: 'stopName stopCode' },
  { path: 'via', select: 'stopName stopCode' },
  {
    path: 'stops.stop',
    select: 'stopName stopCode country state border stopGrade',
    populate: [
      { path: 'country', select: 'countryCode country' },
      { path: 'state', select: 'stateCode state stateType' },
      { path: 'stopGrade', select: 'stopGradeName' }
    ]
  },
  { path: 'stops.toll', select: 'tollName state country' },
  {path:"region",select:"regionName Code"},
  {path:"depot",select:"depotCustomer code"}
];



export const getRoutes = async (req, res) => {
    try {
        const routes = await Route.find({}).populate(populatedFields).sort({ routeCode: -1 });
        if (!routes) {
            return res.status(404).json({ message: "Routes Not Found" });
        }
        return res.status(200).json({ message: routes, log: "ok" });
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const getRoute = async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Invalid ID" });
    try {
        const route = await Route.findById(id).populate(populatedFields);
        if (!route) {
            return res.status(404).json({ message: "Route Not Found" });
        }
        return res.status(200).json({ message: "Route Retrieved Successfully", data: route });
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const addRoute = async (req, res) => {
    let { source, destination, via, routeName, routeLength, stops } = req.body;
    
    if (!source || !destination  || !routeName) {
        return res.status(400).json({
            message: "Required fields are missing: source, destination, routeName"
        });
    }
    if(routeLength === undefined || routeLength === null){
        routeLength=0;
    }
    
    try {
        const validStops = stops ? stops.filter(s => s.stop || s.toll) : [];
        let newRoute = await Route.create({
            source,
            destination,
            via,
            routeName,
            routeLength,
            stops: validStops
        });
        
        if (!newRoute) {
            return res.status(500).json({ message: "Something went Wrong while Creating a Route" });
        }
        
        const populatedRoute = await Route.findById(newRoute._id).populate(populatedFields);
        
        return res.status(201).json({
            message: "Route Created Successfully",
            data: populatedRoute
        });
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const updateRoute = async (req, res) => {
    const { id } = req.params;
    const { source, destination, via, routeName, routeCode, routeLength, stops,depot,region } = req.body;
    
    if (!source || !destination || routeLength === undefined || routeLength === null || !routeName) {
        return res.status(400).json({ message: "All details Required" });
    }
    
    try {
        const validStops = stops ? stops.filter(s => s.stop || s.toll) : [];
        const updatedRoute = await Route.findByIdAndUpdate(
            id,
            { source, destination, via, routeName, routeCode, routeLength, stops: validStops,depot,region },
            { new: true, runValidators: true }
        ).populate(populatedFields);
        
        if (!updatedRoute) {
            return res.status(404).json({ message: "Route Not Found" });
        }
        
        return res.status(200).json({
            message: "Route Updated Successfully",
            data: updatedRoute
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: `Route Code must be unique` });
        }
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

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
        }).sort({ routeLength: 1 });
        
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