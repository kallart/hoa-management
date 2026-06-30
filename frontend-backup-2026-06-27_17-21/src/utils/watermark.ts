export const applyWatermark = (file: File, houseNumber: string): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context not available'));
        ctx.drawImage(img, 0, 0);
        const fontSize = Math.min(Math.max(24, Math.floor(img.width * 0.04)), 80);
        const padding = fontSize * 0.8;
        const watermarkText = `บ้านเลขที่ ${houseNumber}`;
        const timestampText = `อัปโหลดเมื่อ: ${new Date().toLocaleString('th-TH')}`;
        
        ctx.font = `bold ${fontSize}px "Noto Sans Thai", sans-serif`;
        ctx.fillStyle = 'rgba(220, 38, 38, 0.6)'; // Red text with 60% opacity
        ctx.textAlign = 'left';
        
        // Place text at the very bottom left with some padding
        const bottomPadding = fontSize;
        const leftPadding = fontSize * 0.8;
        const lineSpacing = fontSize * 1.5;
        const startY = img.height - bottomPadding - lineSpacing;

        ctx.fillText(watermarkText, leftPadding, startY);
        ctx.fillText(timestampText, leftPadding, startY + lineSpacing);
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Canvas toBlob failed'));
          const watermarkedFile = new File([blob], file.name, { type: file.type, lastModified: Date.now() });
          resolve(watermarkedFile);
        }, file.type, 0.9);
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
};
