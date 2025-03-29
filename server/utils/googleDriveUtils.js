const { google } = require("googleapis");
const fs = require("fs");

const auth = new google.auth.GoogleAuth({
  keyFile: "D:\\Internship_Portal-main\\server\\apikey.json", // Path to your Service Account JSON key file
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

const generateCustomFilename = (studentId, studentName, fileType, originalFilename) => {
  // Remove spaces and special characters from studentName
  const sanitizedStudentName = studentName.replace(/[^a-zA-Z0-9]/g, "_");

  // Generate the custom filename
  return `${studentId}_${sanitizedStudentName}_${fileType}_${originalFilename}`;
};

const uploadFileToDrive = async (file, folderId, customFilename) => {
  try {
    // Use the customFilename if provided, otherwise use the original filename
    const fileName = customFilename || file.originalname;

    const response = await drive.files.create({
      requestBody: {
        name: fileName, // Use the custom filename here
        mimeType: file.mimetype,
        parents: [folderId],
      },
      media: {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.path),
      },
    });

    // Make the file publicly accessible
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    // Return the file URL
    return `https://drive.google.com/uc?export=view&id=${response.data.id}`;
  } catch (error) {
    console.error("Error uploading file to Google Drive:", error);
    throw error;
  }
};

const deleteLocalFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) console.error("Error deleting local file:", err);
    else console.log("Local file deleted successfully:", filePath);
  });
};

module.exports = { generateCustomFilename, uploadFileToDrive, deleteLocalFile };