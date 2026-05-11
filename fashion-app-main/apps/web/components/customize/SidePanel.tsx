// "use client";

// import { useRef, useState, useCallback } from "react";
// import { DesignLayer } from "@/app/customize/page";

// interface SidePanelProps {
//   designs: DesignLayer[];
//   activeSide: "front" | "back";
//   setActiveSide: (side: "front" | "back") => void;
//   addDesign: (url: string) => void;
//   updateDesign: (id: string, updates: Partial<DesignLayer>) => void;
//   removeDesign: (id: string) => void;
// }

// export function SidePanel({
//   designs,
//   activeSide,
//   setActiveSide,
//   addDesign,
//   updateDesign,
//   removeDesign,
// }: SidePanelProps) {
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const canvasRef = useRef<HTMLDivElement>(null);
//   const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
//   const [resizing, setResizing] = useState<{ id: string; startX: number; startY: number; startW: number; startH: number } | null>(null);
//   const [selected, setSelected] = useState<string | null>(null);

//   const currentDesigns = designs.filter((d) => d.side === activeSide);

//   const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = (ev) => addDesign(ev.target?.result as string);
//     reader.readAsDataURL(file);
//     e.target.value = "";
//   };

//   const handleMouseDown = (e: React.MouseEvent, id: string) => {
//     e.stopPropagation();
//     setSelected(id);
//     const rect = canvasRef.current?.getBoundingClientRect();
//     if (!rect) return;
//     const design = designs.find((d) => d.id === id);
//     if (!design) return;
//     setDragging({
//       id,
//       offsetX: e.clientX - rect.left - design.x,
//       offsetY: e.clientY - rect.top - design.y,
//     });
//   };

//   const handleResizeDown = (e: React.MouseEvent, id: string) => {
//     e.stopPropagation();
//     const design = designs.find((d) => d.id === id);
//     if (!design) return;
//     setResizing({
//       id,
//       startX: e.clientX,
//       startY: e.clientY,
//       startW: design.width,
//       startH: design.height,
//     });
//   };

//   const handleMouseMove = useCallback(
//     (e: React.MouseEvent) => {
//       const rect = canvasRef.current?.getBoundingClientRect();
//       if (!rect) return;

//       if (dragging) {
//         const newX = Math.max(0, Math.min(e.clientX - rect.left - dragging.offsetX, rect.width - 40));
//         const newY = Math.max(0, Math.min(e.clientY - rect.top - dragging.offsetY, rect.height - 40));
//         updateDesign(dragging.id, { x: newX, y: newY });
//       }

//       if (resizing) {
//         const dx = e.clientX - resizing.startX;
//         const dy = e.clientY - resizing.startY;
//         const newW = Math.max(40, resizing.startW + dx);
//         const newH = Math.max(40, resizing.startH + dy);
//         updateDesign(resizing.id, { width: newW, height: newH });
//       }
//     },
//     [dragging, resizing, updateDesign]
//   );

//   const handleMouseUp = () => {
//     setDragging(null);
//     setResizing(null);
//   };

//   return (
//     <div
//       style={{
//         width: "340px",
//         height: "100vh",
//         background: "#1a1a1a",
//         borderLeft: "1px solid #333",
//         display: "flex",
//         flexDirection: "column",
//         padding: "16px",
//         gap: "12px",
//         userSelect: "none",
//       }}
//     >
//       {/* Header */}
//       <div style={{ color: "white", fontWeight: "700", fontSize: "16px", letterSpacing: "1px" }}>
//         CUSTOMIZE
//       </div>

//       {/* Front / Back Toggle */}
//       <div style={{ display: "flex", background: "#2a2a2a", borderRadius: "8px", padding: "4px", gap: "4px" }}>
//         {(["front", "back"] as const).map((side) => (
//           <button
//             key={side}
//             onClick={() => setActiveSide(side)}
//             style={{
//               flex: 1,
//               padding: "8px",
//               background: activeSide === side ? "white" : "transparent",
//               color: activeSide === side ? "black" : "#888",
//               border: "none",
//               borderRadius: "6px",
//               fontWeight: "600",
//               fontSize: "13px",
//               cursor: "pointer",
//               textTransform: "uppercase",
//               letterSpacing: "1px",
//               transition: "all 0.2s",
//             }}
//           >
//             {side}
//           </button>
//         ))}
//       </div>

//       {/* 2D Canvas Area */}
//       <div
//         ref={canvasRef}
//         onMouseMove={handleMouseMove}
//         onMouseUp={handleMouseUp}
//         onClick={() => setSelected(null)}
//         style={{
//           position: "relative",
//           width: "100%",
//           height: "300px",
//           background: "#e8e8e8",
//           borderRadius: "12px",
//           overflow: "hidden",
//           cursor: dragging ? "grabbing" : "default",
//         }}
//       >
//         {/* T-shirt silhouette */}
//         <svg
//           viewBox="0 0 200 220"
//           style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.15 }}
//         >
//           {activeSide === "front" ? (
//             <path
//               d="M60,10 L20,40 L40,60 L30,210 L170,210 L160,60 L180,40 L140,10 L120,30 Q100,45 80,30 Z"
//               fill="#555"
//             />
//           ) : (
//             <path
//               d="M60,10 L20,40 L40,60 L30,210 L170,210 L160,60 L180,40 L140,10 L120,25 Q100,35 80,25 Z"
//               fill="#555"
//             />
//           )}
//         </svg>

