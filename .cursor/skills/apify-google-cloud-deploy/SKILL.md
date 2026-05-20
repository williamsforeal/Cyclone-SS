---
name: apify-google-cloud-deploy
description: Deploy Apify web scraping agents to Google Cloud Vertex AI Agent Engine. Use when deploying scrapers to production, integrating Apify with Google Cloud, or when the user mentions Vertex AI, Agent Engine, or cloud deployment.
---

# Apify Google Cloud Deployment

Deploy Apify web scraping agents to Google Cloud Vertex AI Agent Engine for production-scale scraping operations.

## Overview

Vertex AI Agent Engine allows you to deploy Python agents (including web scrapers) as managed services with:
- Auto-scaling
- Built-in monitoring
- Managed infrastructure
- API endpoints for invocation

## Prerequisites

```bash
# Install Google Cloud SDK
pip install google-cloud-aiplatform[agent_engines]

# Install Apify SDK
pip install apify-client

# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

## Deployment Methods

### Method 1: Deploy from Agent Object (Development)

Best for interactive development in Colab or local environments.

```python
from google.cloud.aiplatform import vertexai

# Initialize Vertex AI
vertexai.init(project='YOUR_PROJECT_ID', location='us-central1')

# Create agent engine client
client = vertexai.preview.reasoning_engines.ReasoningEngineClient()

# Deploy agent
remote_agent = client.agent_engines.create(
    agent=local_agent,
    config={
        "requirements": [
            "google-cloud-aiplatform[agent_engines]",
            "apify-client",
            "playwright"
        ],
        "display_name": "Apify Web Scraper",
        "description": "Production web scraper using Apify",
        "min_instances": 1,
        "max_instances": 10,
        "resource_limits": {"cpu": "4", "memory": "8Gi"}
    }
)
```

### Method 2: Deploy from Source Files (Production)

Best for CI/CD pipelines and Infrastructure as Code.

```python
remote_agent = client.agent_engines.create(
    config={
        "source_packages": ["scraper_directory"],
        "entrypoint_module": "scraper_directory.main",
        "entrypoint_object": "scraper_agent",
        "requirements_file": "requirements.txt",
        "class_methods": [
            {
                "name": "scrape",
                "api_mode": "",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "url": {"type": "string"},
                        "max_items": {"type": "integer"}
                    },
                    "required": ["url"]
                }
            }
        ],
        "display_name": "Apify Scraper",
        "min_instances": 1,
        "max_instances": 10
    }
)
```

## Agent Structure

### Directory Layout

```
apify-scraper/
├── scraper_directory/
│   ├── __init__.py
│   ├── main.py              # Agent entry point
│   └── utils.py             # Helper functions
├── requirements.txt
├── .actor/
│   └── actor.json
└── README.md
```

### Main Agent Code (main.py)

```python
import os
from apify_client import ApifyClient
from playwright.sync_api import sync_playwright

class ApifyScraperAgent:
    def __init__(self):
        self.apify_token = os.environ.get('APIFY_TOKEN')
        self.client = ApifyClient(self.apify_token)
    
    def scrape(self, url: str, max_items: int = 100) -> dict:
        """
        Scrape data from URL using Playwright
        
        Args:
            url: Target URL to scrape
            max_items: Maximum items to extract
            
        Returns:
            Dictionary with scraped data
        """
        results = []
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            try:
                page.goto(url, wait_until='networkidle')
                
                # Extract data
                items = page.query_selector_all('.product-item')
                
                for item in items[:max_items]:
                    data = {
                        'title': item.query_selector('.title').inner_text(),
                        'price': item.query_selector('.price').inner_text(),
                        'url': item.query_selector('a').get_attribute('href')
                    }
                    results.append(data)
                
            finally:
                browser.close()
        
        return {
            'success': True,
            'count': len(results),
            'data': results
        }
    
    def scrape_with_apify_actor(self, actor_id: str, input_data: dict) -> dict:
        """
        Run existing Apify Actor and return results
        
        Args:
            actor_id: Apify Actor ID
            input_data: Input parameters for the Actor
            
        Returns:
            Actor run results
        """
        # Run the Actor
        run = self.client.actor(actor_id).call(run_input=input_data)
        
        # Fetch results from dataset
        dataset_items = self.client.dataset(run['defaultDatasetId']).list_items().items
        
        return {
            'success': True,
            'run_id': run['id'],
            'count': len(dataset_items),
            'data': dataset_items
        }

