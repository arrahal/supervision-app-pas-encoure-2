export async function uploadToCloudinary(
  file: File,
  cloudName: string,
  uploadPreset: string,
  onProgress?: (pct: number) => void
): Promise<{ secure_url: string; public_id: string }> {
  if (!cloudName || !uploadPreset) {
    throw new Error('بيانات Cloudinary غير مكتملة (اسم الحساب أو Upload Preset).');
  }

  const isPdf = file.type === 'application/pdf';
  const resourceType = isPdf ? 'raw' : 'image';
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'superviseur_indh');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          onProgress(pct);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve({ secure_url: res.secure_url, public_id: res.public_id });
        } catch (e) {
          reject(new Error('خطأ في معالجة استجابة الخادم.'));
        }
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          reject(new Error(res.error?.message || `فشل الرفع برمز: ${xhr.status}`));
        } catch (e) {
          reject(new Error(`فشل الرفع برمز: ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('خطأ في الاتصال بالشبكة أثناء الرفع.'));
    };

    xhr.send(formData);
  });
}
