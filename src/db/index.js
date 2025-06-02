import mongoose from "mongoose";console.log("Attempting to connect to MongoDB...");
try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("MongoDB connected successfully");
} catch (error) {
    console.error("Mongo DB connection error", error);
    console.log("MongoDB connection failed");
}

const mongoDBConnection = async () => {
    //Uncomment the following lines to enable MongoDB connection
    try {
        await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("Mongo DB connection error", error);
    }
};

export default mongoDBConnection; // Ensure this export is present
