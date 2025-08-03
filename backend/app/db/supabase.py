from supabase import create_client
from app.core.config import settings
from typing import Dict, List, Any, Optional

class MockSupabaseClient:
    """Mock Supabase client for development without a Supabase instance"""
    
    def __init__(self):
        self.mock_data = {
            "users": [
                {
                    "id": "1",
                    "email": "user@example.com",
                    "full_name": "Test User",
                    "password_hash": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW" # "password"
                }
            ],
            "messages": [],
            "documents": [],
            "legal_cases": []
        }
    
    def table(self, table_name: str):
        return MockSupabaseTable(table_name, self.mock_data)
    
    def storage(self):
        return MockSupabaseStorage()

class MockSupabaseTable:
    def __init__(self, table_name: str, mock_data: Dict):
        self.table_name = table_name
        self.mock_data = mock_data
        self.filters = []
    
    def select(self, columns: str):
        return self
    
    def eq(self, column: str, value: Any):
        self.filters.append((column, value))
        return self
    
    def execute(self):
        if self.table_name not in self.mock_data:
            return MockResponse([])
        
        if not self.filters:
            return MockResponse(self.mock_data[self.table_name])
        
        filtered_data = []
        for item in self.mock_data[self.table_name]:
            match = True
            for column, value in self.filters:
                if column not in item or item[column] != value:
                    match = False
                    break
            
            if match:
                filtered_data.append(item)
        
        return MockResponse(filtered_data)
    
    def insert(self, data: Dict):
        if self.table_name not in self.mock_data:
            self.mock_data[self.table_name] = []
        
        # Generate an ID if not provided
        if "id" not in data:
            max_id = 0
            for item in self.mock_data[self.table_name]:
                try:
                    item_id = int(item["id"])
                    max_id = max(max_id, item_id)
                except:
                    pass
            data["id"] = str(max_id + 1)
        
        self.mock_data[self.table_name].append(data)
        return MockResponse([data])

class MockSupabaseStorage:
    def __init__(self):
        self.buckets = {}
    
    def from_(self, bucket_name: str):
        if bucket_name not in self.buckets:
            self.buckets[bucket_name] = []
        return MockStorageBucket(bucket_name, self.buckets)

class MockStorageBucket:
    def __init__(self, bucket_name: str, buckets: Dict):
        self.bucket_name = bucket_name
        self.buckets = buckets
    
    def upload(self, path: str, file):
        self.buckets[self.bucket_name].append({
            "path": path,
            "file": f"mock_file_{path}"
        })
        return {"path": path}
    
    def download(self, path: str):
        # Mock download - return some sample bytes
        return b"Mock file content for testing"

class MockResponse:
    def __init__(self, data: List):
        self.data = data

# Initialize client based on configuration
if settings.SUPABASE_MOCK:
    supabase_client = MockSupabaseClient()
else:
    supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# Create a reference to Supabase storage
supabase_storage = supabase_client.storage()
