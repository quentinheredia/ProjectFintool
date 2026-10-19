import { occupationComparisonQuerySchema } from "@/lib/industry/comparison-query";
import { getOccupationComparison } from "@/lib/industry/service";

export async function GET(request: Request): Promise<Response> {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const query = occupationComparisonQuerySchema.safeParse(params);
  if (!query.success) {
    const fieldErrors = Object.fromEntries(query.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
    return Response.json({ error: "Invalid comparison request", fieldErrors }, { status: 400 });
  }

  const comparison = await getOccupationComparison({ occupationId: query.data.occupation, thenYear: query.data.then });
  if (!comparison) return Response.json({ error: `Unknown occupation: ${query.data.occupation}` }, { status: 404 });
  return Response.json(comparison);
}
