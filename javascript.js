// Wait for the HTML elements to load
document.addEventListener('DOMContentLoaded', () => {
    const aiButton = document.getElementById('ai-btn');
    const aiLoading = document.getElementById('ai-loading');
    const aiResults = document.getElementById('ai-results');

    // Simulate clicking the AI Analysis engine button
    aiButton.addEventListener('click', () => {
        // Step 1: Hide previous results if open, and show loading spinner
        aiResults.classList.add('hidden');
        aiLoading.classList.remove('hidden');
        aiButton.disabled = true;
        aiButton.innerText = "Processing...";

        // Step 2: Simulate a brief 1.5 second API delay response time
        setTimeout(() => {
            // Step 3: Hide loading spinner and reveal the data
            aiLoading.classList.add('hidden');
            aiResults.classList.remove('hidden');
            
            // Re-enable button with an updated state
            aiButton.disabled = false;
            aiButton.innerText = "Re-Analyze";
        }, 1500); 
    });
});