# Create agent instance
scraper_agent = ApifyScraperAgent()
```

### Requirements File

```txt
google-cloud-aiplatform[agent_engines]
apify-client>=1.7.0
playwright>=1.40.0
```

## Configuration Options

### Environment Variables

```python
config = {
    "env_vars": {
        "APIFY_TOKEN": {"secret": "apify-token-secret", "version": "latest"},
        "PROXY_URL": "http://proxy.example.com:8080"
    }
}
```

### Resource Controls

```python
config = {
    "min_instances": 1,        # Keep 1 instance always running
    "max_instances": 100,      # Scale up to 100 instances
    "resource_limits": {
        "cpu": "4",            # 4 CPU cores
        "memory": "8Gi"        # 8GB RAM
    },
    "container_concurrency": 9  # Requests per container
}
```

### Service Account

```python
config = {
    "service_account": "scraper-sa@my-project.iam.gserviceaccount.com"
}
```

### Proxy Configuration (Private Service Connect)

```python
config = {
    "psc_interface_config": {
        "network_attachment": "projects/my-project/regions/us-central1/networkAttachments/my-attachment",
        "dns_peering_configs": [
            {
                "domain": "internal.example.com",
                "target_project": "my-project",
                "target_network": "my-vpc"
            }
        ]
    }
}
```

## Using the Deployed Agent

### Invoke via API

```python
# Get agent resource name
resource_name = remote_agent.api_resource.name
# "projects/123/locations/us-central1/reasoningEngines/456"

# Call the agent
result = remote_agent.api_client.scrape(
    url="https://example.com/products",
    max_items=50
)

print(f"Scraped {result['count']} items")
```

### Invoke via REST API

```bash
curl -X POST \
  https://us-central1-aiplatform.googleapis.com/v1/projects/PROJECT_ID/locations/us-central1/reasoningEngines/RESOURCE_ID:query \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "url": "https://example.com/products",
      "max_items": 50
    }
  }'
```

## Integration Patterns

### Pattern 1: Scheduled Scraping

```python
from google.cloud import scheduler_v1

# Create Cloud Scheduler job
client = scheduler_v1.CloudSchedulerClient()

job = {
    "name": f"projects/{project_id}/locations/{location}/jobs/daily-scrape",
    "schedule": "0 2 * * *",  # Daily at 2 AM
    "time_zone": "America/New_York",
    "http_target": {
        "uri": f"https://us-central1-aiplatform.googleapis.com/v1/{resource_name}:query",
        "http_method": "POST",
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps({
            "input": {
                "url": "https://example.com/products",
                "max_items": 100
            }
        }).encode(),
        "oauth_token": {
            "service_account_email": "scheduler-sa@project.iam.gserviceaccount.com"
        }
    }
}

client.create_job(parent=f"projects/{project_id}/locations/{location}", job=job)
```

### Pattern 2: Event-Driven Scraping

```python
from google.cloud import functions_v1

# Cloud Function triggered by Pub/Sub
def scrape_on_event(event, context):
    """Triggered by Pub/Sub message"""
    import base64
    import json
    
    # Decode message
    message = base64.b64decode(event['data']).decode('utf-8')
    data = json.loads(message)
    
    # Call agent
    result = remote_agent.api_client.scrape(
        url=data['url'],
        max_items=data.get('max_items', 100)
    )
    
    # Store results in BigQuery
    from google.cloud import bigquery
    client = bigquery.Client()
    
    table_id = "project.dataset.scraped_data"
    errors = client.insert_rows_json(table_id, result['data'])
    
    return {'status': 'success', 'count': result['count']}
```

### Pattern 3: API Gateway Integration

```python
# Expose agent via API Gateway
from google.cloud import api_gateway_v1

gateway_config = {
    "openapi": "3.0.0",
    "info": {
        "title": "Scraper API",
        "version": "1.0.0"
    },
    "paths": {
        "/scrape": {
            "post": {
                "operationId": "scrape",
                "x-google-backend": {
                    "address": f"https://us-central1-aiplatform.googleapis.com/v1/{resource_name}:query",
                    "protocol": "h2"
                },
                "parameters": [
                    {
                        "name": "url",
                        "in": "query",
                        "required": True,
                        "schema": {"type": "string"}
                    }
                ]
            }
        }
    }
}
```

## Monitoring & Logging

### View Logs

```python
from google.cloud import logging

