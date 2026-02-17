const CircuitBreaker = require('opossum');

/**
 * Fonction de notification (l'appel réseau instable)
 */
async function sendNotification(data) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch('http://localhost:3002/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
        throw new Error('Notification Service replied with error');
    }

    return response.json();
}

// Options du Circuit Breaker
const options = {
    timeout: 3000,          // Temps maximum avant de considérer l'appel comme "failed"
    errorThresholdPercentage: 50, // Pourcentage d'erreurs avant d'ouvrir le circuit
    resetTimeout: 10000     // Temps à attendre avant d'essayer de refermer le circuit
};

const breaker = new CircuitBreaker(sendNotification, options);

// Fallback en cas de circuit ouvert ou erreur répétée
breaker.fallback(() => {
    console.warn('⚠️ Circuit Breaker: Notification Service is unreachable. Notification skipped.');
    return { status: 'skipped', reason: 'service down' };
});

// Logs pour le monitoring (Optionnel)
breaker.on('open', () => console.error('🔴 Circuit Breaker: OPEN (Notification Service is down)'));
breaker.on('halfOpen', () => console.log('🟡 Circuit Breaker: HALF_OPEN (Trying to reach Notification Service...)'));
breaker.on('close', () => console.log('🟢 Circuit Breaker: CLOSED (Notification Service is back online)'));

module.exports = breaker;
