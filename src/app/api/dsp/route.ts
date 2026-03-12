import { NextRequest, NextResponse } from "next/server";
import { format, subDays } from "date-fns";
import {
  getDspEntries,
  upsertDspEntry,
  deleteDspEntry,
  getAllDspEntries,
} from "@/lib/db/sqlite";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dateStr = searchParams.get("date");

  try {
    if (dateStr) {
      const entries = getDspEntries(dateStr);
      return NextResponse.json({ date: dateStr, entries });
    } else {
      const entries = getAllDspEntries();
      return NextResponse.json({ entries });
    }
  } catch (error) {
    console.error("DSP GET error:", error);
    return NextResponse.json({ error: "Failed to fetch DSP entries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand_key, date, spend, sales } = body;

    if (!brand_key || !date) {
      return NextResponse.json(
        { error: "brand_key and date are required" },
        { status: 400 }
      );
    }

    upsertDspEntry(brand_key, date, spend || 0, sales || 0);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DSP POST error:", error);
    return NextResponse.json({ error: "Failed to save DSP entry" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand_key, date } = body;

    if (!brand_key || !date) {
      return NextResponse.json(
        { error: "brand_key and date are required" },
        { status: 400 }
      );
    }

    deleteDspEntry(brand_key, date);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DSP DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete DSP entry" }, { status: 500 });
  }
}
