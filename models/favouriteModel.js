import { model, Schema } from "mongoose";

const favouriteSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    trips: {
        type: Schema.Types.ObjectId,
        ref: "TripConfig",
        required: false
    },
    routes: {
        type: Schema.Types.ObjectId,
        ref: "Route",
        required: false
    }
}, { timestamps: true });

const Favourite = model("Favourite", favouriteSchema);
export default Favourite;