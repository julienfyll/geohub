import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url || (!url.startsWith("https://upload.wikimedia.org/") && !url.startsWith("https://thumb.wikimedia.org/"))) {
    return new NextResponse("Invalid or unauthorized image URL", { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "GeoHubApp/1.0 (https://github.com/geohub; educational gaming)",
      },
    });

    if (!res.ok) {
      return new NextResponse("Upstream error", { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const data = await res.arrayBuffer();

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch (error) {
    return new NextResponse("Failed to proxy image", { status: 500 });
  }
}
