const buildCloudName = import.meta.env.VITE_CLOUD_NAME;
const buildUploadPreset = import.meta.env.VITE_UPLOAD_PRESET;

let cachedPublicConfig = null;

const getCloudinaryConfig = async () => {
  if (buildCloudName && buildUploadPreset) {
    return { cloudName: buildCloudName, uploadPreset: buildUploadPreset };
  }
  if (cachedPublicConfig) return cachedPublicConfig;
  try {
    const res = await fetch("/api/v1/public-config");
    if (res.ok) {
      cachedPublicConfig = await res.json();
      return cachedPublicConfig;
    }
  } catch {
    // Fallback to local Data URL when offline
  }
  return { cloudName: "", uploadPreset: "" };
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string" || !file.type?.startsWith("image/")) {
        return resolve({ url: result });
      }
      const img = new Image();
      img.onload = () => {
        const maxDim = 512;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve({ url: result });
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({ url: canvas.toDataURL("image/jpeg", 0.8) });
      };
      img.onerror = () => resolve({ url: result });
      img.src = result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const uploadImageToCloudinary = async (file) => {
  const { cloudName, uploadPreset } = await getCloudinaryConfig();
  if (!cloudName || !uploadPreset) {
    return readFileAsDataUrl(file);
  }

  const uploadData = new FormData();

  uploadData.append("file", file);
  uploadData.append("upload_preset", uploadPreset);
  uploadData.append("cloud_name", cloudName);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "post",
      body: uploadData,
    }
  );

  const data = await res.json();
  return data;
};

export default uploadImageToCloudinary;
