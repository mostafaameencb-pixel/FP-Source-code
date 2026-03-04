
export const PageLoader = {
    // HTML برمجياً
    init: function() {
        if ($('#globalLoader').length === 0) {
            const loaderHtml = `
                <div id="globalLoader" class="global-shimmer-overlay">
                    <div class="loader-content">
                        <div class="loader-brand-dot"></div>
                        <p class="mt-3 fw-bold text-dark" style="letter-spacing: 2px; font-size: 0.9rem;">جاري مزامنة البيانات...</p>
                    </div>
                </div>`;
            $('body').append(loaderHtml);
        }
    },

    // 2. إظهار اللودر
    show: function() {
        this.init();
        $('body').addClass('no-scroll');
        $('#globalLoader').stop().fadeIn(300);
    },

    // 3. إخفاء اللودر
    hide: function() {
        $('#globalLoader').stop().fadeOut(500, function() {
            $('body').removeClass('no-scroll');
        });
    }
};

window.PageLoader = PageLoader;