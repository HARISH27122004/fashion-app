// "use client";

// import { useGLTF } from "@react-three/drei";
// import { useEffect } from "react";
// import * as THREE from "three";
// import { DesignLayer } from "@/app/customize/page";

// interface TshirtModelProps {
//   designs: DesignLayer[];
// }

// function buildCompositeTexture(designs: DesignLayer[], side: "front" | "back"): Promise<string | null> {
//   const sideDesigns = designs.filter((d) => d.side === side);
//   if (sideDesigns.length === 0) return Promise.resolve(null);

//   return new Promise((resolve) => {
//     const canvas = document.createElement("canvas");
//     canvas.width = 1024;
//     canvas.height = 1024;
//     const ctx = canvas.getContext("2d")!;

//     ctx.fillStyle = "white";
//     ctx.fillRect(0, 0, 1024, 1024);

//     let loaded = 0;
//     sideDesigns.forEach((d) => {
//       const img = new Image();
//       img.onload = () => {
//         // Normalize positions from 300px panel to 1024 texture
//         const scaleX = 1024 / 300;
//         const scaleY = 1024 / 300;
//         ctx.drawImage(img, d.x * scaleX, d.y * scaleY, d.width * scaleX, d.height * scaleY);
//         loaded++;
//         if (loaded === sideDesigns.length) resolve(canvas.toDataURL());
//       };
//       img.src = d.url;
//     });
//   });
// }

// export function TshirtModel({ designs }: TshirtModelProps) {
//   const model = useGLTF("/models/tshirt.glb");

//   useEffect(() => {
//     const applyTextures = async () => {
//       const frontUrl = await buildCompositeTexture(designs, "front");
//       const backUrl = await buildCompositeTexture(designs, "back");

//       const loader = new THREE.TextureLoader();

//       const applyToMaterial = (matName: string, url: string | null) => {
//         model.scene.traverse((child) => {
//           if ((child as THREE.Mesh).isMesh) {
//             const mesh = child as THREE.Mesh;
//             const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
//             materials.forEach((mat) => {
//               const m = mat as THREE.MeshStandardMaterial;
//               if (m.name === matName) {
//                 if (url) {
//                   loader.load(url, (texture) => {
//                     texture.flipY = false;
//                     texture.colorSpace = THREE.SRGBColorSpace;
//                     m.map = texture;
//                     m.needsUpdate = true;
//                   });
//                 } else {
//                   m.map = null;
//                   m.needsUpdate = true;
//                 }
//               }
//             });
//           }
//         });
//       };

//       // Knit_Cotton_Jersey = main shirt body (front)
//       applyToMaterial("Knit_Cotton_Jersey_FRONT_1950", frontUrl);
//       // Material2178 = back/secondary panels
//       applyToMaterial("Material2178", backUrl);
//     };

//     applyTextures();
//   }, [designs, model.scene]);

//   return (
//     <group>
//       <primitive object={model.scene} scale={0.1} position={[0, 0, 0]} />
//     </group>
//   );
// }