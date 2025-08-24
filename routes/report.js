const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Report = require("../models/Report");
const { authMiddleware, adminOnly } = require("../middleware/auth");

const router = express.Router();

// Multer storage config
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

/**
 * @route   POST /api/reports
 * @desc    Create a new report (auth required)
 * @access  Authenticated Users
 */
router.post("/", authMiddleware, upload.array("images", 5), async (req, res) => {
  try {
    console.log("=== Creating new report ===");
    console.log("Request body:", req.body);
    console.log("Files received:", req.files?.length || 0);
    
    const { latitude, longitude, description, category, violations } = req.body;
    if (!req.files || req.files.length === 0) {
      console.log("No files uploaded");
      return res.status(400).json({ success: false, message: "At least one image required" });
    }

    // Create image URLs for all uploaded files
    const imageUrls = req.files.map(file => {
      const url = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
      console.log("Generated image URL:", url);
      return url;
    });

    // Parse violations data if provided
    let violationData = null;
    if (violations) {
      try {
        violationData = JSON.parse(violations);
        console.log("Violation data received:", violationData);
      } catch (err) {
        console.log("Error parsing violations data:", err);
      }
    }

    const newReport = new Report({
      imageUrl: imageUrls[0], // Keep first image for backwards compatibility
      imageUrls: imageUrls, // Store all image URLs
      latitude: Number(latitude),
      longitude: Number(longitude),
      description,
      category: category || "Other",
      createdBy: req.user.id, // store creator ID
      violations: violationData || {
        hasViolations: false,
        violatedWords: [],
        detectedText: '',
        severity: 'NONE'
      }
    });

    console.log("Saving report:", newReport);
    await newReport.save();
    console.log("Report saved successfully with ID:", newReport._id);
    
    res.json({ success: true, message: "Report saved", data: newReport });
  } catch (err) {
    console.error("Create report error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   GET /api/reports
 * @desc    Fetch all reports with pagination
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    console.log("=== Fetching reports ===");
    console.log("Query params:", req.query);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    console.log(`Pagination: page=${page}, limit=${limit}, skip=${skip}`);

    const total = await Report.countDocuments();
    console.log("Total reports in database:", total);
    
    const reports = await Report.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log("Reports fetched:", reports.length);
    console.log("Report IDs:", reports.map(r => r._id.toString()));

    const totalPages = Math.ceil(total / limit);

    const response = {
      data: reports,
      totalPages,
      currentPage: page,
      total
    };

    console.log("Sending response:", { 
      dataCount: response.data.length, 
      totalPages: response.totalPages, 
      currentPage: response.currentPage, 
      total: response.total 
    });

    res.json(response);
  } catch (err) {
    console.error("Get reports error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   DELETE /api/reports/:id
 * @desc    Delete a report by ID (admin can delete any, users can delete their own)
 * @access  Authenticated Users
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    // Check if user is admin OR if the report belongs to the user
    if (req.user.role !== 'admin' && report.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this report" });
    }

    await Report.findByIdAndDelete(req.params.id);

    // Remove associated image files
    if (report.imageUrls && report.imageUrls.length > 0) {
      report.imageUrls.forEach(imageUrl => {
        // imageUrl looks like: http://host/uploads/filename.jpg
        const relativePath = imageUrl.replace(`${req.protocol}://${req.get("host")}/`, "");
        const filePath = path.join(__dirname, "..", relativePath);
        fs.unlink(filePath, err => {
          if (err) console.error("File delete error:", err);
        });
      });
    }

    res.json({ success: true, message: "Report deleted successfully" });
  } catch (err) {
    console.error("Delete report error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