//         {/* T-shirt outline */}
//         <svg
//           viewBox="0 0 200 220"
//           style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
//         >
//           {activeSide === "front" ? (
//             <path
//               d="M60,10 L20,40 L40,60 L30,210 L170,210 L160,60 L180,40 L140,10 L120,30 Q100,45 80,30 Z"
//               fill="none"
//               stroke="#aaa"
//               strokeWidth="1.5"
//               strokeDasharray="4 3"
//             />
//           ) : (
//             <path
//               d="M60,10 L20,40 L40,60 L30,210 L170,210 L160,60 L180,40 L140,10 L120,25 Q100,35 80,25 Z"
//               fill="none"
//               stroke="#aaa"
//               strokeWidth="1.5"
//               strokeDasharray="4 3"
//             />
//           )}
//         </svg>

//         {/* Label */}
//         <div
//           style={{
//             position: "absolute",
//             top: "8px",
//             left: "50%",
//             transform: "translateX(-50%)",
//             color: "#888",
//             fontSize: "11px",
//             fontWeight: "600",
//             letterSpacing: "1px",
//             textTransform: "uppercase",
//           }}
//         >
//           {activeSide}
//         </div>

//         {/* Draggable design layers */}
//         {currentDesigns.map((design) => (
//           <div
//             key={design.id}
//             onMouseDown={(e) => handleMouseDown(e, design.id)}
//             style={{
//               position: "absolute",
//               left: design.x,
//               top: design.y,
//               width: design.width,
//               height: design.height,
//               border: selected === design.id ? "2px solid #4d9eff" : "2px dashed #aaa",
//               cursor: "grab",
//               boxSizing: "border-box",
//             }}
//           >
//             <img
//               src={design.url}
//               alt="design"
//               style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
//             />

//             {/* Resize handle */}
//             {selected === design.id && (
//               <>
//                 <div
//                   onMouseDown={(e) => handleResizeDown(e, design.id)}
//                   style={{
//                     position: "absolute",
//                     bottom: -6,
//                     right: -6,
//                     width: 12,
//                     height: 12,
//                     background: "#4d9eff",
//                     borderRadius: "50%",
//                     cursor: "se-resize",
//                   }}
//                 />
//                 {/* Delete button */}
//                 <button
//                   onMouseDown={(e) => { e.stopPropagation(); removeDesign(design.id); }}
//                   style={{
//                     position: "absolute",
//                     top: -10,
//                     right: -10,
//                     width: 20,
//                     height: 20,
//                     background: "#ff4444",
//                     color: "white",
//                     border: "none",
//                     borderRadius: "50%",
//                     cursor: "pointer",
//                     fontSize: "11px",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     fontWeight: "bold",
//                   }}
//                 >
//                   ×
//                 </button>
//               </>
//             )}
//           </div>
//         ))}

//         {/* Empty state */}
//         {currentDesigns.length === 0 && (
//           <div
//             style={{
//               position: "absolute",
//               bottom: "16px",
//               left: "50%",
//               transform: "translateX(-50%)",
//               color: "#999",
//               fontSize: "11px",
//               textAlign: "center",
//               whiteSpace: "nowrap",
//             }}
//           >
//             Upload an image to place on {activeSide}
//           </div>
//         )}
//       </div>

//       {/* Upload Button */}
//       <button
//         onClick={() => fileInputRef.current?.click()}
//         style={{
//           padding: "12px",
//           background: "white",
//           border: "none",
//           borderRadius: "8px",
//           fontWeight: "600",
//           fontSize: "14px",
//           cursor: "pointer",
//           letterSpacing: "0.5px",
//         }}
//       >
//         + Upload Image
//       </button>
//       <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />

//       {/* Layer list */}
//       {designs.length > 0 && (
//         <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
//           <div style={{ color: "#888", fontSize: "11px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>
//             Layers
//           </div>
//           {designs.map((d) => (
//             <div
//               key={d.id}
//               onClick={() => { setActiveSide(d.side); setSelected(d.id); }}
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "8px",
//                 padding: "8px",
//                 background: selected === d.id ? "#2a3a4a" : "#2a2a2a",
//                 borderRadius: "6px",
//                 cursor: "pointer",
//                 border: selected === d.id ? "1px solid #4d9eff" : "1px solid transparent",
//               }}
//             >
//               <img src={d.url} alt="" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: "4px" }} />
//               <div>
//                 <div style={{ color: "white", fontSize: "12px", fontWeight: "600" }}>Design layer</div>
//                 <div style={{ color: "#888", fontSize: "11px", textTransform: "uppercase" }}>{d.side}</div>
//               </div>
//               <button
//                 onClick={(e) => { e.stopPropagation(); removeDesign(d.id); }}
//                 style={{ marginLeft: "auto", background: "none", border: "none", color: "#ff4444", cursor: "pointer", fontSize: "16px" }}
//               >
//                 ×
//               </button>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }