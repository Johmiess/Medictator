// Scroll animations handler
document.addEventListener('DOMContentLoaded', function() {
    // Add reveal classes to elements that should animate on scroll
    const featuresSection = document.querySelector('.features');
    const howItWorksSection = document.querySelector('.how-it-works');
    const aboutSection = document.querySelector('.testimonials');
    
    // Add reveal classes to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.classList.add('reveal');
        
        // Alternate between left and right animations
        if (index % 2 === 0) {
            card.classList.add('fade-left');
        } else {
            card.classList.add('fade-right');
        }
    });
    
    // Add reveal classes to steps
    const steps = document.querySelectorAll('.step');
    steps.forEach(step => {
        step.classList.add('reveal', 'fade-bottom');
    });
    
    // Add reveal to section titles
    const sectionTitles = document.querySelectorAll('.section-title');
    sectionTitles.forEach(title => {
        title.classList.add('reveal', 'fade-bottom');
    });
    
    // Add reveal to about text
    const aboutText = document.querySelector('.about-text');
    if (aboutText) {
        aboutText.classList.add('reveal', 'fade-bottom');
    }
    
    // Function to check if element is in viewport
    function checkIfInView() {
        const reveals = document.querySelectorAll('.reveal');
        const windowHeight = window.innerHeight;
        const elementVisible = 150;
        
        reveals.forEach(reveal => {
            const elementTop = reveal.getBoundingClientRect().top;
            
            if (elementTop < windowHeight - elementVisible) {
                reveal.classList.add('active');
            } else {
                reveal.classList.remove('active');
            }
        });
    }
    
    // Add scroll event listener
    window.addEventListener('scroll', checkIfInView);
    
    // Trigger once on load
    checkIfInView();
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80, // Adjust for header height
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Mobile navigation toggle
    const navLinks = document.querySelector('.nav-links');
    const createMobileMenu = () => {
        if (window.innerWidth <= 768 && !document.querySelector('.mobile-menu-toggle')) {
            // Create mobile menu toggle button
            const mobileToggle = document.createElement('button');
            mobileToggle.classList.add('mobile-menu-toggle');
            mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
            
            // Insert before the CTA button
            const ctaButton = document.querySelector('nav .cta-button');
            ctaButton.parentNode.insertBefore(mobileToggle, ctaButton);
            
            // Toggle nav links on click
            mobileToggle.addEventListener('click', () => {
                navLinks.classList.toggle('show');
                
                // Change icon based on state
                if (navLinks.classList.contains('show')) {
                    mobileToggle.innerHTML = '<i class="fas fa-times"></i>';
                } else {
                    mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
                }
            });
            
            // Add mobile navigation styles
            const style = document.createElement('style');
            style.textContent = `
                .mobile-menu-toggle {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #333;
                    display: none;
                }
                
                @media (max-width: 768px) {
                    .mobile-menu-toggle {
                        display: block;
                    }
                    
                    .nav-links {
                        position: absolute;
                        top: 70px;
                        left: 0;
                        right: 0;
                        background: white;
                        flex-direction: column;
                        padding: 1rem 2rem;
                        gap: 1rem;
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                        display: none;
                    }
                    
                    .nav-links.show {
                        display: flex;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    };
    
    // Initialize mobile menu if needed
    createMobileMenu();
    
    // Update on resize
    window.addEventListener('resize', createMobileMenu);
});

// Parallax effect for hero image
window.addEventListener('scroll', function() {
    const scrollPosition = window.pageYOffset;
    const heroImage = document.querySelector('.hero-image');
    if (heroImage) {
        heroImage.style.transform = `translateY(${scrollPosition * 0.04}px)`;
    }
}); 