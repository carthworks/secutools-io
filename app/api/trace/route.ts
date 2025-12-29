import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();
        if (!url || !/^https?:\/\//i.test(url)) {
            return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
        }

        const hops: { url: string; status: number; location?: string; timestamp?: number }[] = [];
        let current = url;
        let maxRedirects = 15;

        while (maxRedirects-- > 0) {
            const timestamp = Date.now();
            try {
                const res = await fetch(current, {
                    method: "HEAD", // Use HEAD to avoid downloading full content
                    redirect: "manual",
                    headers: {
                        'User-Agent': 'SecuTools-URLTracer/1.0'
                    }
                });
                const status = res.status;
                const location = res.headers.get("location") || undefined;
                hops.push({ url: current, status, location, timestamp });

                if (!location || !(status >= 300 && status < 400)) break;

                // Resolve relative redirects
                try {
                    current = new URL(location, current).href;
                } catch {
                    break;
                }
            } catch (error) {
                // If HEAD fails, try GET
                try {
                    const res = await fetch(current, {
                        method: "GET",
                        redirect: "manual",
                        headers: {
                            'User-Agent': 'SecuTools-URLTracer/1.0'
                        }
                    });
                    const status = res.status;
                    const location = res.headers.get("location") || undefined;
                    hops.push({ url: current, status, location, timestamp });

                    if (!location || !(status >= 300 && status < 400)) break;

                    try {
                        current = new URL(location, current).href;
                    } catch {
                        break;
                    }
                } catch {
                    hops.push({ url: current, status: 0, location: undefined, timestamp });
                    break;
                }
            }
        }

        return NextResponse.json({ hops });
    } catch (err: any) {
        return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
    }
}
