import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    console.log('db url: ', process.env.dburl);
    await mongoose.connect(process.env.dburl);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
