import VortexStage from "@/components/vortex/VortexStage";
import { FULL_VORTEX_PROJECTS } from "@/lib/vortex-config";

export default function Hero() {
  return <VortexStage projects={FULL_VORTEX_PROJECTS} variant="home" />;
}
