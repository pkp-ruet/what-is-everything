const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;

const COLLECTION_NAME = "blogs";

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// MongoDB client
let db;

async function connectToMongoDB() {
  try {
    const client = new MongoClient(MONGODB_URI, {
      tls: true,
    });

    await client.connect();
    db = client.db(DATABASE_NAME);
    console.log("✅ Connected to MongoDB");
    await db.admin().ping();
    console.log("✅ MongoDB connection verified");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
}

// GET /api/blogs - Get all blogs
app.get("/api/blogs", async (req, res) => {
  try {
    const collection = db.collection(COLLECTION_NAME);
    const blogs = await collection.find({}).toArray();

    res.json({ success: true, data: blogs });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
      error: error.message,
    });
  }
});

// GET /api/blogs/:id - Get single blog by ID
app.get("/api/blogs/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID format",
      });
    }

    const collection = db.collection(COLLECTION_NAME);
    const blog = await collection.findOne({ _id: new ObjectId(id) });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blog",
      error: error.message,
    });
  }
});

// 404 handler for other routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    availableRoutes: ["GET /api/blogs", "GET /api/blogs/:id"],
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: error.message,
  });
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down gracefully...");
  process.exit(0);
});

// Start the server
async function startServer() {
  try {
    console.log("🚀 Starting Blog API server...");
    console.log(`📊 Database: ${DATABASE_NAME}`);
    console.log(`🗄️  Collection: ${COLLECTION_NAME}`);

    await connectToMongoDB();

    app.listen(PORT, () => {
      console.log(`\n✅ Blog API server running on port ${PORT}`);
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`\n📚 Available endpoints:`);
      console.log(`  GET /api/blogs`);
      console.log(`  GET /api/blogs/:id`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
