const express = require('express');
const router = express.Router();
const { execSync } = require('child_process');

// Helper: run a shell command and return output as string
function run(cmd) {
    try {
        return execSync(cmd, { encoding: 'utf8' }).trim();
    } catch {
        return 'N/A';
    }
}

// GET /api/system — returns all system stats
router.get('/', (req, res) => {
    // Uptime in seconds, converted to human readable
    const uptimeSeconds = parseInt(run("awk '{print int($1)}' /proc/uptime"));
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const uptime = `${days}d ${hours}h ${minutes}m`;

    // CPU usage: average over 1 second sample
    const cpu = run("top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'") + '%';

    // RAM
    const memInfo = run("free -m").split('\n')[1].split(/\s+/);
    const ramTotal = memInfo[1];
    const ramUsed = memInfo[2];
    const ramFree = memInfo[3];

    // Disk
    const diskInfo = run("df -h / | tail -1").split(/\s+/);
    const diskTotal = diskInfo[1];
    const diskUsed = diskInfo[2];
    const diskFree = diskInfo[3];
    const diskPct = diskInfo[4];

    // CPU temperature
    const tempRaw = run("cat /sys/class/thermal/thermal_zone0/temp");
    const temp = tempRaw !== 'N/A' ? (parseInt(tempRaw) / 1000).toFixed(1) + '°C' : 'N/A';

    // Network: IP and interface
    const ip = run("hostname -I | awk '{print $1}'");
    const hostname = run("hostname");
    const ssid = run("iwgetid -r") || 'N/A';

    // Network traffic on wlan0
    const netRx = run("cat /sys/class/net/wlan0/statistics/rx_bytes");
    const netTx = run("cat /sys/class/net/wlan0/statistics/tx_bytes");

    function formatBytes(b) {
        const bytes = parseInt(b);
        if (bytes > 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
        if (bytes > 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return bytes + ' B';
    }

    res.json({
        uptime,
        cpu,
        ram: { total: ramTotal + ' MB', used: ramUsed + ' MB', free: ramFree + ' MB' },
        disk: { total: diskTotal, used: diskUsed, free: diskFree, percent: diskPct },
        temp,
        network: {
            ip,
            hostname,
            ssid,
            rx: formatBytes(netRx),
            tx: formatBytes(netTx)
        }
    });
});

// POST /api/system/restart — restarts the Pi
router.post('/restart', (req, res) => {
    res.json({ success: true });
    setTimeout(() => run('sudo reboot'), 500);
});

// POST /api/system/shutdown — shuts down the Pi
router.post('/shutdown', (req, res) => {
    res.json({ success: true });
    setTimeout(() => run('sudo shutdown now'), 500);
});

module.exports = router;