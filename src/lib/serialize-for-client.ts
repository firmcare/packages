import { Prisma } from "../../generated/prisma/client";

export type SerializedForClient<T> =
  T extends Prisma.Decimal ? number
    : T extends Date ? string
    : T extends Array<infer U> ? SerializedForClient<U>[]
    : T extends object ? { [K in keyof T]: SerializedForClient<T[K]> }
    : T;

export function serializeForClient<T>(value: T): SerializedForClient<T> {
  if (value instanceof Prisma.Decimal) {
    return value.toNumber() as SerializedForClient<T>;
  }

  if (value instanceof Date) {
    return value.toISOString() as SerializedForClient<T>;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeForClient(item)) as SerializedForClient<T>;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, serializeForClient(entry)])
    ) as SerializedForClient<T>;
  }

  return value as SerializedForClient<T>;
}