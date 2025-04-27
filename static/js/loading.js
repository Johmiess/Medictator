// Loading overlay management
document.addEventListener('DOMContentLoaded', function() {
    // Create loading overlay element
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.style.display = 'none';
    
    // Load content from loading.html template via fetch
    fetch('/loading-content')
        .then(response => response.text())
        .then(html => {
            loadingOverlay.innerHTML = html;
            document.body.appendChild(loadingOverlay);
            
            // Initialize progress bar animation
            initProgressBar();
        })
        .catch(error => console.error('Error loading overlay:', error));
    
    // Add event listeners to all links for page transitions
    document.querySelectorAll('a:not([data-no-loading])').forEach(link => {
        link.addEventListener('click', function(e) {
            if (!this.getAttribute('href').startsWith('#') && 
                !this.getAttribute('href').startsWith('javascript:') &&
                !this.getAttribute('href').startsWith('tel:') &&
                !this.getAttribute('href').startsWith('mailto:')) {
                e.preventDefault();
                showLoading();
                setTimeout(() => {
                    window.location.href = this.getAttribute('href');
                }, 200);
            }
        });
    });
    
    // Add event listeners to all forms for submission
    document.querySelectorAll('form:not([data-no-loading])').forEach(form => {
        form.addEventListener('submit', function(e) {
            const action = this.getAttribute('action');
            if (!action || !action.startsWith('#')) {
                showLoading();
            }
        });
    });

    // Add event listener for dictation button
    const recordButton = document.getElementById('recordButton');
    if (recordButton) {
        recordButton.addEventListener('click', function() {
            // Show loading when recording is finished
            if (this.classList.contains('recording')) {
                // Will apply when recording is stopped
                recordButton.addEventListener('click', function handleStopRecording() {
                    showLoading();
                    recordButton.removeEventListener('click', handleStopRecording);
                }, { once: true });
            }
        });
    }

    // Hide loading overlay when page is fully loaded
    window.addEventListener('load', function() {
        hideLoading();
    });

    // Add event listener for browser back/forward buttons
    window.addEventListener('popstate', function() {
        hideLoading();
    });
});

// Show loading overlay
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'block';
        startProgress();
    }
}

// Hide loading overlay
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        resetProgress();
    }
}

// Initialize progress bar animation
function initProgressBar() {
    const progressBar = document.querySelector('#loading-overlay .progress');
    if (progressBar) {
        progressBar.style.width = '0%';
    }
}

// Start progress animation
function startProgress() {
    const progressBar = document.querySelector('#loading-overlay .progress');
    if (progressBar) {
        progressBar.style.width = '0%';
        
        let width = 0;
        window.progressInterval = setInterval(() => {
            if (width >= 90) { // Cap at 90% until page actually loads
                clearInterval(window.progressInterval);
            } else {
                width += 2.0;
                progressBar.style.width = width + '%';
            }
        }, 5);
    }
}

// Reset progress animation
function resetProgress() {
    if (window.progressInterval) {
        clearInterval(window.progressInterval);
    }
    
    const progressBar = document.querySelector('#loading-overlay .progress');
    if (progressBar) {
        progressBar.style.width = '0%';
    }
}

// Handle API responses for transcription
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    let isTranscriptionEndpoint = false;
    let showLoadingForRequest = false;
    
    // Check if this is a transcription-related endpoint
    if (typeof url === 'string') {
        isTranscriptionEndpoint = url.includes('/upload') || url.includes('/transcribe');
        showLoadingForRequest = !url.includes('/loading-content');
    }
    
    // Show loading for transcription endpoints
    if (isTranscriptionEndpoint) {
        showLoading();
    }
    
    // Make the actual fetch request
    return originalFetch.apply(this, arguments).then(response => {
        // Clone the response to avoid consuming it
        const clonedResponse = response.clone();
        
        // Try to parse the response if it's a transcription endpoint
        if (isTranscriptionEndpoint) {
            clonedResponse.json().then(data => {
                if (data.success) {
                    // Keep loading shown while processing continues
                } else {
                    // Hide loading on error
                    hideLoading();
                }
            }).catch(() => {
                // Hide loading if can't parse JSON
                hideLoading();
            });
        }
        
        return response;
    }).catch(error => {
        // Hide loading on fetch error
        if (isTranscriptionEndpoint) {
            hideLoading();
        }
        throw error;
    });
};

// For explicit control from other scripts
window.loadingManager = {
    show: showLoading,
    hide: hideLoading
}; 