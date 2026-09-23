const cloud_name = import.meta.env.VITE_CLOUD_NAME;
const upload_preset = import.meta.env.VITE_UPLOAD_PRESET;

const uploadImageToCloudinary = async (file) => {
  if (!file) return { url: "", secure_url: "" };

  if (cloud_name && upload_preset) {
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("upload_preset", upload_preset);
      uploadData.append("cloud_name", cloud_name);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        {
          method: "post",
          body: uploadData,
        }
      );

      const data = await res.json();
      if (data?.url || data?.secure_url) {
        return {
          ...data,
          url: data.secure_url || data.url,
        };
      }
    } catch (e) {
      console.warn("Cloudinary upload failed, falling back to data URL:", e.message);
    }
  }

  // Fallback to local Data URL representation
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ url: reader.result, secure_url: reader.result });
    };
    reader.onerror = () => {
      resolve({ url: "", secure_url: "" });
    };
    reader.readAsDataURL(file);
  });
};

export default uploadImageToCloudinary;
