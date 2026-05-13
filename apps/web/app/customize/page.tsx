"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import styles from "./customize.module.css";
import { useRouter } from "next/navigation";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type View = "front" | "back";

type Location = {
  id: string;
  label: string;
  icon: string;
  zone: string; // CSS class suffix for print-zone positioning
  view: View;
};

type GarmentColor = {
  name: string;
  hex: string;
  tshirtFill: string;
  shadow: string;
  isWhite?: boolean;
};

/* ─────────────────────────────────────────────
   Static Data
───────────────────────────────────────────── */
const PRINT_LOCATIONS: Location[] = [
  { id: "full-front", label: "Full Front", icon: "⬜", zone: "full-front", view: "front" },
  { id: "medium-front", label: "Medium Front", icon: "🔲", zone: "medium-front", view: "front" },
  { id: "center-chest", label: "Center Chest", icon: "⊙", zone: "center-chest", view: "front" },
  { id: "left-chest", label: "Left Chest", icon: "◧", zone: "left-chest", view: "front" },
  { id: "right-chest", label: "Right Chest", icon: "◨", zone: "right-chest", view: "front" },
  { id: "sleeves", label: "Sleeves", icon: "◁", zone: "sleeves", view: "front" },
  { id: "full-back", label: "Full Back", icon: "⬜", zone: "full-back", view: "back" },
  { id: "medium-back", label: "Medium Back", icon: "🔲", zone: "medium-back", view: "back" },
];

const DROPDOWN_LOCATIONS = [
  "Full Front", "Medium Front", "Center Chest",
  "Left Chest", "Right Chest", "Full Back",
];

const GARMENT_COLORS: GarmentColor[] = [
  { name: "White", hex: "#FFFFFF", tshirtFill: "#f0eeeb", shadow: "#d5d3cf", isWhite: true },
  { name: "Black", hex: "#1a1a18", tshirtFill: "#2a2a28", shadow: "#111110" },
  { name: "Ash", hex: "#b0aeab", tshirtFill: "#c8c6c3", shadow: "#a5a3a0" },
  { name: "Navy", hex: "#1e3a5f", tshirtFill: "#244870", shadow: "#162d4a" },
  { name: "Red", hex: "#c0392b", tshirtFill: "#cc3f31", shadow: "#992d22" },
  { name: "Forest", hex: "#2d5a3d", tshirtFill: "#346945", shadow: "#22452e" },
  { name: "Sand", hex: "#d4b896", tshirtFill: "#dfc4a5", shadow: "#c4a882" },
];

