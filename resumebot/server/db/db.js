import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const dbUrl = process.env.MONGODB_URI || process.env.dburl;

    if (!dbUrl) {
      console.error("❌ MongoDB connection error: 'MONGODB_URI' or 'dburl' is not defined in environment variables.");
      // Don't exit immediately, let the app fail or try again? 
      // Actually standard practice is to exit if DB is critical.
      // But for development, maybe we can warn.
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(dbUrl);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};
