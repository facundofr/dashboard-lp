import { useMemo } from "react"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select"

/**
 * Selector único de categoría. Se usa en el formulario de alta, en la card,
 * en la tabla y en la barra de acciones masivas para que la asignación
 * de categorías se comporte igual en toda la app.
 */
export default function CategoryPicker({
  value,
  onChange,
  categories = [],
  disabled = false,
  placeholder = "Categoría",
  className = "",
  triggerClassName = "",
  id,
}) {
  const hasCategories = categories.length > 0

  // Si el activo tiene una categoría que ya no existe, se muestra igual para no
  // dejar el selector vacío; al elegir otra queda corregida.
  const options = useMemo(() => {
    if (!value || categories.some((c) => c.name === value)) return categories
    return [{ id: `legacy-${value}`, name: value, color: "from-slate-500/80 to-slate-600/80" }, ...categories]
  }, [categories, value])

  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled || !hasCategories}>
      <SelectTrigger id={id} className={`${triggerClassName} ${className}`}>
        <SelectValue placeholder={hasCategories ? placeholder : "Sin categorías"} />
      </SelectTrigger>
      <SelectContent>
        {options.map((c) => (
          <SelectItem key={c.id ?? c.name} value={c.name}>
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 bg-gradient-to-br ${c.color}`} />
              {c.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
