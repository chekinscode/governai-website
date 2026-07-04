document.addEventListener('DOMContentLoaded', () => {
    // Billing Toggle
    const toggle = document.getElementById('billing-toggle');
    const pricePro = document.getElementById('price-pro');
    const priceOriginal = document.getElementById('price-original');
    let isAnnual = false;

    if (toggle) {
        toggle.addEventListener('click', () => {
            isAnnual = !isAnnual;
            
            if (isAnnual) {
                toggle.setAttribute('aria-checked', 'true');
                toggle.querySelector('.switch-knob').style.transform = 'translateX(2rem)';
                pricePro.textContent = '20';
                priceOriginal.classList.remove('hidden');
            } else {
                toggle.setAttribute('aria-checked', 'false');
                toggle.querySelector('.switch-knob').style.transform = 'translateX(0)';
                pricePro.textContent = '25';
                priceOriginal.classList.add('hidden');
            }
        });

        // Keyboard accessibility for toggle
        toggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle.click();
            }
        });
    }

    // Comparison Table is now a static table, no JS needed.
    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        item.addEventListener('click', () => {
            const answer = item.querySelector('.faq-a');
            const icon = item.querySelector('.material-symbols-outlined');
            
            // Close all others
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.querySelector('.faq-a').classList.add('hidden');
                    otherItem.querySelector('.faq-a').style.display = 'none';
                    otherItem.querySelector('.material-symbols-outlined').style.transform = 'rotate(0deg)';
                }
            });

            if (answer.classList.contains('hidden') || answer.style.display === 'none' || answer.style.display === '') {
                answer.classList.remove('hidden');
                answer.style.display = 'block';
                icon.style.transform = 'rotate(180deg)';
            } else {
                answer.classList.add('hidden');
                answer.style.display = 'none';
                icon.style.transform = 'rotate(0deg)';
            }
        });
    });

    // Initialize FinOps ROI Calculator
    const spendSlider = document.getElementById('roi-spend-slider');
    if (spendSlider) {
        spendSlider.addEventListener('input', window.calculateFinOpsROI);
        spendSlider.addEventListener('change', window.calculateFinOpsROI);
        // Add a slight delay for initial calc to ensure DOM is fully ready
        setTimeout(window.calculateFinOpsROI, 100);
    }
});

// Strategic FinOps ROI Calculator (Global Scope)
window.calculateFinOpsROI = function() {
    const slider = document.getElementById('roi-spend-slider');
    const label = document.getElementById('roi-spend-label');
    const caching = document.getElementById('roi-caching');
    const routing = document.getElementById('roi-routing');
    const total = document.getElementById('roi-total');

    if (!slider) return;

    const spend = parseInt(slider.value, 10) || 0;

    if (label) label.textContent = `$${spend.toLocaleString()}`;

    const cachingSavings = Math.floor(spend * 0.25);
    const routingSavings = Math.floor(spend * 0.15);
    const totalSavings = cachingSavings + routingSavings;

    if (caching) caching.textContent = `$${cachingSavings.toLocaleString()}`;
    if (routing) routing.textContent = `$${routingSavings.toLocaleString()}`;
    if (total) total.textContent = `$${totalSavings.toLocaleString()}`;
};
