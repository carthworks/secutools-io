import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { url, origin } = await req.json();

        if (!url || !/^https?:\/\//i.test(url)) {
            return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
        }

        const vulnerabilities: string[] = [];
        const recommendations: string[] = [];
        let securityScore = 100;

        // Test preflight OPTIONS request
        let preflightStatus = 0;
        let allowOrigin: string | undefined;
        let allowCredentials: string | undefined;
        let allowMethods: string | undefined;
        let allowHeaders: string | undefined;
        let exposeHeaders: string | undefined;
        let maxAge: string | undefined;

        try {
            const preflightRes = await fetch(url, {
                method: "OPTIONS",
                headers: {
                    "Origin": origin,
                    "Access-Control-Request-Method": "POST",
                    "Access-Control-Request-Headers": "Content-Type",
                },
            });

            preflightStatus = preflightRes.status;
            allowOrigin = preflightRes.headers.get("Access-Control-Allow-Origin") || undefined;
            allowCredentials = preflightRes.headers.get("Access-Control-Allow-Credentials") || undefined;
            allowMethods = preflightRes.headers.get("Access-Control-Allow-Methods") || undefined;
            allowHeaders = preflightRes.headers.get("Access-Control-Allow-Headers") || undefined;
            exposeHeaders = preflightRes.headers.get("Access-Control-Expose-Headers") || undefined;
            maxAge = preflightRes.headers.get("Access-Control-Max-Age") || undefined;
        } catch (error) {
            // Preflight failed - might be CORS blocking or network error
            vulnerabilities.push("Preflight request failed - CORS may be blocking cross-origin requests");
            securityScore -= 20;
        }

        // Security Analysis
        if (allowOrigin === "*") {
            if (allowCredentials === "true") {
                vulnerabilities.push("CRITICAL: Wildcard origin (*) with credentials enabled - allows any site to access authenticated resources");
                securityScore -= 30;
            } else {
                vulnerabilities.push("Wildcard origin (*) allows any domain to access resources - consider restricting to specific origins");
                securityScore -= 15;
            }
            recommendations.push("Replace wildcard (*) with specific trusted origins");
        }

        if (!allowOrigin) {
            recommendations.push("No Access-Control-Allow-Origin header found - CORS is not configured");
            securityScore -= 10;
        }

        if (allowCredentials === "true") {
            if (allowOrigin !== origin && allowOrigin !== "*") {
                recommendations.push("Credentials are allowed - ensure origin validation is strict");
            }
        } else {
            recommendations.push("Consider if credentials should be allowed for this endpoint");
        }

        if (allowMethods && allowMethods.includes("*")) {
            vulnerabilities.push("Wildcard methods (*) allow all HTTP methods - restrict to necessary methods only");
            securityScore -= 10;
        }

        if (allowMethods && (allowMethods.includes("DELETE") || allowMethods.includes("PUT"))) {
            recommendations.push("Destructive methods (DELETE/PUT) are allowed - ensure proper authentication");
        }

        if (allowHeaders && allowHeaders.includes("*")) {
            vulnerabilities.push("Wildcard headers (*) allow any header - restrict to necessary headers");
            securityScore -= 10;
        }

        if (!maxAge) {
            recommendations.push("Consider setting Access-Control-Max-Age to cache preflight responses");
        } else {
            const maxAgeSeconds = parseInt(maxAge);
            if (maxAgeSeconds > 86400) {
                recommendations.push("Max-Age is very high - consider reducing for better security");
            }
        }

        // Additional security checks
        if (allowOrigin && allowOrigin.includes("null")) {
            vulnerabilities.push("CRITICAL: Origin 'null' is allowed - this is a security risk");
            securityScore -= 25;
        }

        if (allowOrigin && allowOrigin.match(/^https?:\/\/[^/]+$/)) {
            // Check if it's a specific origin (good)
            recommendations.push("Specific origin is configured - good practice");
        }

        // Ensure score doesn't go below 0
        securityScore = Math.max(0, securityScore);

        return NextResponse.json({
            url,
            origin,
            allowOrigin,
            allowCredentials,
            allowMethods,
            allowHeaders,
            exposeHeaders,
            maxAge,
            preflightStatus,
            vulnerabilities,
            recommendations,
            securityScore,
        });
    } catch (err: any) {
        return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
    }
}
