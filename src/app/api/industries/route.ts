import { listOccupations } from "@/lib/industry/service";

export async function GET(): Promise<Response> {
  return Response.json({ occupations: await listOccupations() });
}
