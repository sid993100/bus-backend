import { model, Schema } from "mongoose";

const permissionSchema = new Schema({
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false }
}, { _id: false });

// Default permission object for each resource
const defaultPermission = {
    create: false,
    read: false,
    update: false,
    delete: false
};

const roleSchema = new Schema({
    role: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
    },
    department: {
        type: Schema.Types.ObjectId,
        ref: "Account"
    },
    permissions: {
        account: { type: permissionSchema, default: defaultPermission },
        busStop: { type: permissionSchema, default: defaultPermission },
        conductor: { type: permissionSchema, default: defaultPermission },
        country: { type: permissionSchema, default: defaultPermission },
        tollType: { type: permissionSchema, default: defaultPermission },
        department: { type: permissionSchema, default: defaultPermission },
        duty: { type: permissionSchema, default: defaultPermission },
        driver: { type: permissionSchema, default: defaultPermission },
        ownerType: { type: permissionSchema, default: defaultPermission },
        pisReg: { type: permissionSchema, default: defaultPermission },
        plan: { type: permissionSchema, default: defaultPermission },
        route: { type: permissionSchema, default: defaultPermission },
        seatLayout: { type: permissionSchema, default: defaultPermission },
        serviceCategory: { type: permissionSchema, default: defaultPermission },
        serviceType: { type: permissionSchema, default: defaultPermission },
        sim: { type: permissionSchema, default: defaultPermission },
        state: { type: permissionSchema, default: defaultPermission },
        stopeGrade: { type: permissionSchema, default: defaultPermission },
        subscription: { type: permissionSchema, default: defaultPermission },
        trip: { type: permissionSchema, default: defaultPermission },
        user: { type: permissionSchema, default: defaultPermission },
        vehicle: { type: permissionSchema, default: defaultPermission },
        vehicleM: { type: permissionSchema, default: defaultPermission },
        vehicleType: { type: permissionSchema, default: defaultPermission },
        vehicleModel: { type: permissionSchema, default: defaultPermission },
        vltDevice: { type: permissionSchema, default: defaultPermission },
        viltM: { type: permissionSchema, default: defaultPermission },
        vltModel: { type: permissionSchema, default: defaultPermission },
        depot: { type: permissionSchema, default: defaultPermission },
        zone: { type: permissionSchema, default: defaultPermission },
        gender:{ type: permissionSchema, default: defaultPermission },//new
        photoIdCard:{ type: permissionSchema, default: defaultPermission },//new
        pismanuf:{ type: permissionSchema, default: defaultPermission },//new
        pisType:{ type: permissionSchema, default: defaultPermission },//new
        pisModel:{ type: permissionSchema, default: defaultPermission },//new
        employType:{ type: permissionSchema, default: defaultPermission },//new
        vltSim:{ type: permissionSchema, default: defaultPermission },//new
        liveTrack:{ type: permissionSchema, default: defaultPermission },//new
        journey:{ type: permissionSchema, default: defaultPermission },//new
        event:{ type: permissionSchema, default: defaultPermission },//new
        rawData:{ type: permissionSchema, default: defaultPermission },//new
        journeyHistory:{ type: permissionSchema, default: defaultPermission },//new
        incident:{ type: permissionSchema, default: defaultPermission },//new
        vehicleActivity:{ type: permissionSchema, default: defaultPermission },//new
        crowedManagement:{ type: permissionSchema, default: defaultPermission },//new
        idlingSummary:{ type: permissionSchema, default: defaultPermission },//new
        rawData:{ type: permissionSchema, default: defaultPermission },//new
        vehicleActivity:{ type: permissionSchema, default: defaultPermission },//new
        journeyHistory:{ type: permissionSchema, default: defaultPermission },//new
        firmware:{ type: permissionSchema, default: defaultPermission },//new
        idlingSummary:{ type: permissionSchema, default: defaultPermission },//new
        distanceTravelled:{ type: permissionSchema, default: defaultPermission },//new
        vehicleUtilization:{ type: permissionSchema, default: defaultPermission },//new
        stoppageDetailedReport:{ type: permissionSchema, default: defaultPermission },//new
        idlingDetailedReport:{ type: permissionSchema, default: defaultPermission },//new
        vehicleCurrentStatus:{ type: permissionSchema, default: defaultPermission },//new
    },
    hierarchy: {
        type: Schema.Types.ObjectId,
        ref: "Hierarchy",
        required:true
    }
}, {
    timestamps: true
});

const Role = model("Role", roleSchema);
export default Role;
