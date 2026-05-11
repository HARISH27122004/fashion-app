// "use client";

// import { useCustomization } from "@/hooks/useCustomization";

// export function UploadPanel() {
//   const { setLogo } =
//     useCustomization();

//   function handleUpload(
//     e: React.ChangeEvent<HTMLInputElement>
//   ) {
//     const file =
//       e.target.files?.[0];

//     if (!file) return;

//     const url =
//       URL.createObjectURL(file);

//     setLogo(url);
//   }

//   return (
//     <div
//       style={{
//         position: "absolute",
//         top: 20,
//         left: 20,
//         zIndex: 100,
//       }}
//     >
//       <input
//         type="file"
//         accept="image/*"
//         onChange={handleUpload}
//       />
//     </div>
//   );
// }