import "./globals.css";
import Sessionwrapper from "./Sessionwrapper";
import { VRTourProvider } from "@/context/VRTourContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Sessionwrapper>
          <VRTourProvider>
            <div className="absolute top-0 z-[-2] min-h-full w-screen bg-[#000000] bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] bg-size-[20px_20px]">
                <Navbar />
            {children}
            <Footer/>
            </div>
          
          </VRTourProvider>
        </Sessionwrapper>
      </body>
    </html>
  );
}
