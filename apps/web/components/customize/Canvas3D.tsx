// "use client";

// import { Canvas } from "@react-three/fiber";
// import { OrbitControls, Html } from "@react-three/drei";
// import { Suspense } from "react";
// import { TshirtModel } from "./TshirtModel";
// import { DesignLayer } from "@/app/customize/page";

// function Loader() {
//   return (
//     <Html center>
//       <div style={{ color: "#555", fontSize: "18px", fontWeight: "600" }}>
//         Loading 3D Model...
//       </div>
//     </Html>
//   );
// }

// interface Canvas3DProps {
//   designs: DesignLayer[];
//   activeSide: "front" | "back";
// }

// export function Canvas3D({ designs, activeSide }: Canvas3DProps) {
//   return (
//     <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
//       <color attach="background" args={["#d4d4d4"]} />
//       <ambientLight intensity={3} />
//       <directionalLight position={[5, 5, 5]} intensity={2} />
//       <directionalLight position={[-5, 5, -5]} intensity={1} />

//       <Suspense fallback={<Loader />}>
//         <TshirtModel designs={designs} />
//       </Suspense>

//       <OrbitControls target={[0, 0, 0]} enableZoom enableRotate enablePan={false} />
//     </Canvas>
//   );
// }