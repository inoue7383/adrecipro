/**
 * 画像を指定したサイズ・画質に圧縮・リサイズする
 */
export const resizeImage = (file, maxWidth, maxHeight, quality = 0.7) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // アスペクト比を維持してリサイズ
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // CanvasをBlob（ファイル形式）に変換
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          'image/jpeg', // 形式をJPEGに固定して軽くする
          quality
        );
      };
    };
  });
};