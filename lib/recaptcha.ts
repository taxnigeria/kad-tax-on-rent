import { useEffect, useState } from 'react';

declare global {
    interface Window {
        grecaptcha: any;
    }
}

export const useRecaptcha = (siteKey: string) => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Load reCAPTCHA Enterprise script
        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`;
        script.async = true;
        script.defer = true;
        script.onload = () => setIsLoaded(true);
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, [siteKey]);

    const executeRecaptcha = async (action: string): Promise<string> => {
        if (!isLoaded) {
            await new Promise<void>((resolve) => {
                const checkLoaded = () => {
                    if (window.grecaptcha?.enterprise) resolve();
                    else setTimeout(checkLoaded, 100);
                };
                checkLoaded();
            });
        }

        return new Promise((resolve, reject) => {
            window.grecaptcha.enterprise.ready(() => {
                window.grecaptcha.enterprise.execute(siteKey, { action })
                    .then((token: string) => resolve(token))
                    .catch(reject);
            });
        });
    };

    return { isLoaded, executeRecaptcha };
};
