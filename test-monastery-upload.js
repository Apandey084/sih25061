// test-monastery-upload.js
import FormData from "form-data";
import fs from "fs";
import fetch from "node-fetch"; // version 2.x required

// URL of your API
const API_URL = "http://localhost:3000/api/monasteries";

// Path to any image on your computer
const primaryImagePath = "./primary.jpg";    // change to actual file path
const extraImagePath = "./extra.jpg";        // optional

async function testMonasteryCreate() {
  try {
    const fd = new FormData();

    // Required fields
    fd.append("name", "Node Test Monastery");
    fd.append("location", "Bodh Gaya, Bihar, India");
    fd.append("description", "Testing monastery created using Node script");

    // Primary image (file)
    fd.append("image", fs.createReadStream(primaryImagePath));

    // Additional images (optional)
    if (fs.existsSync(extraImagePath)) {
      fd.append("images", fs.createReadStream(extraImagePath));
    }

    // Make request
    const res = await fetch(API_URL, {
      method: "POST",
      body: fd,
      headers: fd.getHeaders(), // Absolutely required when using Node FormData
    });

    const data = await res.json();
    console.log("\n=== Server Response ===");
    console.log(data);
    console.log("=======================\n");
  } catch (err) {
    console.error("ERROR:", err);
  }
}

testMonasteryCreate();
