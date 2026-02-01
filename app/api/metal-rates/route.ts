import { NextResponse } from "next/server";

const TROY_OUNCE_TO_GRAM = 31.1034768;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const basis = (searchParams.get("basis") || "gold").toLowerCase(); // gold | silver
  const currency = (searchParams.get("currency") || "INR").toUpperCase();

  const apiKey = process.env.METALPRICEAPI_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing METALPRICEAPI_KEY env var on server." },
      { status: 400 }
    );
  }

  const metal = basis === "silver" ? "XAG" : "XAU";

  const url = `https://api.metalpriceapi.com/v1/latest?api_key=${encodeURIComponent(
    apiKey
  )}&base=${encodeURIComponent(currency)}&currencies=${metal}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch metal rates", status: res.status },
      { status: 502 }
    );
  }

  const data = await res.json();

  const rate = data?.rates?.[metal];
  const perTroyOz = rate && Number(rate) > 0 ? 1 / Number(rate) : 0;
  const perGram = perTroyOz > 0 ? perTroyOz / TROY_OUNCE_TO_GRAM : 0;

  return NextResponse.json({
    success: true,
    basis,
    metal,
    currency,
    perGram,
    timestamp: data?.timestamp ?? Math.floor(Date.now() / 1000),
    source: "metalpriceapi"
  });
}

