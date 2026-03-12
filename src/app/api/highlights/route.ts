import { NextRequest, NextResponse } from "next/server";
import {
  getHighlights,
  upsertHighlight,
  deleteHighlight,
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
    const highlights = getHighlights(page, contextDate);
    return NextResponse.json({ highlights });
  } catch (error) {
    console.error("Highlights GET error:", error);
    return NextResponse.json({ error: "Failed to fetch highlights" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page, context_date, cell_key, color } = body;

    if (!page || !context_date || !cell_key || !color) {
      return NextResponse.json(
        { error: "page, context_date, cell_key, and color are required" },
        { status: 400 }
      );
    }

    upsertHighlight(page, context_date, cell_key, color);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Highlights POST error:", error);
    return NextResponse.json({ error: "Failed to save highlight" }, { status: 500 });
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

    deleteHighlight(page, context_date, cell_key);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Highlights DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete highlight" }, { status: 500 });
  }
}
