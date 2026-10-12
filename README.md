# Hybrid Smart Metering System

A final-year engineering project prototype for smart-meter telemetry using an ESP-NOW mesh, a Raspberry Pi data concentrator, local SQLite storage, AWS IoT Core, AWS Lambda, DynamoDB, and an API for the dashboard.

## System overview

The prototype has three ESP32 meter nodes:

- **NODE01 / MTR001** — fixed gateway node connected to the Raspberry Pi over USB.
- **NODE02 / MTR002** — flexible ESP-NOW mesh meter node.
- **NODE03 / MTR003** — flexible ESP-NOW mesh meter node.

Telemetry includes meter ID, source node, voltage, current, power, frequency, energy consumption, sequence number, hop count, and a timestamp assigned at the Raspberry Pi gateway.

## Architecture

```text
NODE02 ─┐
NODE03 ─┼── ESP-NOW mesh ──> NODE01 ── USB serial ──> Raspberry Pi
NODE01 ─┘                                           │
                                                    ├── SQLite (local history)
                                                    │
                                                    └── MQTT/TLS
                                                          │
                                                     AWS IoT Core
                                                          │
                                                        IoT Rule
                                                          │
                                                  Telemetry Lambda
                                                          │
                                                      DynamoDB
                                                          │
                                                Dashboard API Lambda
                                                          │
                                                     API Gateway
                                                          │
                                                    Web dashboard
```

The ESP32 mesh uses ESP-NOW locally. The Raspberry Pi's Wi-Fi/hotspot connection is used for cloud backhaul, not as the transport between ESP32 mesh nodes.

## Repository map

- `raspberry_pi/` — gateway setup and automatic-start documentation.
- `aws/iot/` — MQTT topic and IoT Rule notes.
- `aws/dynamodb/` — storage notes.
- `dashboard/` — API contract notes (not the website source).
- `docs/` — architecture and telemetry-flow documentation.
- `website/` — existing dashboard source; intentionally left unchanged during this update.

The actual ESP32 firmware, Python gateway source, and deployed Lambda source are not currently included in the repository tree. They should be added from the tested working versions, rather than reconstructed or guessed.

## Telemetry flow

1. ESP32 nodes generate telemetry and forward it through the ESP-NOW mesh.
2. NODE01 sends received telemetry to the Raspberry Pi over USB serial at 115200 baud.
3. The Raspberry Pi parses newline-delimited records beginning with `DATA:`, stores readings in SQLite, and publishes telemetry to the `hybridmesh/telemetry` MQTT topic.
4. AWS IoT Core receives the message. An IoT Rule invokes the telemetry-processing Lambda, which writes the reading to DynamoDB.
5. A dashboard API Lambda reads the latest meter records and API Gateway exposes `GET /prod/telemetry`.

The current cloud data design is described as latest readings per meter; SQLite is the local store for telemetry history.

## Timestamp

The Raspberry Pi gateway assigns a timestamp when the telemetry is received/processed and stores that timestamp in SQLite and includes it in the cloud message. Configure the Pi timezone as `Asia/Kolkata` if the project requires Indian Standard Time. Confirm that the gateway's timestamp implementation matches the deployed copy before relying on it.

## Raspberry Pi automatic startup

The gateway can be managed using `systemd`. See [Raspberry Pi setup](raspberry_pi/README.md) for the service template and verification commands. Use the actual Linux username and paths on the Pi; the template uses the project paths from the current deployment context as examples.

## Security

This is a public repository. Never commit:

- AWS IoT private keys, device certificates, root CA bundles, or AWS access keys.
- Wi-Fi passwords, tokens, private SSH keys, or other secrets.
- Local SQLite database files or logs.
- A local `.env` or configuration file containing credentials.

The exact deployed API host and other environment-specific identifiers are omitted from documentation. Use local ignored configuration for deployment-only values.

## Status and limitations

The end-to-end architecture has been tested in the running prototype. Deployment-specific code and resource configuration should be checked into this repository only from the known-working source, with secrets removed. Documentation describes intended wiring and flow; it does not replace testing on the actual hardware and AWS account.
