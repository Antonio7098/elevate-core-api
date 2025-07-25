import axios from 'axios';

const CORE_API_BASE_URL = 'http://localhost:3000';
const AI_API_BASE_URL = 'http://localhost:8000';

async function testBlueprintDeletionFixed() {
  console.log('=== Testing Fixed Blueprint Deletion ===');
  
  try {
    // 1. Create a blueprint
    console.log('\n1. Creating blueprint...');
    const createResponse = await axios.post(`${CORE_API_BASE_URL}/learning-blueprints`, {
      sourceText: 'Test deletion fix: The mitochondria is the powerhouse of the cell.',
      folderId: null
    }, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTczNzgwNzc1N30.Ew3gONvKPMhGqGhLhJvxiOvOKFTVwJQJdOyGCOGNHWw'
      }
    });
    
    const blueprintId = createResponse.data.id;
    console.log(`✓ Blueprint created with ID: ${blueprintId}`);
    
    // Wait for indexing to complete
    console.log('\n2. Waiting for indexing to complete...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 3. Check if sourceId was stored
    console.log('\n3. Checking if sourceId was stored...');
    const blueprintResponse = await axios.get(`${CORE_API_BASE_URL}/learning-blueprints/${blueprintId}`, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTczNzgwNzc1N30.Ew3gONvKPMhGqGhLhJvxiOvOKFTVwJQJdOyGCOGNHWw'
      }
    });
    
    const sourceId = blueprintResponse.data.sourceId;
    console.log(`✓ Blueprint sourceId: ${sourceId}`);
    
    if (!sourceId) {
      console.log('⚠️ Warning: sourceId not found, deletion may not work properly');
    }
    
    // 4. Search for vectors in Pinecone using the sourceId
    console.log('\n4. Searching for vectors in Pinecone...');
    const searchResponse = await axios.post(`${AI_API_BASE_URL}/api/v1/search`, {
      query: 'mitochondria',
      top_k: 10,
      filter: {
        blueprint_id: sourceId || blueprintId.toString()
      }
    });
    
    console.log(`✓ Found ${searchResponse.data.matches?.length || 0} vectors in Pinecone`);
    if (searchResponse.data.matches?.length > 0) {
      console.log(`  First match blueprint_id: ${searchResponse.data.matches[0].metadata?.blueprint_id}`);
    }
    
    // 5. Delete the blueprint
    console.log('\n5. Deleting blueprint...');
    const deleteResponse = await axios.delete(`${CORE_API_BASE_URL}/learning-blueprints/${blueprintId}`, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTczNzgwNzc1N30.Ew3gONvKPMhGqGhLhJvxiOvOKFTVwJQJdOyGCOGNHWw'
      }
    });
    
    console.log(`✓ Blueprint deletion response: ${deleteResponse.status}`);
    
    // 6. Verify vectors are deleted from Pinecone
    console.log('\n6. Verifying vectors are deleted from Pinecone...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for deletion to propagate
    
    try {
      const verifyResponse = await axios.post(`${AI_API_BASE_URL}/api/v1/search`, {
        query: 'mitochondria',
        top_k: 10,
        filter: {
          blueprint_id: sourceId || blueprintId.toString()
        }
      });
      
      const remainingVectors = verifyResponse.data.matches?.length || 0;
      if (remainingVectors === 0) {
        console.log('✅ SUCCESS: All vectors deleted from Pinecone!');
      } else {
        console.log(`❌ FAILURE: ${remainingVectors} vectors still remain in Pinecone`);
        console.log('  Remaining vectors:', verifyResponse.data.matches.map((m: any) => ({
          id: m.id,
          blueprint_id: m.metadata?.blueprint_id
        })));
      }
    } catch (error: any) {
      console.log('❌ Error verifying deletion:', error.response?.data || error.message);
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`HTTP Status: ${error.response.status}`);
    }
  }
}

// Run the test
testBlueprintDeletionFixed().catch(console.error);
