"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

export default function CheckerVerifyPage() {
  const params = useParams();
  const checkerParamId = params?.id ?? null;
  const { data: session, status } = useSession();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [lastScanned, setLastScanned] = useState(null); // raw scanned string
  const scannerRef = useRef(null);

  function extractObjectIdFromString(s) {
    if (!s) return null;
    const m = String(s).match(/[a-fA-F0-9]{24}/);
    return m ? m[0] : null;
  }

  async function callVerifyApiWithPayload(scanned) {
    setError(null);
    setResult(null);
    try {
      const trimmed = String(scanned).trim();
      const possibleId = extractObjectIdFromString(trimmed);

      // If we found an ObjectId anywhere, prefer sending ticketId
      const body = possibleId ? { ticketId: possibleId } : { qrData: trimmed };
      console.log("Sending verify body:", body);

      const res = await fetch("/api/verify-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      console.log("verify response:", res.status, data);

      if (!res.ok) {
        setError(data.error || `Server error: ${res.status}`);
        return;
      }

      if (data.ok && data.valid) {
        setResult({ ticket: data.ticket, monastery: data.monastery, checker: data.checker, message: data.message });
        setConfirmation("✅ Ticket verified and marked used");
        setTimeout(() => setConfirmation(null), 2500);
      } else {
        setResult({ ticket: data.ticket, monastery: data.monastery, checker: data.checker, message: data.message, rawReceived: data.rawReceived });
      }
    } catch (err) {
      console.error("verify error:", err);
      setError(err?.message || "Verification failed");
    } finally {
      setScanning(false);
    }
  }

  useEffect(() => {
    if (!scanning) return;
    if (typeof window === "undefined") return;

    const scanner = new Html5QrcodeScanner("qr-reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
    });

    scanner.render(
      (decodedText) => {
        try { scanner.clear(); } catch (e) {}
        setLastScanned(decodedText);
        callVerifyApiWithPayload(decodedText);
      },
      (err) => {
        console.warn("scan error:", err);
      }
    );

    scannerRef.current = scanner;
    return () => { scanner.clear().catch(() => {}); };
  }, [scanning]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 bg-gray-900 text-white">
      <div className="w-full max-w-3xl">
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">🎫 Verify Ticket</h1>
          <div className="text-sm text-gray-300">Checker page: <span className="font-medium">{checkerParamId ?? "—"}</span></div>
        </header>

        <div className="mb-3 text-sm text-gray-300">
          You must be signed in as a <strong>checker</strong>. {status === "loading" ? "Checking session…" : session?.user ? `Signed in as ${session.user.email}` : (<button onClick={() => signIn()} className="underline">Sign in</button>)}
        </div>

        <div className="mb-4 flex gap-3">
          {!scanning ? (
            <>
              <button onClick={() => { setResult(null); setError(null); setLastScanned(null); setScanning(true); }} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">Scan New Ticket</button>
              <button onClick={() => { setResult(null); setError(null); setLastScanned(null); }} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">Clear</button>
            </>
          ) : (
            <button onClick={() => { setScanning(false); try { scannerRef.current?.clear?.(); } catch(e){} }} className="px-4 py-2 bg-red-600 rounded hover:bg-red-700">Stop</button>
          )}
        </div>

        <div id="qr-reader" className="w-full h-72 rounded bg-gray-800 flex items-center justify-center" />

        {lastScanned && (
          <div className="mt-3 text-xs text-gray-400 break-words">
            <strong>Last scanned raw value:</strong> <span className="block mt-1 text-sm text-gray-200">{String(lastScanned)}</span>
          </div>
        )}

        {confirmation && <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow">{confirmation}</div>}

        {error && <div className="mt-4 text-red-400 font-medium">{error}</div>}

        {result && (
          <div className="mt-6 bg-white/5 border border-white/10 rounded p-4 text-sm text-gray-200">
            <h2 className="font-semibold mb-2">Ticket Result</h2>
            <p><strong>Monastery:</strong> {result.monastery?.name ?? "N/A"}</p>
            <p><strong>Name:</strong> {result.ticket?.purchaserName ?? "N/A"}</p>
            <p><strong>Email:</strong> {result.ticket?.purchaserEmail ?? "N/A"}</p>
            <p><strong>Date:</strong> {result.ticket?.visitDate ? new Date(result.ticket.visitDate).toLocaleDateString() : "N/A"}</p>
            <p><strong>Visitors:</strong> {result.ticket?.numVisitors ?? "N/A"}</p>

            <div className="mt-3">
              {result.ticket?.isUsed ? (
                <div className="text-red-400 font-bold">❌ Ticket already used{result.ticket?.verifiedAt ? ` on ${new Date(result.ticket.verifiedAt).toLocaleString()}` : ""}</div>
              ) : (
                <div className="text-green-400 font-bold">✅ Ticket validated and marked used</div>
              )}
            </div>

            <div className="mt-3 text-xs text-gray-400">
              {result.checker ? <div><strong>Verified by:</strong> {result.checker.name} ({result.checker.email})</div> : null}
              <div className="mt-2"><strong>Server message:</strong> {result.message ?? "—"}</div>
              {result.rawReceived && <div className="mt-2"><strong>rawReceived:</strong> <span className="block break-words">{result.rawReceived}</span></div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
