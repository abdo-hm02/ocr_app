// server/routes/idcard.js
const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
 storage,
 limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper function to clean text
const cleanText = (text) => {
 return text
   .replace(/\s+/g, '') // Remove all spaces
   .replace(/[^A-Z0-9\u0600-\u06FF]/g, '') // Keep only uppercase letters, numbers, and Arabic characters
   .trim();
};

// Helper function to extract specific data
const extractData = (text) => {
 // Convert text to uppercase and clean it
 const cleanedText = text.toUpperCase();
 
 // Create an object to store extracted data
 const data = {
   rawText: cleanedText, // Keep raw text for reference/debugging
   extractedData: {
     // You can add specific extraction logic here based on your ID card format
     // For example:
     // idNumber: cleanedText.match(/your-pattern-here/)?.[0],
     // name: cleanedText.match(/your-pattern-here/)?.[0],
     // etc.
   }
 };

 return data;
};

router.post('/scan-id', 
 upload.fields([
   { name: 'frontImage', maxCount: 1 },
   { name: 'backImage', maxCount: 1 }
 ]), 
 async (req, res) => {
   try {
     const frontImage = req.files['frontImage'][0];
     const backImage = req.files['backImage'][0];

     const frontResult = await Tesseract.recognize(
       frontImage.buffer,
       'ara+eng',
       {
         logger: m => console.log(m),
         tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
       }
     );

     const backResult = await Tesseract.recognize(
       backImage.buffer,
       'ara+eng',
       {
         logger: m => console.log(m),
         tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
       }
     );

     // Clean and extract data
     const frontData = extractData(cleanText(frontResult.data.text));
     const backData = extractData(cleanText(backResult.data.text));

     res.json({
       success: true,
       frontSide: frontData,
       backSide: backData
     });

   } catch (error) {
     console.error('OCR Error:', error);
     res.status(500).json({ 
       error: 'Failed to process ID card'
     });
   }
});

module.exports = router;