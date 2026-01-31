"use server";

export async function verifyRecaptcha(token: string, action: string) {
    const apiKey = process.env.RECAPTCHA_SECRET_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kadirsenumerator';
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    if (!apiKey) {
        console.error('RECAPTCHA_SECRET_KEY (API Key) is not defined');
        return { success: false, error: 'Server configuration error' };
    }

    try {
        // reCAPTCHA Enterprise Assessment API
        const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event: {
                    token: token,
                    siteKey: siteKey,
                    expectedAction: action
                }
            })
        });

        const data = await response.json();
        console.log(`[reCAPTCHA Enterprise] Assessment response for "${action}":`, JSON.stringify(data));

        if (data.error) {
            console.error('[reCAPTCHA Enterprise] API Error:', data.error.message);
            return { success: false, error: `reCAPTCHA API error: ${data.error.message}` };
        }

        // Check if the token is valid
        if (!data.tokenProperties || !data.tokenProperties.valid) {
            const reason = data.tokenProperties?.invalidReason || 'unknown-invalid';
            console.error('[reCAPTCHA Enterprise] Invalid token. Reason:', reason);
            return { success: false, error: `reCAPTCHA invalid: ${reason}` };
        }

        // Verify action matches
        if (data.tokenProperties.action !== action) {
            console.warn(`[reCAPTCHA Enterprise] Action mismatch: expected ${action}, got ${data.tokenProperties.action}`);
            // return { success: false, error: 'reCAPTCHA action mismatch' };
        }

        // Check score (0.0 to 1.0)
        if (data.riskAnalysis && data.riskAnalysis.score < 0.5) {
            console.warn(`[reCAPTCHA Enterprise] Low score: ${data.riskAnalysis.score}`);
            return { success: false, error: 'Suspicious activity detected. Please try again.' };
        }

        return { success: true };
    } catch (error: any) {
        console.error('[reCAPTCHA Enterprise] Exception during assessment:', error);
        return { success: false, error: `Verification network error: ${error.message}` };
    }
}
