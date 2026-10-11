import { adminAuth } from "@/app/lib/firebase-admin";

export async function verifyToken(request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.split("Bearer ")[1];

  const decodedToken = await adminAuth.verifyIdToken(token);

  return decodedToken;
}