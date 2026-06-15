const sharp = require('sharp');
const fs = require('fs');

async function processLogo() {
  const input = 'assets/images/align-logo.png';
  const meta = await sharp(input).metadata();
  console.log('Image size:', meta.width, meta.height);
  
  // The 'A' in 'Align' is the first letter. Assuming it's roughly the first 25-30% of the width.
  // Let's crop it. We might need to guess the width. Since I don't know the exact bounding box,
  // I will assume it's a typical aspect ratio. 'A' is usually roughly square or slightly taller.
  // We can try extracting the leftmost non-transparent pixels.
  // Sharp has a 'trim' function to remove transparent borders.
  
  // Actually, we can just crop the left part. Let's say width is meta.height (making it a square)
  // because the 'A' mark is usually roughly square.
  const size = Math.min(meta.width, meta.height * 1.2); 
  // Wait, let's just use trim to get the bounding box of the whole logo,
  // but it's probably already trimmed.
  
  // Let's assume the 'A' takes up the left part of the image, and it's roughly as wide as it is tall.
  const cropWidth = 345;
  
  await sharp(input)
    .extract({ left: 0, top: 0, width: cropWidth, height: meta.height })
    .toFile('assets/images/align-icon.png');
    
  // Now create the white version.
  // We can change the color by applying a color matrix or just changing all non-transparent pixels to white.
  // Or we can extract the alpha channel, and use it as the alpha for a solid white image.
  await sharp({
    create: {
      width: cropWidth,
      height: meta.height,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }
    }
  })
  .joinChannel(
    await sharp(input)
      .extract({ left: 0, top: 0, width: cropWidth, height: meta.height })
      .extractChannel('alpha')
      .toBuffer()
  )
  .toFile('assets/images/align-icon-white.png');
  
  console.log('Cropped successfully');
}

processLogo().catch(console.error);
