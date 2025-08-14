import { proxyGet } from "../_utils";

export async function GET() {
  return proxyGet("/status");
}
