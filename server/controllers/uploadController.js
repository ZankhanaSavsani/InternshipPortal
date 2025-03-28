const {
  uploadFileToDrive,
  deleteLocalFile,
} = require("../utils/googleDriveUtils");

const uploadFiles = async (req, res) => {
  try {
    const { files } = req;

    // Upload stipendProof if provided
    let stipendProofUrl = null;
    const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (files.stipendProof) {
      stipendProofUrl = await uploadFileToDrive(
        files.stipendProof[0],
        FOLDER_ID
      );
      deleteLocalFile(files.stipendProof[0].path); // Delete the local file after upload
    }

    // Upload completionCertificate
    let completionCertificateUrl = null;
    if (files.completionCertificate) {
      completionCertificateUrl = await uploadFileToDrive(
        files.completionCertificate[0],
        FOLDER_ID
      );
      deleteLocalFile(files.completionCertificate[0].path); // Delete the local file after upload
    }

    // Save the URLs in your database or respond to the client
    res.status(200).json({
      stipendProofUrl,
      completionCertificateUrl,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    res.status(500).json({ error: "Failed to upload files" });
  }
};

module.exports = { uploadFiles };
