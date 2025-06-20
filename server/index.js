const fs = require("fs").promises;
const path = require("path");
const { MongoClient } = require("mongodb");

// MongoDB configuration
const MONGODB_URI = "mongodb://localhost:27017"; // Change this to your MongoDB URI
const DATABASE_NAME = "what_is"; // Change this to your database name
const COLLECTION_NAME = "blogs";

// Folder containing text files
const TEXT_FILES_FOLDER = "./text-files"; // Change this to your folder path

// Blog model schema (for reference)
const blogSchema = {
  // id: ObjectId (automatically generated by MongoDB)
  title: String,
  content: String,
  createdAt: Date,
};

async function connectToMongoDB() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log("Connected to MongoDB");
  return client;
}

async function readTextFiles(folderPath) {
  try {
    const files = await fs.readdir(folderPath);
    const textFiles = files.filter((file) => file.endsWith(".txt"));

    const blogs = [];

    for (const file of textFiles) {
      const filePath = path.join(folderPath, file);
      const content = await fs.readFile(filePath, "utf8");

      // Remove file extension from title
      const title = path.parse(file).name;

      blogs.push({
        title: title,
        content: content.trim(),
        createdAt: new Date(),
      });

      console.log(`Read file: ${file}`);
    }

    return blogs;
  } catch (error) {
    console.error("Error reading files:", error);
    throw error;
  }
}

async function saveBlogsToMongoDB(blogs, client) {
  try {
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    if (blogs.length === 0) {
      console.log("No blogs to save");
      return;
    }

    const result = await collection.insertMany(blogs);
    console.log(`Successfully saved ${result.insertedCount} blogs to MongoDB`);

    // Display the inserted documents
    console.log("Inserted blogs:");
    blogs.forEach((blog, index) => {
      console.log(`${index + 1}. Title: "${blog.title}"`);
      console.log(`   Content length: ${blog.content.length} characters`);
    });
  } catch (error) {
    console.error("Error saving to MongoDB:", error);
    throw error;
  }
}

async function main() {
  let client;

  try {
    // Connect to MongoDB
    client = await connectToMongoDB();

    // Read text files from folder
    console.log(`Reading text files from: ${TEXT_FILES_FOLDER}`);
    const blogs = await readTextFiles(TEXT_FILES_FOLDER);

    if (blogs.length === 0) {
      console.log("No text files found in the specified folder");
      return;
    }

    console.log(`Found ${blogs.length} text file(s)`);

    // Save blogs to MongoDB
    await saveBlogsToMongoDB(blogs, client);
  } catch (error) {
    console.error("Error in main function:", error);
  } finally {
    // Close MongoDB connection
    if (client) {
      await client.close();
      console.log("MongoDB connection closed");
    }
  }
}

// Run the script
main().catch(console.error);