client = logging.Client()
logger = client.logger('agent-engine')

# Query logs
for entry in logger.list_entries(filter_=f'resource.labels.reasoning_engine_id="{resource_id}"'):
    print(f"{entry.timestamp}: {entry.payload}")
```

### Monitor Performance

```python
from google.cloud import monitoring_v3

client = monitoring_v3.MetricServiceClient()

# Query metrics
interval = monitoring_v3.TimeInterval({
    "end_time": {"seconds": int(time.time())},
    "start_time": {"seconds": int(time.time() - 3600)}
})

results = client.list_time_series(
    request={
        "name": f"projects/{project_id}",
        "filter": f'resource.type="aiplatform.googleapis.com/ReasoningEngine"',
        "interval": interval
    }
)
```

## Best Practices

### 1. Use Secrets for Credentials

```python
# Store Apify token in Secret Manager
from google.cloud import secretmanager

client = secretmanager.SecretManagerServiceClient()
secret_name = f"projects/{project_id}/secrets/apify-token/versions/latest"

# Reference in deployment
config = {
    "env_vars": {
        "APIFY_TOKEN": {"secret": "apify-token", "version": "latest"}
    }
}
```

### 2. Implement Retry Logic

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def scrape_with_retry(url):
    return scraper_agent.scrape(url)
```

### 3. Rate Limiting

```python
import time
from functools import wraps

def rate_limit(calls_per_second=1):
    min_interval = 1.0 / calls_per_second
    last_called = [0.0]
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            elapsed = time.time() - last_called[0]
            left_to_wait = min_interval - elapsed
            if left_to_wait > 0:
                time.sleep(left_to_wait)
            ret = func(*args, **kwargs)
            last_called[0] = time.time()
            return ret
        return wrapper
    return decorator

@rate_limit(calls_per_second=2)
def scrape_url(url):
    return scraper_agent.scrape(url)
```

### 4. Error Handling

```python
def scrape_with_error_handling(url: str) -> dict:
    try:
        result = scraper_agent.scrape(url)
        return result
    except Exception as e:
        # Log error
        logger.error(f"Scraping failed for {url}: {str(e)}")
        
        # Return error response
        return {
            'success': False,
            'error': str(e),
            'url': url
        }
```

## Cost Optimization

### 1. Adjust Instance Counts

```python
# For low-traffic: minimize idle instances
config = {"min_instances": 0, "max_instances": 5}

# For high-traffic: keep warm instances
config = {"min_instances": 2, "max_instances": 50}
```

### 2. Use Appropriate Resources

```python
# Light scraping
config = {"resource_limits": {"cpu": "1", "memory": "2Gi"}}

# Heavy scraping with browser automation
config = {"resource_limits": {"cpu": "4", "memory": "8Gi"}}
```

### 3. Batch Processing

```python
def scrape_batch(urls: list[str]) -> list[dict]:
    """Process multiple URLs in single invocation"""
    results = []
    for url in urls:
        result = scraper_agent.scrape(url)
        results.append(result)
    return results
```

## Troubleshooting

### Deployment Fails

```bash
# Check build logs
gcloud logging read "resource.type=cloud_build" --limit 50

# Verify requirements
pip install -r requirements.txt --dry-run
```

### Agent Not Responding

```bash
# Check agent status
gcloud ai reasoning-engines describe RESOURCE_ID --location=us-central1

# View recent logs
gcloud logging read "resource.type=aiplatform.googleapis.com/ReasoningEngine" --limit 20
```

### Memory Issues

```python
# Increase memory allocation
config = {"resource_limits": {"cpu": "4", "memory": "16Gi"}}

# Or optimize scraping code
# - Process in batches
# - Close browser instances
# - Clear caches
```

## Additional Resources

- For scraping implementation, see [apify-web-scraping](../apify-web-scraping/SKILL.md)
- Vertex AI Agent Engine Docs: https://cloud.google.com/agent-builder/agent-engine/docs
- Apify Platform Docs: https://docs.apify.com
