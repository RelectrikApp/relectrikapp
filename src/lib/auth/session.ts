import { getServerSession } from "next-auth";
import { authOptions } from "./index";

export async function auth() {
  return getServerSession(authOptions);
}
