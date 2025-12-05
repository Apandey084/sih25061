// "use client"
// import Explorefeature from "./components/ExploreFeature";
// import Featuredmonastery from "./components/featuredmonastery";

// export default function Home() {
//   return (
//     <>
      


//         <div className="banner   bg-[url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvyi-BAHLi81eoRnunKtIr2blmIbBS7R1pDw&s')] h-[500px] w-[80vw]  container mx-auto bg-no-repeat bg-cover  z-[-1]   border border-amber-50 flex flex-col gap-4 py-[40px] rounded-[10px] ">


//           <h1 className="text-6xl font-extrabold text-black  text-center pt-[100px]">Discover Sikkim's Sacred Heritage</h1>
//           <p className="text-center text-black px-[20vw]">Lorem ipsum dolor sit amet consectetur adipisicing elit. Harum magni, dolorum necessitatibus tenetur saepe, quisquam accusantium veritatis quo facere laboriosam, totam ipsam id. Quisquam, harum repellendus? Rem ipsum dolorum iste.</p>


//           <div className="vitualtour text-center pt-20 "><button type="button" className="text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">Virtual Tour</button></div>




//         </div>



//         {/* horizontal scale */}
//         <div className="bg-slate-700 w-full h-[2px] mt-[15px]"></div>


// {/* featured monasteries */}
// <h1 className="text-white text-3xl font-bold text-center"> Featured Monasteries</h1>

// <div className="featuredmonasteries text-left   h-[500px] w-[80vw]  container mx-auto py-[20px]  ">
// {/* <div className="monasteriescard h-[400px] w-[270px] text-white border border-slate-400 text-center  rounded-[10px]   flex flex-col gap-2  hover:bg-sky-700   ">
//   <img className="h-[150px] w-[270px] "    src="https://media.istockphoto.com/id/687689872/photo/buddha-park-rabangla-sikkim.webp?a=1&b=1&s=612x612&w=0&k=20&c=WTGGsTlp0z97R6UoL-JMtZGrpHZFI_l4DHAQA0m8ek0=" alt="" />
//   <h3 className="text-[15px] font-bold ">dffgndffgfdjknndsvkdv</h3>
//   <p className="text-[8px] text-center">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Voluptatem blanditiis culpa officia eaque possimus itaque quas voluptatibus voluptas ullam sapiente, asperiores eius laudantium aperiam nobis illum alias quam at reiciendis!</p>

//     <div className="vitualtour text-center pt-20 "><button type="button" className="text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">Virtual Tour</button></div>

// </div> */}
// <Featuredmonastery/>


// </div>
//   {/* horizontal scale */}
//         <div className="bg-slate-700 w-full h-[2px] mt-[15px]"></div>
// <Explorefeature/>





// {/* Upcoming Event */}
// <h1 className="text-white text-3xl font-bold text-center"> Upcoming Event</h1>

// <div className="upcomingevent container mx-auto ">
//  <div className="eventcard  bg-blackh-[100px] w-[350px] text-white border flex flex-col gap-2 justify-center items-cente">
//   <h2 className="text-[20px] font-bold  text-center ">fgrfgjehdjfdsfjhfdjfdffdfn</h2>
//   <p className="text-[10px] text-center">dfdbfdbdffdgffgbfg</p>

//  </div>

// </div>







    

//     </>
//   );
// }

"use client"
import Explorefeature from "./components/ExploreFeature";
import Featuredmonastery from "./components/featuredmonastery";
import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* ===== Banner ===== */}
      <section className="w-full flex justify-center px-4">
        <div
          className="relative w-full max-w-7xl rounded-lg overflow-hidden
            bg-no-repeat bg-cover flex flex-col items-center text-center
            py-10 sm:py-14 md:py-20"
          style={{
            backgroundImage:
              "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvyi-BAHLi81eoRnunKtIr2blmIbBS7R1pDw&s')",
          }}
        >
          {/* dark overlay */}
          <div className="absolute inset-0 bg-black/50" />

          <div className="relative z-10 px-4 w-full">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight max-w-4xl mx-auto">
              Discover Sikkim's Sacred Heritage
            </h1>

            <p className="mt-4 text-sm sm:text-base text-gray-100 max-w-3xl mx-auto px-2">
              Discover historic monasteries through immersive tours, guided narration, and easy visit planning — all from your device.
            </p>

            <div className="mt-6 flex justify-center">
             <Link href='/viewer'> <button
                type="button"
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm sm:text-base font-medium
                  bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                Virtual Tour
              </button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* horizontal scale */}
      <div className="bg-slate-700 w-full h-px mt-6" />

      {/* Featured Monasteries */}
      <section className="w-full px-4 mt-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-white text-2xl sm:text-3xl font-bold text-center mb-4">
            Featured Monasteries
          </h2>

          {/* 
            - snap-x & snap-mandatory make each card snap into place on horizontal scroll
            - overflow-x-auto allows horizontal scrolling on small screens
            - children (cards) should have snap-start and flex-shrink-0 / min-w so they snap nicely
            NOTE: we wrap the imported component so it can be treated as a scroll-snap item.
            If Featuredmonastery itself renders multiple cards horizontally, update that component
            to add `snap-start` on each card. */}
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:flex-wrap md:overflow-visible md:justify-start">
            <div className="flex-shrink-0 min-w-[250px] snap-start md:min-w-0 md:flex-1">
              <Featuredmonastery />
            </div>
          </div>
        </div>
      </section>

      {/* horizontal scale */}
      <div className="bg-slate-700 w-full h-px mt-6" />

      {/* Explore Feature (keeps your component import unchanged) */}
      <section className="w-full px-4 mt-8">
        <div className="max-w-7xl mx-auto">
          <Explorefeature />
        </div>
      </section>

      {/* horizontal scale */}
      <div className="bg-slate-700 w-full h-px mt-6" />

      {/* Upcoming Event */}
      <section className="w-full px-4 mt-8 mb-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-white text-2xl sm:text-3xl font-bold text-center mb-6">
            Upcoming Event
          </h2>

          <div className="flex justify-center">
            <div
              className="w-full max-w-xl bg-black/80 rounded-lg p-6 text-white flex flex-col gap-3
                items-center"
            >
              <h3 className="text-lg sm:text-xl font-bold text-center">
                Annual Monastery Festival — Date & Time
              </h3>
              <p className="text-sm text-gray-200 text-center">
                Join us for traditional rituals, cultural performances, and guided monastery tours.
              </p>
              <div className="mt-2 flex gap-3">
               <Link href='/events'> <button className="px-4 py-2 rounded-md bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm">
                  Click me
                </button></Link>
               
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
