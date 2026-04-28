"use client";

import styles from "./CategoryFilter.module.css";

interface CategoryFilterProps {
  categories: readonly { label: string; value: string }[];
  onSelect: (value: string) => void;
  selected: string;
}

export default function CategoryFilter({
  categories,
  onSelect,
  selected,
}: CategoryFilterProps) {
  return (
    <div className={styles.container} id="category-filter">
      <div className={styles.scrollWrap}>
        {categories.map((cat) => (
          <button
            key={cat.value}
            className={`${styles.pill} ${selected === cat.value ? styles.active : ""}`}
            onClick={() => onSelect(cat.value)}
            id={`category-${cat.value}`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
