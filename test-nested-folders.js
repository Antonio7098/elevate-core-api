const axios = require('axios');

async function testNestedFolders() {
  try {
    // First, let's get the JWT token (you'll need to replace with actual credentials)
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'test@example.com', // Replace with actual test user email
      password: 'password123'    // Replace with actual test user password
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Get all folders to see the structure
    const foldersResponse = await axios.get('http://localhost:3000/api/folders', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('📁 All folders:', JSON.stringify(foldersResponse.data, null, 2));

    // Find a folder that has children (nested folders)
    const foldersWithChildren = foldersResponse.data.filter(folder => folder.children && folder.children.length > 0);
    
    if (foldersWithChildren.length === 0) {
      console.log('❌ No folders with children found. Creating test data...');
      
      // Create a parent folder
      const parentFolderResponse = await axios.post('http://localhost:3000/api/folders', {
        name: 'Test Parent Folder',
        description: 'Parent folder for testing nested functionality'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const parentFolderId = parentFolderResponse.data.id;
      console.log('✅ Created parent folder with ID:', parentFolderId);

      // Create a child folder
      const childFolderResponse = await axios.post('http://localhost:3000/api/folders', {
        name: 'Test Child Folder',
        description: 'Child folder for testing nested functionality',
        parentId: parentFolderId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const childFolderId = childFolderResponse.data.id;
      console.log('✅ Created child folder with ID:', childFolderId);

      // Create a question set in the child folder
      const questionSetResponse = await axios.post('http://localhost:3000/api/questionsets', {
        name: 'Test Question Set in Child Folder',
        folderId: childFolderId,
        questions: [
          {
            text: 'What is the capital of France?',
            answer: 'Paris',
            questionType: 'TEXT',
            totalMarksAvailable: 1
          }
        ]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Created question set in child folder');

      // Now test the parent folder details
      const folderDetailsResponse = await axios.get(`http://localhost:3000/api/stats/folders/${parentFolderId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('📊 Parent folder details:', JSON.stringify(folderDetailsResponse.data, null, 2));
      
      if (folderDetailsResponse.data.questionSetSummaries.length > 0) {
        console.log('✅ SUCCESS: Parent folder details include question sets from nested folders!');
      } else {
        console.log('❌ FAILED: Parent folder details do not include question sets from nested folders');
      }
    } else {
      // Test with existing folder that has children
      const testFolder = foldersWithChildren[0];
      console.log(`🧪 Testing with existing folder: ${testFolder.name} (ID: ${testFolder.id})`);
      
      const folderDetailsResponse = await axios.get(`http://localhost:3000/api/stats/folders/${testFolder.id}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('📊 Folder details:', JSON.stringify(folderDetailsResponse.data, null, 2));
      
      if (folderDetailsResponse.data.questionSetSummaries.length > 0) {
        console.log('✅ SUCCESS: Folder details include question sets from nested folders!');
      } else {
        console.log('❌ FAILED: Folder details do not include question sets from nested folders');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testNestedFolders(); 