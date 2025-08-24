const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

console.log("🚀 Starting Billboard Reports API Server...");

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(async () => {
  console.log("✅ MongoDB connected");
  
  // Check if there are any reports in the database
  const Report = require("./models/Report");
  const reportCount = await Report.countDocuments();
  console.log(`📊 Total reports in database: ${reportCount}`);
  
  if (reportCount > 0) {
    const latestReport = await Report.findOne().sort({ createdAt: -1 });
    console.log(`📝 Latest report: ${latestReport._id} - ${latestReport.description?.substring(0, 50)}...`);
  }
})
.catch(err => console.error("❌ MongoDB connection error:", err));

// Routes
const authRoutes = require("./routes/auth");      // authentication routes (login, register)
const reportRoutes = require("./routes/report");  // report CRUD routes

app.use("/api/auth", authRoutes);   // login/register API
app.use("/api/reports", reportRoutes); // reports API

// Default health check endpoint
app.get("/", (req, res) => {
  res.send("🚀 Billboard Reports API Running");
});

// Start server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}`);
});
