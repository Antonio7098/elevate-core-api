import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testPineconeMetadata() {
  try {
    console.log('🔍 Starting Pinecone Metadata Investigation');
    
    const blueprintId = 131;
    console.log(`🔍 Investigating metadata for blueprint ${blueprintId}`);
    
    // First, let's query the AI API to search for vectors with this blueprint_id
    console.log('🔍 Searching for vectors with blueprint_id filter...');
    const searchResponse = await axios.post(
      'http://localhost:8000/api/v1/search',
      {
        query: "test query",
        top_k: 5,
        filter_metadata: {
          blueprint_id: blueprintId.toString()
        }
      },
      {
        headers: {
          'Authorization': 'Bearer test_api_key_123',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`📊 Search results count: ${searchResponse.data.results?.length || 0}`);
    if (searchResponse.data.results && searchResponse.data.results.length > 0) {
      console.log('📊 Sample metadata from first result:');
      console.log(JSON.stringify(searchResponse.data.results[0].metadata, null, 2));
    }
    
    // Now try with blueprint_id as a number
    console.log('🔍 Searching for vectors with blueprint_id as number...');
    const searchResponse2 = await axios.post(
      'http://localhost:8000/api/v1/search',
      {
        query: "test query", 
        top_k: 5,
        filter_metadata: {
          blueprint_id: blueprintId
        }
      },
      {
        headers: {
          'Authorization': 'Bearer test_api_key_123',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`📊 Search results count (number): ${searchResponse2.data.results?.length || 0}`);
    if (searchResponse2.data.results && searchResponse2.data.results.length > 0) {
      console.log('📊 Sample metadata from first result (number):');
      console.log(JSON.stringify(searchResponse2.data.results[0].metadata, null, 2));
    }
    
    // Try searching without any filter to see all metadata structure
    console.log('🔍 Searching without filter to see metadata structure...');
    const searchResponse3 = await axios.post(
      'http://localhost:8000/api/v1/search',
      {
        query: "test query",
        top_k: 3
      },
      {
        headers: {
          'Authorization': 'Bearer test_api_key_123',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`📊 Unfiltered search results count: ${searchResponse3.data.results?.length || 0}`);
    if (searchResponse3.data.results && searchResponse3.data.results.length > 0) {
      console.log('📊 Sample metadata structures:');
      searchResponse3.data.results.forEach((result: any, index: number) => {
        console.log(`Result ${index + 1} metadata:`, JSON.stringify(result.metadata, null, 2));
      });
    }
    
    console.log('🎉 Pinecone metadata investigation completed!');
    
  } catch (error: any) {
    console.error('❌ Pinecone metadata investigation failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
    }
  }
}

testPineconeMetadata();
