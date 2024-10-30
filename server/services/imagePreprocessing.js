const sharp = require('sharp');

async function preprocessImage(imageBuffer) {
  try {
    const processedImage = await sharp(imageBuffer)
      // Convert to grayscale
      .grayscale()
      // Increase contrast
      .linear(1.5, -0.2)
      // Sharpen the image
      .sharpen({
        sigma: 2,
        flat: 1,
        jagged: 1
      })
      // Resize while maintaining aspect ratio
      .resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true
      })
      // Remove noise
      .median(1)
      // Normalize the image
      .normalize()
      .toBuffer();

    return processedImage;
  } catch (error) {
    console.error('Image preprocessing failed:', error);
    return imageBuffer;  // Return original if processing fails
  }
}

module.exports = { preprocessImage };