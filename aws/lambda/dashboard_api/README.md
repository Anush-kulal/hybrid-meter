# HybridMeshDashboardAPI

## Role

This Lambda reads the latest meter readings from DynamoDB and returns them through API Gateway for the HybridMesh dashboard.

## API contract

- HTTP method: `GET`
- Route: `/telemetry`
- Stage: `prod`
- Response content type: `application/json`

Example response:

```json
{
  "status": "success",
  "meters": [
    {
      "meter_id": "MTR001",
      "source": "NODE01",
      "timestamp": "YYYY-MM-DD HH:MM:SS",
      "sequence": 1,
      "hops": 0,
      "voltage": 230.5,
      "current": 2.15,
      "power": 495.6,
      "frequency": 50.0,
      "energy": 125.42
    }
  ]
}
```

## Responsibilities

- Read the latest records using the deployed DynamoDB table's actual key design.
- Return the readings in the `meters` array.
- Serialize DynamoDB numeric values to JSON-compatible numbers.
- Return clear HTTP status codes and JSON errors.
- Include the CORS headers required by the website. For deployment, restrict allowed origins where practical.

## Permissions

Grant only the DynamoDB read actions used by the code, scoped to the telemetry table. If the function uses `Scan`, it may read the entire table; do not change it to `Query` without confirming the table's key schema and updating the code accordingly.

## Troubleshooting

- Old readings: first verify the telemetry processor is updating DynamoDB.
- Empty response: inspect the table data, key design, and CloudWatch Logs.
- Access denied: verify the function execution role.
- Browser error: test the API URL directly, then inspect CORS and API Gateway configuration.

**Important:** The deployed Lambda source code has not yet been committed here. This file documents the known behavior and API contract, not a replacement implementation.