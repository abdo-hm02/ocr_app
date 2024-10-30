// server/routes/idcard.js
const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

const extractFields = (frontText, backText) => {
  // Clean the texts
  const cleanText = (text) => text.replace(/\s+/g, ' ').trim();

  const extractNamesAndBirthplace = (text) => {
    // Remove header text
    const cleanedText = text.replace(/ROYAUME DU MAROC/i, '')
                           .replace(/ARTE NATIONALE D'IDENTITE/i, '');
    
    // Get all capital words (excluding common words)
    const capitalWords = cleanedText.match(/[A-Z]{2,}/g) || [];
    
    return {
      firstName: capitalWords[0] || null,
      lastName: capitalWords[1] || null,
      birthPlace: capitalWords[2] || null
    };
  };

  const extractIdNumber = (text) => {
    const match = text.match(/N°\s*([A-Z]{1,2}\d+)/i);
    return match ? match[1] : null;
  };

  const extractDates = (text) => {
    const datePattern = /\d{2}[\.\/]\d{2}[\.\/]\d{4}/g;
    const dates = text.match(datePattern) || [];
    return {
      birthDate: dates[0] || null,
      expiryDate: dates[1] || null
    };
  };

  const extractAddress = (text) => {
    const match = text.match(/Adresse\s+(.*?)(?=\s*Sexe|$)/i);
    return match ? match[1].trim() : null;
  };

  const extractSex = (text) => {
    const match = text.match(/Sexe\s+([MF])/i);
    return match ? match[1] : null;
  };

  const frontClean = cleanText(frontText);
  const backClean = cleanText(backText);

  const { firstName, lastName, birthPlace } = extractNamesAndBirthplace(frontClean);

  return {
    idNumber: extractIdNumber(backClean),
    firstName,
    lastName,
    birthDate: extractDates(frontClean).birthDate,
    expiryDate: extractDates(frontClean).expiryDate,
    birthPlace,
    address: extractAddress(backClean),
    sex: extractSex(backClean),
    civilStatus: backClean.match(/\d+\/\d{4}/)?.[0] || null
  };
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

      const [frontResult, backResult] = await Promise.all([
        Tesseract.recognize(
          frontImage.buffer,
          'ara+eng',
          {
            logger: m => console.log(m)
          }
        ),
        Tesseract.recognize(
          backImage.buffer,
          'ara+eng',
          {
            logger: m => console.log(m)
          }
        )
      ]);

      const extractedData = extractFields(frontResult.data.text, backResult.data.text);

      res.json({ 
        success: true,
        data: extractedData,
        rawText: {
          front: frontResult.data.text,
          back: backResult.data.text
        }
      });

    } catch (error) {
      console.error('OCR Error:', error);
      res.status(500).json({ error: 'Failed to process ID card' });
    }
});

module.exports = router;