import { NextRequest, NextResponse } from "next/server";
import {
  getOverrides,
  upsertOverride,
  deleteOverride,
} from "@/lib/db/sqlite";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get("page");
  const contextDate = searchParams.get("context_date");

  if (!page || !contextDate) {
    return NextResponse.json(
      { error: "page and context_date are required" },
      { status: 400 }
    );
  }

  try {
    const overrides = getOverrides(page, contextDate);
    return NextResponse.json({ overrides });
  } catch (error) {
    console.error("Overrides GET error:", error);
    return NextResponse.json({ error: "Failed to fetch overrides" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page, context_date, cell_key, value } = body;

    if (!page || !context_date || !cell_key || value === undefined || value === null) {
      return NextResponse.json(
        { error: "page, context_date, cell_key, and value are required" },
        { status: 400 }
      );
    }

    const numValue = Number(value);
    if (!isFinite(numValue) || numValue < 0) {
      return NextResponse.json(
        { error: "value must be a finite number >= 0" },
        { status: 400 }
      );
    }

    upsertOverride(page, context_date, cell_key, numValue);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Overrides POST error:", error);
    return NextResponse.json({ error: "Failed to save override" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { page, context_date, cell_key } = body;

    if (!page || !context_date || !cell_key) {
      return NextResponse.json(
        { error: "page, context_date, and cell_key are required" },
        { status: 400 }
      );
    }

    deleteOverride(page, context_date, cell_key);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Overrides DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete override" }, { status: 500 });
  }
}
