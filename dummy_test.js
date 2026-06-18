// Dummy load test scenario
function simulateRequests(endpoint, count = 50) {
  console.log(`Simulating ${count} requests to ${endpoint}`);
  for (let i = 1; i <= count; i++) {
    console.log(`Request ${i}: GET ${endpoint}`);
  }
  console.log("Simulation complete.");
}

simulateRequests("https://api.example.com/users", 10);

module.exports = { simulateRequests };
