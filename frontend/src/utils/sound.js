let audioCtx = null;
let audioUnlocked = false;

// Call this on any first click/interaction on the page to unlock policies
export const unlockAudioAndNotifications = async () => {
    if (!audioUnlocked) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            gainNode.gain.value = 0; // completely silent interaction
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.01);
            if (audioCtx.state === 'suspended') {
                await audioCtx.resume();
            }
            audioUnlocked = true;
            console.log("AudioContext and sound capabilities unlocked successfully.");
        } catch (err) {
            console.error("Failed to unlock audio:", err);
        }
    }

    if ("Notification" in window && Notification.permission === "default") {
        try {
            await Notification.requestPermission();
        } catch (e) {
            console.error("Error requesting notification permissions:", e);
        }
    }
};

export const playOrderSound = () => {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (error) {
        console.error('Audio API error. Ensure user has interacted with document:', error);
    }
};

export const notifyNewOrder = (title = '¡Nuevo Pedido!', body = 'Tienes un nuevo pedido pendiente.') => {
    if (!("Notification" in window)) {
        console.log("Este navegador no soporta notificaciones de escritorio");
        return;
    }

    if (Notification.permission === "granted") {
        new Notification(title, { body, icon: '/logos/logo-bg.png' });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(title, { body, icon: '/logos/logo-bg.png' });
            }
        });
    }
};
