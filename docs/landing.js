function isBrave() {
    return navigator.brave && navigator.brave.isBrave && navigator.brave.isBrave.name === 'isBrave';
}

function checkServerStatus() {
    const serverRunning = document.getElementById('server-running');
    const serverNotRunning = document.getElementById('server-not-running');

    // If Brave, just show not running state
    if (isBrave()) {
        serverRunning.style.display = 'none';
        serverNotRunning.style.display = 'block';
        // Hide the server status text for Brave
        const statusText = serverNotRunning.querySelector('.server-status');
        if (statusText) statusText.style.display = 'none';
        return;
    }

    // For other browsers, try to fetch
    fetch('http://localhost:4519/hooks')
        .then(response => {
            if (response.ok) {
                serverRunning.style.display = 'block';
                serverNotRunning.style.display = 'none';
            } else {
                throw new Error('Server responded with error');
            }
        })
        .catch(() => {
            serverRunning.style.display = 'none';
            serverNotRunning.style.display = 'block';
            // Show the server status text for non-Brave browsers
            const statusText = serverNotRunning.querySelector('.server-status');
            if (statusText) statusText.style.display = 'block';
        });
}

function copyCommand() {
    const command = 'npx madame-claude';
    const feedback = document.getElementById('copy-feedback');

    navigator.clipboard.writeText(command).then(() => {
        showCopyFeedback();
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = command;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showCopyFeedback();
    });
}

function showCopyFeedback() {
    const feedback = document.getElementById('copy-feedback');
    if (feedback) {
        feedback.style.opacity = '1';
        setTimeout(() => {
            feedback.style.opacity = '0';
        }, 2000);
    }
}

// Check on page load
checkServerStatus();

// Check every 5 seconds (skip for Brave)
if (!isBrave()) {
    setInterval(checkServerStatus, 5000);
}