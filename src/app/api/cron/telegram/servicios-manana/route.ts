import { handleCronTelegram } from "../_shared";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  return handleCronTelegram(request, "servicios-manana");
}

export async function POST(request: Request) {
  return handleCronTelegram(request, "servicios-manana");
}
