# AWS Lambda Functions

This project uses two Lambda functions in the cloud pipeline.

## 1. HybridMeshTelemetryProcessor

**Trigger:** AWS IoT Core Rule subscribed to `hybridmesh/telemetry`.

**Purpose:** Receives telemetry published by the Raspberry Pi gateway and stores it in the DynamoDB table `HybridSmartMeterTelemetry`.

**Input fields:** `timestamp`, `source`, `meter_id`, `sequence`, `hops`, `voltage`, `current`, `power`, `frequency`, and `energy`.

**Processing flow:**
1. Receive the JSON event from the IoT Rule.
2. Validate/map the telemetry fields.
3. Convert decimal measurements to DynamoDB-compatible numeric values. With Python boto3's DynamoDB resource API, use `Decimal` rather than `float`.
4. Write the telemetry item to `HybridSmartMeterTelemetry`.
5. Log errors to CloudWatch Logs.

**IAM:** The execution role needs only the DynamoDB write permissions used by the function, scoped to the telemetry table.

## 2. HybridMeshDashboardAPI

**Trigger:** API Gateway `GET /telemetry` route, deployed under the `prod` stage.

**Purpose:** Reads the latest meter records from DynamoDB and returns a JSON response for the website.

**Response shape:**

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

**IAM:** The execution role needs only the DynamoDB read permissions used by the function, scoped to the telemetry table. If the implementation uses `Scan`, consider the cost/performance implications before changing it; any query optimization must match the actual table key schema.

## Debugging the Lambda pipeline

1. Confirm the Raspberry Pi publishes messages to `hybridmesh/telemetry`.
2. In AWS IoT Core, test the MQTT topic and verify the IoT Rule is enabled and invokes the processor Lambda.
3. Check the processor Lambda's CloudWatch Logs for invocation/errors.
4. Verify new or updated items in `HybridSmartMeterTelemetry`.
5. Test `HybridMeshDashboardAPI` directly, then check API Gateway `GET /prod/telemetry`.

## Source-code note

This directory documents the two deployed Lambda functions and their interfaces. The actual live Lambda source files have not yet been added to the repository. Add the tested source code from AWS after reviewing it for secrets; do not replace it with guessed code.