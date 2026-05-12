"use client";

import { PartnerPositionCreatePage } from "./PartnerPositionCreatePage";

export function PartnerPositionEditPage({ positionId, embedded = false }: { positionId: string; embedded?: boolean }) {
  return <PartnerPositionCreatePage mode="edit" positionId={positionId} embedded={embedded} />;
}
