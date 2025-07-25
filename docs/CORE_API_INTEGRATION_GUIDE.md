# Core API Integration Guide

## Overview

This guide explains how your **Core API** (system of record) can integrate with the **AI API** (vector processing) to maintain synchronized blueprint indexing for RAG operations.

## Architecture Pattern

```
┌─────────────────┐    HTTP Calls    ┌─────────────────┐
│    Core API     │ ────────────────► │     AI API      │
│                 │                   │                 │
│ • Stores        │                   │ • Vector Index  │
│   Blueprints    │                   │ • RAG Chat      │
│ • Business      │                   │ • Embeddings    │
│   Logic         │                   │ • Search        │
│ • User Data     │                   │                 │
└─────────────────┘                   └─────────────────┘
```

## Integration Points

### 1. **Blueprint Created** → Index in AI API
When a new blueprint is created in your Core API, call the AI API to index it.

### 2. **Blueprint Updated** → Update AI API Index  
When a blueprint is modified in your Core API, call the AI API to update the vectors.

### 3. **Blueprint Deleted** → Remove from AI API
When a blueprint is deleted in your Core API, call the AI API to clean up vectors.

---

## Implementation Guide

### Core API HTTP Client Setup

Create an HTTP client service in your Core API to communicate with the AI API:

```python
# core_api/services/ai_api_client.py
import httpx
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class AIAPIClient:
    """HTTP client for communicating with AI API microservice."""
    
    def __init__(self, base_url: str, api_key: str, timeout: float = 30.0):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.timeout = timeout
        
        # Create persistent HTTP client
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            timeout=timeout
        )
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if AI API is healthy."""
        try:
            response = await self.client.get("/api/health")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"AI API health check failed: {e}")
            return {"status": "unhealthy", "error": str(e)}
    
    async def index_blueprint(self, blueprint: Dict[str, Any]) -> Dict[str, Any]:
        """
        Index a new blueprint in the AI API.
        
        Args:
            blueprint: LearningBlueprint as dictionary
            
        Returns:
            Indexing result from AI API
        """
        try:
            payload = {
                "blueprint": blueprint,
                "source": "core_api",
                "timestamp": datetime.utcnow().isoformat()
            }
            
            response = await self.client.post(
                "/api/v1/indexing/blueprint",
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Successfully indexed blueprint {blueprint.get('source_id')}")
            return result
            
        except httpx.HTTPStatusError as e:
            logger.error(f"AI API indexing failed with status {e.response.status_code}: {e.response.text}")
            raise AIAPIError(f"Indexing failed: {e.response.text}")
        except Exception as e:
            logger.error(f"AI API indexing failed: {e}")
            raise AIAPIError(f"Indexing failed: {str(e)}")
    
    async def update_blueprint(self, blueprint_id: str, blueprint: Dict[str, Any], strategy: str = "incremental") -> Dict[str, Any]:
        """
        Update an existing blueprint in the AI API.
        
        Args:
            blueprint_id: ID of blueprint to update
            blueprint: Updated LearningBlueprint as dictionary  
            strategy: "incremental" or "full_reindex"
            
        Returns:
            Update result from AI API
        """
        try:
            payload = {
                "blueprint": blueprint,
                "strategy": strategy,
                "source": "core_api",
                "timestamp": datetime.utcnow().isoformat()
            }
            
            response = await self.client.put(
                f"/api/v1/blueprints/{blueprint_id}",
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Successfully updated blueprint {blueprint_id} with {result.get('changes_applied', 0)} changes")
            return result
            
        except httpx.HTTPStatusError as e:
            logger.error(f"AI API update failed with status {e.response.status_code}: {e.response.text}")
            raise AIAPIError(f"Update failed: {e.response.text}")
        except Exception as e:
            logger.error(f"AI API update failed: {e}")
            raise AIAPIError(f"Update failed: {str(e)}")
    
    async def delete_blueprint(self, blueprint_id: str) -> Dict[str, Any]:
        """
        Delete a blueprint from the AI API.
        
        Args:
            blueprint_id: ID of blueprint to delete
            
        Returns:
            Deletion result from AI API
        """
        try:
            response = await self.client.delete(f"/api/v1/blueprints/{blueprint_id}")
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Successfully deleted blueprint {blueprint_id}")
            return result
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.warning(f"Blueprint {blueprint_id} not found in AI API (already deleted?)")
                return {"status": "not_found", "message": "Blueprint not found"}
            logger.error(f"AI API deletion failed with status {e.response.status_code}: {e.response.text}")
            raise AIAPIError(f"Deletion failed: {e.response.text}")
        except Exception as e:
            logger.error(f"AI API deletion failed: {e}")
            raise AIAPIError(f"Deletion failed: {str(e)}")
    
    async def get_blueprint_status(self, blueprint_id: str) -> Dict[str, Any]:
        """
        Get indexing status of a blueprint in the AI API.
        
        Args:
            blueprint_id: ID of blueprint to check
            
        Returns:
            Status information from AI API
        """
        try:
            response = await self.client.get(f"/api/v1/blueprints/{blueprint_id}/status")
            response.raise_for_status()
            return response.json()
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return {"status": "not_indexed", "is_indexed": False}
            logger.error(f"AI API status check failed: {e.response.text}")
            raise AIAPIError(f"Status check failed: {e.response.text}")
        except Exception as e:
            logger.error(f"AI API status check failed: {e}")
            raise AIAPIError(f"Status check failed: {str(e)}")
    
    async def preview_blueprint_changes(self, blueprint_id: str, blueprint: Dict[str, Any]) -> Dict[str, Any]:
        """
        Preview changes that would be made when updating a blueprint (dry run).
        
        Args:
            blueprint_id: ID of blueprint to preview changes for
            blueprint: Updated LearningBlueprint as dictionary
            
        Returns:
            Change preview from AI API
        """
        try:
            payload = {
                "blueprint": blueprint,
                "source": "core_api",
                "timestamp": datetime.utcnow().isoformat()
            }
            
            response = await self.client.post(
                f"/api/v1/blueprints/{blueprint_id}/changes",
                json=payload
            )
            response.raise_for_status()
            return response.json()
            
        except httpx.HTTPStatusError as e:
            logger.error(f"AI API change preview failed: {e.response.text}")
            raise AIAPIError(f"Change preview failed: {e.response.text}")
        except Exception as e:
            logger.error(f"AI API change preview failed: {e}")
            raise AIAPIError(f"Change preview failed: {str(e)}")


class AIAPIError(Exception):
    """Exception raised when AI API calls fail."""
    pass


# Singleton client instance
_ai_api_client: Optional[AIAPIClient] = None

def get_ai_api_client() -> AIAPIClient:
    """Get the singleton AI API client instance."""
    global _ai_api_client
    if _ai_api_client is None:
        raise RuntimeError("AI API client not initialized. Call initialize_ai_api_client() first.")
    return _ai_api_client

def initialize_ai_api_client(base_url: str, api_key: str, timeout: float = 30.0):
    """Initialize the AI API client singleton."""
    global _ai_api_client
    _ai_api_client = AIAPIClient(base_url, api_key, timeout)

async def shutdown_ai_api_client():
    """Shutdown the AI API client."""
    global _ai_api_client
    if _ai_api_client:
        await _ai_api_client.close()
        _ai_api_client = None
```