/* ─────────────────────────────────────────────
   T-Shirt SVG Component
───────────────────────────────────────────── */
function TShirtSVG({ fill, shadow }: { fill: string; shadow: string }) {
  return (
    <svg
      className={styles.tshirtSvg}
      viewBox="0 0 340 420"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      {/* Drop shadow */}
      <defs>
        <filter id="tshirt-shadow" x="-10%" y="-5%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="rgba(0,0,0,0.18)" />
        </filter>
        <linearGradient id="tshirt-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.08)" />
        </linearGradient>
      </defs>

      {/* Body + sleeves */}
      <g filter="url(#tshirt-shadow)">
        {/* Left sleeve */}
        <path
          d="M20 90 L0 190 L65 210 L80 130 Z"
          fill={fill}
          stroke={shadow}
          strokeWidth="1.5"
        />
        {/* Right sleeve */}
        <path
          d="M320 90 L340 190 L275 210 L260 130 Z"
          fill={fill}
          stroke={shadow}
          strokeWidth="1.5"
        />
        {/* Body */}
        <path
          d="M80 80 C80 80 100 65 140 60 L150 80 C155 90 165 96 170 96 C175 96 185 90 190 80 L200 60 C240 65 260 80 260 80 L275 210 L275 400 L65 400 L65 210 Z"
          fill={fill}
          stroke={shadow}
          strokeWidth="1.5"
        />
        {/* Collar */}
        <path
          d="M150 80 C155 90 165 96 170 96 C175 96 185 90 190 80 C185 72 175 68 170 68 C165 68 155 72 150 80 Z"
          fill={shadow}
          stroke={shadow}
          strokeWidth="1"
        />
        {/* Sheen overlay */}
        <path
          d="M80 80 C80 80 100 65 140 60 L150 80 C155 90 165 96 170 96 C175 96 185 90 190 80 L200 60 C240 65 260 80 260 80 L275 210 L275 400 L65 400 L65 210 Z"
          fill="url(#tshirt-sheen)"
          stroke="none"
        />
        {/* Sleeve sheen */}
        <path d="M20 90 L0 190 L65 210 L80 130 Z" fill="url(#tshirt-sheen)" stroke="none" />
        <path d="M320 90 L340 190 L275 210 L260 130 Z" fill="url(#tshirt-sheen)" stroke="none" />
      </g>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function CustomizePage() {
  const router = useRouter();
  const [view, setView] = useState<View>("front");
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location>(PRINT_LOCATIONS[0]!);
  const [garmentColor, setGarmentColor] = useState<GarmentColor>(GARMENT_COLORS[0]!);
  const [artworkSrc, setArtworkSrc] = useState<string | null>(null);
  const [artworkName, setArtworkName] = useState("");
  const [artworkFileSize, setArtworkFileSize] = useState("");
  const [scale, setScale] = useState(50);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // posX/posY = percentage of tshirtSvgContainer (0–100). Centre = 50,50.
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(50);
  const [isHoveringZone, setIsHoveringZone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const padRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // tshirtSvgContainer ref

  /* ── Zone default centres (% of container) ── */
  const ZONE_CENTRES: Record<string, [number, number]> = {
    "full-front": [50, 47],
    "medium-front": [50, 44],
    "center-chest": [50, 33],
    "left-chest": [31, 33],
    "right-chest": [69, 33],
    "sleeves": [11, 38],
    "full-back": [50, 47],
    "medium-back": [50, 44],
  };

  /* ── Switch front/back ── */
  const switchView = (v: View) => {
    setView(v);
    setIsFlipped(v === "back");
    const match = PRINT_LOCATIONS.find((l) => l.view === v);
    if (match) setSelectedLocation(match);
  };

  /* ── File handling ── */
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setArtworkSrc(url);
    setArtworkName(file.name);
    setArtworkFileSize((file.size / 1024).toFixed(0) + " KB");
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  /* ── Shared helper: clamp pos from pad ── */
  const [padX, setPadX] = useState(50);
  const [padY, setPadY] = useState(50);

  /* ── Dragging state: "pad" | "zone" | null ── */
  const [dragging, setDragging] = useState<"pad" | "zone" | null>(null);
  // offset from zone top-left when drag starts on the zone itself
  const dragOffset = useRef<{ ox: number; oy: number }>({ ox: 0, oy: 0 });

  const applyPosFromPad = useCallback((clientX: number, clientY: number) => {
    const pad = padRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    setPadX(x);
    setPadY(y);
    setPosX(x);
    setPosY(y);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      if (dragging === "pad") {
        applyPosFromPad(e.clientX, e.clientY);
      }
      if (dragging === "zone") {
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
        const newX = Math.max(0, Math.min(100, x - dragOffset.current.ox));
        const newY = Math.max(0, Math.min(100, y - dragOffset.current.oy));
        setPosX(newX);
        setPosY(newY);
        setPadX(newX);
        setPadY(newY);
      }
    };
    const onUp = () => setDragging(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, applyPosFromPad]);

  /* ── Close menu on outside click ── */
  useEffect(() => {
    const handler = () => setMenuOpen(false);
    if (menuOpen) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [menuOpen]);

  /* ── Select location → snap position to zone centre ── */
  const selectLocation = (loc: Location) => {
    setSelectedLocation(loc);
    if (loc.view !== view) switchView(loc.view);
    const [cx, cy] = ZONE_CENTRES[loc.zone] ?? [50, 50];
    setPosX(cx); setPosY(cy);
    setPadX(cx); setPadY(cy);
  };

  const selectDropdown = (label: string) => {
    const match = PRINT_LOCATIONS.find((l) => l.label === label);
    if (match) selectLocation(match);
    setMenuOpen(false);
  };

  /* ── Zone size from selected location (% of container) ── */
  const ZONE_SIZES: Record<string, { w: number; h: number }> = {
    "full-front": { w: 64, h: 58 },
    "medium-front": { w: 56, h: 44 },
    "center-chest": { w: 36, h: 26 },
    "left-chest": { w: 26, h: 20 },
    "right-chest": { w: 26, h: 20 },
    "sleeves": { w: 18, h: 22 },
    "full-back": { w: 64, h: 58 },
    "medium-back": { w: 56, h: 44 },
  };
  const zoneSize = ZONE_SIZES[selectedLocation.zone] ?? { w: 50, h: 40 };
  const scaledW = zoneSize.w * (scale / 100);
  const scaledH = zoneSize.h * (scale / 100);

  /* ── Computed zone style: freely positioned by posX/posY ── */
  const zoneStyle: React.CSSProperties = {
    left: `${posX}%`,
    top: `${posY}%`,
    width: `${scaledW}%`,
    height: `${scaledH}%`,
    transform: "translate(-50%, -50%)",
    transition: dragging ? "none" : "left 0.15s ease, top 0.15s ease",
    cursor: artworkSrc ? "grab" : "default",
  };

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>

        {/* LEFT */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <button
            onClick={() => router.back()}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              border: "1px solid #e2e0db",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line
                x1="19"
                y1="12"
                x2="5"
                y2="12"
              />

              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>

          <a className={styles.logo}>
            STUDIO DIRT
          </a>
        </div>

        {/* CENTER */}
        <nav className={styles.headerNav}>
          <button
            className={`${styles.navLink} ${styles.navLinkActive}`}
          >
            Canvas
          </button>

          <button className={styles.navLink}>
            Gallery
          </button>

          <button className={styles.navLink}>
            Orders
          </button>
        </nav>

        {/* RIGHT */}
        <button className={styles.addToCart}>
          Add to Cart
        </button>
      </header>

      {/* ── Main ── */}
      <main className={styles.main}>

        {/* ── Canvas ── */}
        <section className={styles.canvasArea}>
          <div className={styles.tshirtStage}>
            <div className={styles.tshirtFlipWrapper}>
              <div className={`${styles.tshirtFlipInner} ${isFlipped ? styles.flipped : ""}`}>

                {/* Front face */}
                <div className={`${styles.tshirtFace}`}>
                  <div className={styles.tshirtSvgContainer} ref={containerRef}>
                    <TShirtSVG fill={garmentColor.tshirtFill} shadow={garmentColor.shadow} />
                    {/* Print zone */}
                    {view === "front" && (
                      <div
                        className={`${styles.printZone} ${!artworkSrc ? styles.printZoneEmpty : ""}`}
                        style={zoneStyle}
                        onMouseEnter={() => setIsHoveringZone(true)}
                        onMouseLeave={() => setIsHoveringZone(false)}
                        onPointerDown={(e) => {
                          if (!artworkSrc) return;
                          e.preventDefault();
                          // calc offset so drag is relative to where user grabbed
                          const el = containerRef.current;
                          if (!el) return;
                          const rect = el.getBoundingClientRect();
                          const clickXpct = ((e.clientX - rect.left) / rect.width) * 100;
                          const clickYpct = ((e.clientY - rect.top) / rect.height) * 100;
                          dragOffset.current = { ox: clickXpct - posX, oy: clickYpct - posY };
                          setDragging("zone");
                        }}
                      >
                        {artworkSrc ? (
                          <>
                            <div className={styles.zoneInner}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={artworkSrc} alt="artwork" className={styles.artworkInZone} draggable={false} />
                            </div>
                            {isHoveringZone && (
                              <button
                                className={styles.zoneRemoveBtn}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setArtworkSrc(null);
                                  setArtworkName("");
                                  setArtworkFileSize("");
                                  setIsHoveringZone(false);
                                }}
                              >✕</button>
                            )}
                          </>
                        ) : (
                          <div className={styles.uploadPromptInZone}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <path d="M3 9l4-4 4 4 4-4 4 4" />
                              <line x1="12" y1="12" x2="12" y2="21" />
                            </svg>
                            {selectedLocation.label}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Back face */}
                <div className={`${styles.tshirtFace} ${styles.tshirtBack}`}>
                  <div className={styles.tshirtSvgContainer}>
                    <TShirtSVG fill={garmentColor.tshirtFill} shadow={garmentColor.shadow} />
                    {view === "back" && (
                      <div
                        className={`${styles.printZone} ${!artworkSrc ? styles.printZoneEmpty : ""}`}
                        style={zoneStyle}
                        onMouseEnter={() => setIsHoveringZone(true)}
                        onMouseLeave={() => setIsHoveringZone(false)}
                        onPointerDown={(e) => {
                          if (!artworkSrc) return;
                          e.preventDefault();
                          const el = containerRef.current;
                          if (!el) return;
                          const rect = el.getBoundingClientRect();
                          const clickXpct = ((e.clientX - rect.left) / rect.width) * 100;
                          const clickYpct = ((e.clientY - rect.top) / rect.height) * 100;
                          dragOffset.current = { ox: clickXpct - posX, oy: clickYpct - posY };
                          setDragging("zone");
                        }}
                      >
                        {artworkSrc ? (
                          <>
                            <div className={styles.zoneInner}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={artworkSrc} alt="artwork" className={styles.artworkInZone} draggable={false} />
                            </div>
                            {isHoveringZone && (
                              <button
                                className={styles.zoneRemoveBtn}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setArtworkSrc(null);
                                  setArtworkName("");
                                  setArtworkFileSize("");
                                  setIsHoveringZone(false);
                                }}
                              >✕</button>
                            )}
                          </>
                        ) : (
                          <div className={styles.uploadPromptInZone}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <path d="M3 9l4-4 4 4 4-4 4 4" />
                              <line x1="12" y1="12" x2="12" y2="21" />
                            </svg>
                            {selectedLocation.label}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Front / Back toggle */}
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${view === "front" ? styles.toggleBtnActive : ""}`}
              onClick={() => switchView("front")}
            >
              Front
            </button>
            <button
              className={`${styles.toggleBtn} ${view === "back" ? styles.toggleBtnActive : ""}`}
              onClick={() => switchView("back")}
            >
              Back
            </button>
          </div>
        </section>

        {/* ── Sidebar ── */}
        <aside className={styles.sidebar}>

          {/* Artwork Upload */}
          <div className={styles.sidebarSection}>
            <div className={styles.sectionLabel}>Artwork</div>

            {artworkSrc ? (
              <div className={styles.uploadedPreview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={artworkSrc} alt="thumb" className={styles.uploadedThumb} />
                <div className={styles.uploadedInfo}>
                  <div className={styles.uploadedName}>{artworkName}</div>
                  <div className={styles.uploadedSize}>{artworkFileSize}</div>
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => { setArtworkSrc(null); setArtworkName(""); setArtworkFileSize(""); }}
                  aria-label="Remove artwork"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                className={`${styles.uploadZone} ${isDraggingOver ? styles.uploadZoneActive : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={onDrop}
              >
                <div className={styles.uploadIcon}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <polyline points="16 16 12 12 8 16" />
                    <line x1="12" y1="12" x2="12" y2="21" />
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                  </svg>
                </div>
                <div className={styles.uploadTitle}>Drop your image here</div>
                <div className={styles.uploadSubtitle}>Supports PNG, JPG up to 50 MB</div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={onInputChange}
            />
          </div>

          {/* Placement */}
          <div className={styles.sidebarSection}>
            <div className={styles.placementHeader}>
              <div className={styles.sectionLabel} style={{ marginBottom: 0 }}>Placement</div>
              <div className={styles.placementDropdown}>
                <button
                  className={styles.placementMenuBtn}
                  onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                  Menu
                </button>
                {menuOpen && (
                  <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                    {DROPDOWN_LOCATIONS.map((label) => (
                      <button
                        key={label}
                        className={`${styles.dropdownItem} ${selectedLocation.label === label ? styles.dropdownItemActive : ""}`}
                        onClick={() => selectDropdown(label)}
                      >
                        {label}
                        {selectedLocation.label === label && (
                          <span className={styles.checkIcon}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Select Print Location */}
          <div className={styles.sidebarSection}>
            <div className={styles.sectionLabel}>Select Print Location</div>
            <div className={styles.locationGrid}>
              {PRINT_LOCATIONS.map((loc) => (
                <button
                  key={loc.id}
                  className={`${styles.locationChip} ${selectedLocation.id === loc.id ? styles.locationChipActive : ""}`}
                  onClick={() => selectLocation(loc)}
                >
                  <span className={styles.locationChipIcon}>{loc.icon}</span>
                  {loc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Artwork Scale */}
          <div className={styles.sidebarSection}>
            <div className={styles.sectionLabel}>Artwork Scale</div>
            <div className={styles.sliderRow}>
              <span className={styles.sliderLabel}>−</span>
              <input
                className={styles.slider}
                type="range"
                min={10}
                max={100}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
              />
              <span className={styles.sliderLabel}>+</span>
              <span className={styles.sliderValue}>{scale}%</span>
            </div>
          </div>

          {/* Position Control */}
          <div className={styles.sidebarSection}>
            <div className={styles.sectionLabel}>Position Control</div>
            <div
              ref={padRef}
              className={styles.positionPad}
              onPointerDown={(e) => {
                applyPosFromPad(e.clientX, e.clientY);
                setDragging("pad");
              }}
            >
              <div
                className={styles.positionDot}
                style={{ left: `${padX}%`, top: `${padY}%` }}
              />
            </div>
          </div>

          {/* Garment Color */}
          <div className={styles.sidebarSection}>
            <div className={styles.sectionLabel}>Garment Color</div>
            <div className={styles.colorRow}>
              {GARMENT_COLORS.map((c) => (
                <div
                  key={c.name}
                  title={c.name}
                  className={`${styles.colorSwatch} ${garmentColor.name === c.name ? styles.colorSwatchActive : ""} ${c.isWhite ? styles.colorSwatchWhite : ""}`}
                  style={{ backgroundColor: c.hex, borderColor: garmentColor.name === c.name ? "#1a1a18" : "transparent" }}
                  onClick={() => setGarmentColor(c)}
                />
              ))}
            </div>
          </div>

        </aside>
      </main>
    </div>
  );
}