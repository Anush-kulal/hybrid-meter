# HybridMeshTelemetryProcessor

## Role

This Lambda receives telemetry from the AWS IoT Core Rule for MQTT topic `hybridmesh/telemetry` and stores the reading in DynamoDB table `HybridSmartMeterTelemetry`.

## Expected event

```json
{
  "timestamp": "YYYY-MM-DD HH:MM:SS",
  "source": "NODE01",
  "meter_id": "MTR001",
  "sequence": 1,
  "hops": 0,
  "voltage": 230.5,
  "current": 2.15,
  "power": 495.6,
  "frequency": 50.0,
  "energy": 125.42
}
```

## Responsibilities

- Validate the expected telemetry fields.
- Store the timestamp supplied by the Raspberry Pi gateway.
- Convert decimal measurements to DynamoDB-compatible values. For Python boto3 DynamoDB resource writes, convert floating-point values to `decimal.Decimal`.
- Write to the configured table and log useful errors to CloudWatch Logs without exposing secrets.

## Permissions

Use a least-privilege execution role with only the required write operation(s) on the telemetry table.

## Troubleshooting

- No fresh item: check MQTT topic, IoT Rule status/action, Lambda invocation metrics, and CloudWatch Logs.
- Float/Decimal error: convert numeric floats to `Decimal` before writing.
- Resource not found: verify the table name and AWS Region.
- Access denied: inspect the Lambda execution role and table resource scope.

**Important:** The deployed Python source code has not yet been committed here. This file documents the known behavior, not a replacement implementation.