---

## Core API Endpoint Integration

### Blueprint Creation Hook

```python
# core_api/api/blueprints.py
from core_api.services.ai_api_client import get_ai_api_client, AIAPIError

@router.post("/blueprints", response_model=BlueprintResponse)
async def create_blueprint(request: CreateBlueprintRequest):
    """Create a new blueprint and index it in AI API."""
    try:
        # 1. Create blueprint in Core API database
        blueprint = await blueprint_service.create_blueprint(request)
        
        # 2. Index in AI API (async, non-blocking)
        try:
            ai_client = get_ai_api_client()
            indexing_result = await ai_client.index_blueprint(
                blueprint=blueprint.model_dump()
            )
            
            # Log successful indexing
            logger.info(f"Blueprint {blueprint.id} indexed successfully in AI API")
            
        except AIAPIError as e:
            # Log error but don't fail the blueprint creation
            logger.error(f"Failed to index blueprint {blueprint.id} in AI API: {e}")
            # Could trigger retry mechanism or manual reindex later
            
        # 3. Return Core API response
        return BlueprintResponse.from_blueprint(blueprint)
        
    except Exception as e:
        logger.error(f"Blueprint creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Blueprint creation failed: {str(e)}")
```

### Blueprint Update Hook

```python
@router.put("/blueprints/{blueprint_id}", response_model=BlueprintResponse)
async def update_blueprint(blueprint_id: str, request: UpdateBlueprintRequest):
    """Update a blueprint and sync changes to AI API."""
    try:
        # 1. Update blueprint in Core API database
        blueprint = await blueprint_service.update_blueprint(blueprint_id, request)
        
        # 2. Update in AI API (async, incremental by default)
        try:
            ai_client = get_ai_api_client()
            
            # Option: Preview changes first (optional)
            if request.preview_changes:
                changes = await ai_client.preview_blueprint_changes(
                    blueprint_id, blueprint.model_dump()
                )
                logger.info(f"Blueprint {blueprint_id} would have {changes['total_changes']} changes")
            
            # Apply the update
            update_result = await ai_client.update_blueprint(
                blueprint_id=blueprint_id,
                blueprint=blueprint.model_dump(),
                strategy="incremental"  # or "full_reindex" for major changes
            )
            
            logger.info(f"Blueprint {blueprint_id} updated in AI API: {update_result['changes_applied']} changes applied")
            
        except AIAPIError as e:
            logger.error(f"Failed to update blueprint {blueprint_id} in AI API: {e}")
            # Could trigger manual reindex or retry
            
        return BlueprintResponse.from_blueprint(blueprint)
        
    except Exception as e:
        logger.error(f"Blueprint update failed: {e}")
        raise HTTPException(status_code=500, detail=f"Blueprint update failed: {str(e)}")
```

