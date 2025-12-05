// app/Sessionwrapper.jsx
"use client";
import { SessionProvider } from "next-auth/react";

export default function Sessionwrapper({ children, serverSession }) {
  return <SessionProvider session={serverSession}>{children}</SessionProvider>;
}
