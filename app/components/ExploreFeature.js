import React from 'react'
import Link from 'next/link'

export default function Explorefeature() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Title */}
      <h1 className="text-white text-3xl font-bold text-center mb-6">
        Explore our Feature
      </h1>

      {/* FLEX ONLY — scroll on mobile, wrap on large screens */}
      <div
        className="
          container mx-auto
          flex gap-6 overflow-x-auto pb-4
          flex-nowrap
          md:flex-wrap md:justify-center md:overflow-visible
        "
      >

        {/* Virtual Tour */}
        <Link href="/viewer">
          <div className="min-w-[230px] h-[250px] bg-black text-white border rounded-xl
              flex flex-col items-center justify-center gap-2 text-center shrink-0">
            
            <img className="h-20 w-20 rounded-full" src="/vrtour.gif" alt="Virtual Tour" />
            
            <h3 className="text-[15px] font-bold">Virtual Tour</h3>
            
            <p className="text-[11px] px-2">
              Experience immersive 360° virtual monastery tours with guided narration.
            </p>
          
          </div>
        </Link>

        {/* Interactive Map */}
        <Link href="/map">
          <div className="min-w-[230px] h-[250px] bg-black text-white border rounded-xl
              flex flex-col items-center justify-center gap-2 text-center shrink-0">

            <img className="h-20 w-20 rounded-full" src="/irmap.gif" alt="Interactive Map" />

            <h3 className="text-[15px] font-bold">Interactive Map</h3>

            <p className="text-[11px] px-2">
              Explore monastery locations with live routes, details, and navigation support.
            </p>

          </div>
        </Link>

        {/* Verify Ticket */}
        {/* <Link href="/verify-ticket">
          <div className="min-w-[230px] h-[250px] bg-black text-white border rounded-xl
              flex flex-col items-center justify-center gap-2 text-center shrink-0">

            <img className="h-20 w-20 rounded-full" src="/digitalarchieves.gif" alt="Verify Ticket" />

            <h3 className="text-[15px] font-bold">Verify Ticket</h3>

            <p className="text-[11px] px-2">
              Quickly verify your ticket by scanning a QR code or entering your ticket ID.
            </p>

          </div>
        </Link> */}

        {/* Book Ticket */}
        <Link href="/book-ticket">
          <div className="min-w-[230px] h-[250px] bg-black text-white border rounded-xl
              flex flex-col items-center justify-center gap-2 text-center shrink-0">

            <img className="h-20 w-20 rounded-full" src="/booking.gif" alt="Book Ticket" />

            <h3 className="text-[15px] font-bold">Book Ticket</h3>

            <p className="text-[11px] px-2">
              Book tickets instantly with secure payment and fast digital confirmation.
            </p>

          </div>
        </Link>

      </div>

      {/* Divider */}
      <div className="bg-slate-700 w-full h-[2px] mt-6"></div>
    
    </div>
  )
}