### Blueprint Deletion Hook

```python
@router.delete("/blueprints/{blueprint_id}")
async def delete_blueprint(blueprint_id: str):
    """Delete a blueprint and clean up AI API index."""
    try:
        # 1. Delete from Core API database
        await blueprint_service.delete_blueprint(blueprint_id)
        
        # 2. Clean up AI API index
        try:
            ai_client = get_ai_api_client()
            deletion_result = await ai_client.delete_blueprint(blueprint_id)
            logger.info(f"Blueprint {blueprint_id} deleted from AI API")
            
        except AIAPIError as e:
            logger.error(f"Failed to delete blueprint {blueprint_id} from AI API: {e}")
            # Could trigger manual cleanup later
        
        return {"status": "deleted", "blueprint_id": blueprint_id}
        
    except Exception as e:
        logger.error(f"Blueprint deletion failed: {e}")
        raise HTTPException(status_code=500, detail=f"Blueprint deletion failed: {str(e)}")
```

---

## Configuration

### Environment Variables

```bash
# Core API .env
AI_API_BASE_URL=http://localhost:8001  # or your AI API URL
AI_API_KEY=your-ai-api-key-here
AI_API_TIMEOUT=30.0
```

### Core API Startup Integration

```python
# core_api/main.py
from core_api.services.ai_api_client import initialize_ai_api_client, shutdown_ai_api_client
import os

@app.on_event("startup")
async def startup():
    # Initialize AI API client
    initialize_ai_api_client(
        base_url=os.getenv("AI_API_BASE_URL", "http://localhost:8001"),
        api_key=os.getenv("AI_API_KEY", ""),
        timeout=float(os.getenv("AI_API_TIMEOUT", "30.0"))
    )
    
    # Test connectivity
    from core_api.services.ai_api_client import get_ai_api_client
    ai_client = get_ai_api_client()
    health = await ai_client.health_check()
    
    if health.get("status") == "healthy":
        logger.info("AI API connection established")
    else:
        logger.warning(f"AI API connection issue: {health}")

@app.on_event("shutdown")
async def shutdown():
    # Cleanup AI API client
    await shutdown_ai_api_client()
```

