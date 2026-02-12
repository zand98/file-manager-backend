const fs = require('fs');
const axios = require('axios');
const path = require('path');

async function run() {
  const filePath = path.resolve(process.env.FILE_PATH || '/home/zand/Desktop/test/mytextfile.txt');
  const collectionName = 'My Test Collection';
  const baseUrl = 'http://localhost:3000';
  const caseId = 1;

  try {
    // 1. Read file stats
    const stats = fs.statSync(filePath);
    const originalName = path.basename(filePath);
    const size = stats.size;
    
    console.log(`[1] Initiating upload for: ${originalName} (${size} bytes)`);

    // 2. Call init endpoint
    const initResponse = await axios.post(`${baseUrl}/cases/${caseId}/uploads/init`, {
      collectionName,
      files: [
        {
          originalName,
          size,
          mimeType: 'text/plain' // Or detect properly
        }
      ]
    });

    const fileData = initResponse.data[0];
    const { fileId, uploadId, key } = fileData;
    console.log(` -> Init success. File ID: ${fileId}, Upload ID: ${uploadId}`);

    // 3. Get Presigned URL for Part 1
    console.log(`[2] Getting presigned URL for part 1...`);
    const partUrlResponse = await axios.get(`${baseUrl}/files/${fileId}/part-url`, {
      params: { partNumber: 1 }
    });
    
    const uploadUrl = partUrlResponse.data.url;
    console.log(` -> Presigned URL obtained.`);

    // 4. PUT the file content to the presigned URL
    console.log(`[3] Uploading file content to Storage...`);
    const fileBuffer = fs.readFileSync(filePath);
    
    const uploadResponse = await axios.put(uploadUrl, fileBuffer, {
      headers: {
        'Content-Type': 'text/plain' 
      }
    });
    
    // ETag is returned in headers, usually surrounded by quotes
    let etag = uploadResponse.headers['etag'];
    if (etag) {
      etag = etag.replace(/"/g, ''); // Remove quotes if present
    }
    
    console.log(` -> Upload successful. ETag: ${etag}`);

    // 5. Complete Upload
    console.log(`[4] Completing upload...`);
    const completeResponse = await axios.post(`${baseUrl}/files/${fileId}/complete`, {
      parts: [
        {
          ETag: etag,
          PartNumber: 1
        }
      ]
    });

    console.log(`✅ File upload completed successfully!`);
    console.log(`Response:`, completeResponse.data);

    // 6. Verify with Download URL (Optional)
    console.log(`[5] Getting download URL to verify...`);
    const downloadRes = await axios.get(`${baseUrl}/files/${fileId}/download`);
    console.log(` -> Download URL: ${downloadRes.data.url}`);

  } catch (error) {
    console.error('❌ Error during upload process:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

run();
