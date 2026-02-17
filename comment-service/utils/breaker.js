const CircuitBreaker = require('opossum');

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

const options = {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 10000
};

const breaker = new CircuitBreaker(sendNotification, options);

breaker.fallback(() => {
    console.warn('⚠️ Circuit Breaker: Notification Service is unreachable. Comment notification skipped.');
    return { status: 'skipped', reason: 'service down' };
});

module.exports = breaker;
