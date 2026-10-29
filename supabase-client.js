(() => {
    const projectUrl = 'https://qtxbmtqzwnvvlhlvbbjy.supabase.co';
    const publishableKey = 'sb_publishable_wir8hBF3cigDVVtYQofBdg_WW8VOfd-';

    window.supabaseReady = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
            try {
                if (!window.supabase || typeof window.supabase.createClient !== 'function') {
                    throw new Error('A biblioteca Supabase não carregou corretamente.');
                }
                window.supabaseClient = window.supabase.createClient(projectUrl, publishableKey);
                resolve(window.supabaseClient);
            } catch (error) {
                reject(error);
            }
        };
        script.onerror = () => reject(new Error('Não foi possível carregar o cliente Supabase.'));
        document.head.appendChild(script);
    });
})();
