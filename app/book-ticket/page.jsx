"use client";

import { useState, useEffect, useRef } from "react";

export default function BookTicketPage() {
  const [monasteries, setMonasteries] = useState([]);
  const [selectedMonastery, setSelectedMonastery] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [numVisitors, setNumVisitors] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pricePerPerson, setPricePerPerson] = useState(200); // example fare
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const totalPrice = numVisitors * pricePerPerson;
  const razorpayScriptLoaded = useRef(false);

  useEffect(() => {
    async function loadMonasteries() {
      try {
        const res = await fetch("/api/monasteries");
        const data = await res.json();
        setMonasteries(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch monasteries:", err);
      }
    }
    loadMonasteries();
  }, []);

  // load Razorpay script once
  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (razorpayScriptLoaded.current || window?.Razorpay) {
        razorpayScriptLoaded.current = true;
        return resolve(true);
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        razorpayScriptLoaded.current = true;
        resolve(true);
      };
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  async function handleBooking(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!selectedMonastery || !name.trim() || !email.trim() || !visitDate) {
      setErrorMsg("Please fill all required fields.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (numVisitors < 1) {
      setErrorMsg("Number of visitors must be at least 1.");
      return;
    }

    setLoading(true);

    try {
      const ok = await loadRazorpay();
      if (!ok) {
        throw new Error("Failed to load Razorpay. Check your internet connection.");
      }

      // create order on backend (backend returns { ok: true, order } or { error: ... })
      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalPrice }), // backend expects amount in INR
      });

      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson) {
        throw new Error(orderJson?.error || "Failed to create order");
      }

      // support dev stub: backend returns { ok: true, order: {...} }
      const orderObj = orderJson.order || orderJson; // fallback if your backend shape differs
      if (!orderObj) throw new Error("Invalid order from server");

      // make sure we have order id and amount
      const orderId = orderObj.id || orderObj.order_id || orderObj.orderId;
      const orderAmountPaise = orderObj.amount || Math.round(totalPrice * 100);

      if (!orderId) {
        throw new Error("Order ID missing from server response");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "", // client key
        amount: orderAmountPaise, // in paise
        currency: "INR",
        name: "Monastery360",
        description: "Monastery Visit Ticket",
        order_id: orderId,
        prefill: {
          name,
          email,
        },
        handler: async function (response) {
          try {
            // backend ticket creation payload
            const paymentData = {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            };

            const ticketRes = await fetch("/api/tickets", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                monastery: selectedMonastery,
                purchaserName: name,
                purchaserEmail: email,
                visitDate,
                numVisitors,
                totalPrice,
                razorpay: paymentData,
              }),
            });

            const ticketJson = await ticketRes.json();
            if (!ticketRes.ok) {
              console.error("Ticket creation failed:", ticketJson);
              alert(ticketJson?.error || "Failed to create ticket.");
            } else {
              alert("✅ Ticket booked successfully! Check your email for PDF ticket.");
              window.location.href = "/";
            }
          } catch (err) {
            console.error("Error in payment handler:", err);
            alert("Payment was successful but finalizing booking failed. Contact support.");
          }
        },
        modal: {
          ondismiss: function () {
            // user closed modal
            console.log("Razorpay modal closed");
          },
        },
        theme: { color: "#2563EB" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Booking error:", err);
      setErrorMsg(err.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Book Monastery Visit</h1>

      {errorMsg && (
        <div className="mb-4 p-3 text-sm bg-red-50 border border-red-200 text-red-700 rounded">
          {errorMsg}
        </div>
      )}

      {/* <form onSubmit={handleBooking} className="space-y-5">
        <div>
          <label className="block text-gray-700 mb-1">Select Monastery</label>
          <select
            className="w-full border p-2 rounded"
            value={selectedMonastery}
            onChange={(e) => setSelectedMonastery(e.target.value)}
            required
          >
            <option value="">-- Choose --</option>
            {monasteries.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Visit Date</label>
          <input
            type="date"
            className="w-full border p-2 rounded"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Number of Visitors</label>
          <input
            type="number"
            min="1"
            className="w-full border p-2 rounded"
            value={numVisitors}
            onChange={(e) => setNumVisitors(Number(e.target.value))}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-1">Your Name</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full border p-2 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="bg-gray-50 border rounded p-3 text-sm">
          <div className="flex justify-between">
            <span>Price per visitor:</span>
            <span>₹{pricePerPerson}</span>
          </div>
          <div className="flex justify-between font-semibold mt-1">
            <span>Total:</span>
            <span>₹{totalPrice}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Processing..." : `Proceed to Pay ₹${totalPrice}`}
        </button>
      </form> */}
      <form onSubmit={handleBooking} className="space-y-5 text-white">

  <div>
    <label className="block text-gray-300 mb-1">Select Monastery</label>
    <select
      className="w-full bg-white border border-gray-700 p-2 rounded text-black
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={selectedMonastery}
      onChange={(e) => setSelectedMonastery(e.target.value)}
      required
    >
      <option value="" className="text-gray-500">-- Choose --</option>
      {monasteries.map((m) => (
        <option key={m._id} value={m._id} className="text-black">
          {m.name}
        </option>
      ))}
    </select>
  </div>

  <div>
    <label className="block text-gray-300 mb-1">Visit Date</label>
    <input
      type="date"
      className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-gray-200
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={visitDate}
      onChange={(e) => setVisitDate(e.target.value)}
      required
    />
  </div>

  <div>
    <label className="block text-gray-300 mb-1">Number of Visitors</label>
    <input
      type="number"
      min="1"
      className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-gray-200
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={numVisitors}
      onChange={(e) => setNumVisitors(Number(e.target.value))}
      required
    />
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div>
      <label className="block text-gray-300 mb-1">Your Name</label>
      <input
        type="text"
        className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-gray-200
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
    </div>

    <div>
      <label className="block text-gray-300 mb-1">Email</label>
      <input
        type="email"
        className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-gray-200
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
    </div>
  </div>

  {/* Price Box */}
  <div className="bg-gray-800 border border-gray-700 rounded p-3 text-sm text-gray-200">
    <div className="flex justify-between">
      <span>Price per visitor:</span>
      <span>₹{pricePerPerson}</span>
    </div>
    <div className="flex justify-between font-semibold mt-1">
      <span>Total:</span>
      <span>₹{totalPrice}</span>
    </div>
  </div>

  {/* Pay Button */}
  <button
    type="submit"
    disabled={loading}
    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 
               disabled:opacity-70 transition"
  >
    {loading ? "Processing..." : `Proceed to Pay ₹${totalPrice}`}
  </button>
</form>

    </div>
  );
}
