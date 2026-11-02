import Calibration from "@/components/intro/Calibration";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import Skills from "@/components/sections/Skills";

export default function Home() {
  return (
    <>
      <Calibration />
      <main id="main-content">
        <Hero />
        <About />
        <Services />
        <Skills />
        <Contact />
      </main>
    </>
  );
}
