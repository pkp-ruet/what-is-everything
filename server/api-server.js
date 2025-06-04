const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DATABASE_NAME = process.env.DATABASE_NAME || "what-is-everything";
const COLLECTION_NAME = "blogs";

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// MongoDB client
let db;

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DATABASE_NAME);
    console.log("✅ Connected to MongoDB");

    // Test the connection
    await db.admin().ping();
    console.log("✅ MongoDB connection verified");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
}

// API Routes

// GET /api/blogs - Get all blogs with pagination
app.get("/api/blogs", async (req, res) => {
  try {
    const collection = db.collection(COLLECTION_NAME);

    // Parse query parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const skip = (page - 1) * limit;

    // Validate sortBy field
    const allowedSortFields = ["title", "createdAt", "_id"];
    const actualSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    // Get total count for pagination info
    const totalBlogs = await collection.countDocuments();

    // Fetch blogs with pagination and sorting
    const blogs = await collection
      .find({})
      .sort({ [actualSortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Calculate pagination info
    const totalPages = Math.ceil(totalBlogs / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: blogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalBlogs,
        blogsPerPage: limit,
        hasNextPage,
        hasPrevPage,
      },
    });
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

    // Validate ObjectId
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

// GET /api/blogs/search/:query - Search blogs by title or content
app.get("/api/blogs/search/:query", async (req, res) => {
  try {
    const { query } = req.params;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long",
      });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const collection = db.collection(COLLECTION_NAME);

    // Create search filter (case-insensitive)
    const searchFilter = {
      $or: [
        { title: { $regex: query.trim(), $options: "i" } },
        { content: { $regex: query.trim(), $options: "i" } },
      ],
    };

    // Get total count for pagination
    const totalBlogs = await collection.countDocuments(searchFilter);

    // Fetch matching blogs
    const blogs = await collection
      .find(searchFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalPages = Math.ceil(totalBlogs / limit);

    res.json({
      success: true,
      data: blogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalBlogs,
        blogsPerPage: limit,
        searchQuery: query.trim(),
      },
    });
  } catch (error) {
    console.error("Error searching blogs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search blogs",
      error: error.message,
    });
  }
});

// GET /api/blogs/title/:title - Get blog by title
app.get("/api/blogs/title/:title", async (req, res) => {
  try {
    const { title } = req.params;

    const collection = db.collection(COLLECTION_NAME);
    const blog = await collection.findOne({ title: title });

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
    console.error("Error fetching blog by title:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blog",
      error: error.message,
    });
  }
});

// GET /api/stats - Get blog statistics
app.get("/api/stats", async (req, res) => {
  try {
    const collection = db.collection(COLLECTION_NAME);

    const totalBlogs = await collection.countDocuments();

    // Get average content length
    const avgContentLength = await collection
      .aggregate([
        {
          $group: {
            _id: null,
            avgLength: { $avg: { $strLenCP: "$content" } },
            minLength: { $min: { $strLenCP: "$content" } },
            maxLength: { $max: { $strLenCP: "$content" } },
          },
        },
      ])
      .toArray();

    // Get recent blogs
    const recentBlogs = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .project({ title: 1, createdAt: 1 })
      .toArray();

    // Get oldest blogs
    const oldestBlogs = await collection
      .find({})
      .sort({ createdAt: 1 })
      .limit(3)
      .project({ title: 1, createdAt: 1 })
      .toArray();

    const stats = avgContentLength[0] || {
      avgLength: 0,
      minLength: 0,
      maxLength: 0,
    };

    res.json({
      success: true,
      data: {
        totalBlogs,
        contentStats: {
          averageLength: Math.round(stats.avgLength || 0),
          minimumLength: stats.minLength || 0,
          maximumLength: stats.maxLength || 0,
        },
        recentBlogs,
        oldestBlogs,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
});

// GET /api/titles - Get all blog titles
app.get("/api/titles", async (req, res) => {
  try {
    const collection = db.collection(COLLECTION_NAME);

    const titles = await collection
      .find({})
      .project({ title: 1, createdAt: 1 })
      .sort({ title: 1 })
      .toArray();

    res.json({
      success: true,
      data: titles,
    });
  } catch (error) {
    console.error("Error fetching titles:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch titles",
      error: error.message,
    });
  }
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    await db.admin().ping();

    res.json({
      success: true,
      message: "Blog API is running",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        name: DATABASE_NAME,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// API documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Blog API Documentation",
    version: "1.0.0",
    endpoints: {
      "GET /api/blogs": "Get all blogs (with pagination)",
      "GET /api/blogs/:id": "Get single blog by ID",
      "GET /api/blogs/title/:title": "Get blog by title",
      "GET /api/blogs/search/:query": "Search blogs by title or content",
      "GET /api/stats": "Get blog statistics",
      "GET /api/titles": "Get all blog titles",
      "GET /health": "Health check",
    },
    queryParameters: {
      pagination: "page, limit",
      sorting: "sortBy, sortOrder",
      search: "page, limit",
    },
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    availableRoutes: [
      "GET /api",
      "GET /api/blogs",
      "GET /api/blogs/:id",
      "GET /api/blogs/title/:title",
      "GET /api/blogs/search/:query",
      "GET /api/stats",
      "GET /api/titles",
      "GET /health",
    ],
  });
});

// Error handling middleware
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

// Start server
async function startServer() {
  try {
    console.log("🚀 Starting Blog API server...");
    console.log(`📊 Database: ${DATABASE_NAME}`);
    console.log(`🗄️  Collection: ${COLLECTION_NAME}`);

    await connectToMongoDB();

    app.listen(PORT, () => {
      console.log(`\n✅ Blog API server running on port ${PORT}`);
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`📋 API Documentation: http://localhost:${PORT}/api`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
      console.log(`\n📚 Available endpoints:`);
      console.log(`  GET /api/blogs - Get all blogs`);
      console.log(`  GET /api/blogs/:id - Get single blog`);
      console.log(`  GET /api/blogs/title/:title - Get blog by title`);
      console.log(`  GET /api/blogs/search/:query - Search blogs`);
      console.log(`  GET /api/stats - Get statistics`);
      console.log(`  GET /api/titles - Get all titles`);
      console.log(`\n📖 Example usage:`);
      console.log(`  curl http://localhost:${PORT}/api/blogs`);
      console.log(
        `  curl http://localhost:${PORT}/api/blogs/search/javascript`
      );
      console.log(`\nReady to serve requests! 🎉`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

// Export for potential testing
module.exports = { app, startServer };
