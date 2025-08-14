import { NextRequest } from "next/server";
import { proxyPost } from "../../_utils";

export async function POST(req: NextRequest) {
  return proxyPost("/chat/completions", req);
}
