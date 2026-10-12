# Raspberry Pi daemon service (`systemd`)

The HybridMesh gateway runs as a Linux `systemd` service so it can start at boot and restart after an unexpected process exit.

## Service file

The example is in [`hybridmesh.service`](hybridmesh.service). It matches the current deployment username `hybridmesh` and paths. Adjust them if your Pi uses different locations. It calls the virtual environment's Python directly; you do not need to activate the environment interactively.

The `-u` option makes Python output unbuffered so `print()` messages appear promptly in the systemd journal.

## Install or update

From a local clone of this repository:

```bash
sudo cp raspberry_pi/systemd/hybridmesh.service /etc/systemd/system/hybridmesh.service
sudo systemctl daemon-reload
sudo systemctl enable hybridmesh.service
sudo systemctl restart hybridmesh.service
```

## Check service and logs

```bash
sudo systemctl status hybridmesh.service
sudo journalctl -u hybridmesh.service -f
sudo journalctl -u hybridmesh.service -n 100 --no-pager -o cat
```

To verify automatic startup, reboot the Pi, wait for it to boot, then check the service status and confirm fresh telemetry reaches DynamoDB.

## Network/startup notes

`network-online.target` does not guarantee a phone hotspot is connected or AWS IoT Core is reachable. For the demo, turn on the hotspot before powering the Pi and inspect the journal after reboot. If the gateway cannot reconnect after a temporary network failure, the Python gateway may need explicit retry/reconnect logic; a service restart alone does not guarantee cloud reconnection.

## Security

Do not put certificates, private keys, Wi-Fi passwords, or AWS credentials in the service file. Keep certificates outside the repository and restrict their file permissions.