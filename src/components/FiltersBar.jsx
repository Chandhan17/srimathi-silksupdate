import { categories, fabricTypes, getFabricsForCategory } from '../config/categories'

export default function FiltersBar({ filters, onChange, onClear, sizeOptions = [] }) {
  const availableFabrics = filters.category
    ? getFabricsForCategory(filters.category)
    : fabricTypes

  return (
    <section className="rounded-2xl border border-brand-gold/30 bg-white/80 p-4 shadow-soft md:p-6">
      <div className="grid gap-3 md:grid-cols-6">
        <input
          value={filters.search}
          onChange={(event) => onChange('search', event.target.value)}
          placeholder="Search saree name"
          className="input-field md:col-span-2"
        />

        <select
          value={filters.category}
          onChange={(event) => onChange('category', event.target.value)}
          className="input-field"
        >
          <option value="">All Categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={filters.fabric}
          onChange={(event) => onChange('fabric', event.target.value)}
          className="input-field"
        >
          <option value="">All Fabrics</option>
          {availableFabrics.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={filters.sizeLength}
          onChange={(event) => onChange('sizeLength', event.target.value)}
          className="input-field"
        >
          <option value="">All Sizes</option>
          {sizeOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button type="button" onClick={onClear} className="btn-outline">
          Clear Filters
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm text-brand-maroon/80">
          Min Price (INR)
          <input
            value={filters.minPrice}
            onChange={(event) => onChange('minPrice', event.target.value)}
            type="number"
            className="input-field mt-1"
            placeholder="0"
          />
        </label>

        <label className="text-sm text-brand-maroon/80">
          Max Price (INR)
          <input
            value={filters.maxPrice}
            onChange={(event) => onChange('maxPrice', event.target.value)}
            type="number"
            className="input-field mt-1"
            placeholder="50000"
          />
        </label>
      </div>
    </section>
  )
}