---

## Advanced Integration Patterns

### 1. **Asynchronous Processing with Retries**

```python
from celery import Celery
from tenacity import retry, stop_after_attempt, wait_exponential

# Background task for AI API indexing
@celery.task(bind=True, max_retries=3)
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def index_blueprint_task(self, blueprint_data):
    try:
        ai_client = get_ai_api_client()
        result = await ai_client.index_blueprint(blueprint_data)
        return result
    except AIAPIError as e:
        logger.warning(f"AI API indexing retry {self.request.retries + 1}: {e}")
        raise self.retry(exc=e, countdown=60)
```

### 2. **Batch Operations**

```python
async def batch_sync_blueprints(blueprint_ids: list):
    """Sync multiple blueprints to AI API in batch."""
    ai_client = get_ai_api_client()
    results = []
    
    for blueprint_id in blueprint_ids:
        try:
            blueprint = await blueprint_service.get_blueprint(blueprint_id)
            result = await ai_client.update_blueprint(
                blueprint_id, blueprint.model_dump()
            )
            results.append({"blueprint_id": blueprint_id, "status": "success", "result": result})
        except Exception as e:
            results.append({"blueprint_id": blueprint_id, "status": "error", "error": str(e)})
            
    return results
```

### 3. **Health Monitoring**

```python
@router.get("/system/ai-api-status")
async def check_ai_api_status():
    """Check AI API connectivity and status."""
    try:
        ai_client = get_ai_api_client()
        health = await ai_client.health_check()
        
        return {
            "ai_api_status": health.get("status", "unknown"),
            "connectivity": "ok",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "ai_api_status": "unreachable",
            "connectivity": "failed",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
```

---

## Error Handling Strategies

### 1. **Graceful Degradation**
- Core API continues working even if AI API is down
- Index operations happen asynchronously 
- Failed operations get queued for retry

### 2. **Manual Recovery**
- Admin endpoint to re-sync specific blueprints
- Bulk re-indexing capabilities
- Status checking and monitoring

### 3. **Circuit Breaker Pattern**
```python
from circuit_breaker import CircuitBreaker

ai_api_breaker = CircuitBreaker(failure_threshold=5, timeout_duration=60)

@ai_api_breaker
async def safe_ai_api_call(operation, *args, **kwargs):
    ai_client = get_ai_api_client()
    return await getattr(ai_client, operation)(*args, **kwargs)
```

---

## Testing

### Mock AI API Client for Tests

```python
# core_api/tests/mocks/ai_api_client.py
class MockAIAPIClient:
    def __init__(self):
        self.indexed_blueprints = {}
    
    async def index_blueprint(self, blueprint):
        blueprint_id = blueprint["source_id"]
        self.indexed_blueprints[blueprint_id] = blueprint
        return {"status": "indexed", "nodes_created": 15}
    
    async def update_blueprint(self, blueprint_id, blueprint, strategy="incremental"):
        self.indexed_blueprints[blueprint_id] = blueprint
        return {"status": "updated", "changes_applied": 3}
    
    async def delete_blueprint(self, blueprint_id):
        if blueprint_id in self.indexed_blueprints:
            del self.indexed_blueprints[blueprint_id]
        return {"status": "deleted"}
```

---

## Summary

This integration pattern provides:

✅ **Loose Coupling**: Core API and AI API remain independent  
✅ **Fault Tolerance**: Core API works even if AI API is down  
✅ **Asynchronous Processing**: Non-blocking AI operations  
✅ **Retry Logic**: Automatic recovery from temporary failures  
✅ **Monitoring**: Health checks and status endpoints  
✅ **Scalability**: Each service can scale independently  

Your **Core API** is now the source of truth for blueprints, while your **AI API** provides the intelligent processing and search capabilities! 🚀
