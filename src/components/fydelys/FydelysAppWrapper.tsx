"use client";
/* eslint-disable */
// @ts-nocheck
import App from "./FydelysApp";

type Props = {
  initialRole: string; studioSlug: string; studioName: string; studioId: string
  planName: string; membersCount: number; userName: string; userRole: string
  coachName: string; coachDisciplines: any[]; billingStatus: string
  trialEndsAt: string | null; onSignOut: () => Promise<void>
}

export default function FydelysAppWrapper(props: Props) {
  return <App {...props} />
}
