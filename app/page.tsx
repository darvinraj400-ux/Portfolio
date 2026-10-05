import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import Featured from "@/components/sections/Featured";
import Footer from "@/components/sections/Footer";
import Hero from "@/components/sections/Hero";
import Products from "@/components/sections/Products";
import Services from "@/components/sections/Services";
import Skills from "@/components/sections/Skills";

export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <Featured />
      <Products />
      <Services />
      <Skills />
      <Contact />
      <Footer />
    </main>
  );
}
