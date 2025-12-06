"use client"

import type React from "react"

import { useState } from "react"
import { useFinance } from "@/components/providers/finance-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Trash2Icon,
  PlusIcon,
  Loader2,
  Sparkles,
  TagIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  PiggyBankIcon,
  CoinsIcon,
  UtensilsIcon,
  CarIcon,
  HomeIcon,
  ShoppingBagIcon,
  HeartPulseIcon,
  GraduationCapIcon,
  PlaneIcon,
  WifiIcon,
  SmartphoneIcon,
  GiftIcon,
  CoffeeIcon,
  FuelIcon,
  BusIcon,
  DumbbellIcon,
  MusicIcon,
  FilmIcon,
  GamepadIcon,
  BookIcon,
  BriefcaseIcon,
  BabyIcon,
  PawPrintIcon,
  ScissorsIcon,
  ShirtIcon,
  PlugIcon,
  WrenchIcon,
  StethoscopeIcon,
  PillIcon,
  BanknoteIcon,
  ReceiptIcon,
  WalletIcon,
  LandmarkIcon,
  TrendingUp,
  PencilIcon,
} from "lucide-react"
import type { TransactionType, Category } from "@/lib/types"

const TYPES: {
  value: TransactionType
  label: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
}[] = [
  {
    value: "income",
    label: "Receita",
    icon: TrendingUpIcon,
    color: "text-green-600",
    bgColor: "bg-green-600",
    borderColor: "border-green-600/30",
  },
  {
    value: "expense",
    label: "Despesa",
    icon: TrendingDownIcon,
    color: "text-red-600",
    bgColor: "bg-red-600",
    borderColor: "border-red-600/30",
  },
  {
    value: "investment",
    label: "Investimento",
    icon: CoinsIcon,
    color: "text-blue-600",
    bgColor: "bg-blue-600",
    borderColor: "border-blue-600/30",
  },
  {
    value: "savings",
    label: "Poupança",
    icon: PiggyBankIcon,
    color: "text-orange-500",
    bgColor: "bg-orange-500",
    borderColor: "border-orange-500/30",
  },
]

const COLORS = [
  { id: "#16a34a", name: "Verde" },
  { id: "#059669", name: "Esmeralda" },
  { id: "#dc2626", name: "Vermelho" },
  { id: "#ef4444", name: "Vermelho Claro" },
  { id: "#2563eb", name: "Azul" },
  { id: "#3b82f6", name: "Azul Claro" },
  { id: "#f97316", name: "Laranja" },
  { id: "#fb923c", name: "Laranja Claro" },
  { id: "#8b5cf6", name: "Violeta" },
  { id: "#ec4899", name: "Rosa" },
]

const CATEGORY_ICONS: { id: string; icon: React.ElementType; label: string }[] = [
  { id: "utensils", icon: UtensilsIcon, label: "Alimentação" },
  { id: "coffee", icon: CoffeeIcon, label: "Café" },
  { id: "car", icon: CarIcon, label: "Carro" },
  { id: "fuel", icon: FuelIcon, label: "Combustível" },
  { id: "bus", icon: BusIcon, label: "Transporte" },
  { id: "home", icon: HomeIcon, label: "Casa" },
  { id: "plug", icon: PlugIcon, label: "Utilidades" },
  { id: "wifi", icon: WifiIcon, label: "Internet" },
  { id: "smartphone", icon: SmartphoneIcon, label: "Telemóvel" },
  { id: "shopping", icon: ShoppingBagIcon, label: "Compras" },
  { id: "shirt", icon: ShirtIcon, label: "Roupa" },
  { id: "heart", icon: HeartPulseIcon, label: "Saúde" },
  { id: "stethoscope", icon: StethoscopeIcon, label: "Médico" },
  { id: "pill", icon: PillIcon, label: "Farmácia" },
  { id: "graduation", icon: GraduationCapIcon, label: "Educação" },
  { id: "book", icon: BookIcon, label: "Livros" },
  { id: "plane", icon: PlaneIcon, label: "Viagens" },
  { id: "gift", icon: GiftIcon, label: "Presentes" },
  { id: "dumbbell", icon: DumbbellIcon, label: "Ginásio" },
  { id: "music", icon: MusicIcon, label: "Música" },
  { id: "film", icon: FilmIcon, label: "Cinema" },
  { id: "gamepad", icon: GamepadIcon, label: "Jogos" },
  { id: "briefcase", icon: BriefcaseIcon, label: "Trabalho" },
  { id: "baby", icon: BabyIcon, label: "Crianças" },
  { id: "paw", icon: PawPrintIcon, label: "Animais" },
  { id: "scissors", icon: ScissorsIcon, label: "Beleza" },
  { id: "wrench", icon: WrenchIcon, label: "Reparações" },
  { id: "banknote", icon: BanknoteIcon, label: "Salário" },
  { id: "receipt", icon: ReceiptIcon, label: "Faturas" },
  { id: "wallet", icon: WalletIcon, label: "Dinheiro" },
  { id: "landmark", icon: LandmarkIcon, label: "Banco" },
  { id: "trending", icon: TrendingUp, label: "Investimentos" },
  { id: "tag", icon: TagIcon, label: "Outros" },
]

function getCategoryIcon(iconId: string): React.ElementType {
  const found = CATEGORY_ICONS.find((i) => i.id === iconId)
  return found?.icon || TagIcon
}

function getDefaultIconForCategory(name: string): string {
  const nameLower = name.toLowerCase()
  const mappings: Record<string, string> = {
    alimentação: "utensils",
    alimentacao: "utensils",
    comida: "utensils",
    restaurante: "utensils",
    supermercado: "shopping",
    transporte: "bus",
    transportes: "bus",
    carro: "car",
    combustível: "fuel",
    combustivel: "fuel",
    gasolina: "fuel",
    casa: "home",
    habitação: "home",
    habitacao: "home",
    renda: "home",
    saúde: "heart",
    saude: "heart",
    médico: "stethoscope",
    medico: "stethoscope",
    farmácia: "pill",
    farmacia: "pill",
    educação: "graduation",
    educacao: "graduation",
    viagem: "plane",
    viagens: "plane",
    férias: "plane",
    ferias: "plane",
    roupa: "shirt",
    vestuário: "shirt",
    vestuario: "shirt",
    ginásio: "dumbbell",
    ginasio: "dumbbell",
    gym: "dumbbell",
    entretenimento: "film",
    lazer: "gamepad",
    streaming: "film",
    netflix: "film",
    spotify: "music",
    música: "music",
    musica: "music",
    internet: "wifi",
    telemóvel: "smartphone",
    telemovel: "smartphone",
    telefone: "smartphone",
    trabalho: "briefcase",
    salário: "banknote",
    salario: "banknote",
    banco: "landmark",
    poupança: "wallet",
    poupanca: "wallet",
    investimento: "trending",
    investimentos: "trending",
    presente: "gift",
    presentes: "gift",
    animais: "paw",
    pets: "paw",
    crianças: "baby",
    criancas: "baby",
    beleza: "scissors",
    cabeleireiro: "scissors",
  }

  for (const [key, icon] of Object.entries(mappings)) {
    if (nameLower.includes(key)) return icon
  }
  return "tag"
}

function getDefaultColorForType(type: TransactionType): string {
  switch (type) {
    case "income":
      return "#16a34a" // Green
    case "expense":
      return "#dc2626" // Red
    case "investment":
      return "#2563eb" // Blue
    case "savings":
      return "#f97316" // Orange
    default:
      return "#16a34a"
  }
}

function getDefaultColorForCategory(name: string, type?: TransactionType): string {
  // If type is provided, use type-based color
  if (type) {
    return getDefaultColorForType(type)
  }

  const nameLower = name.toLowerCase()

  // Income keywords - Green
  if (
    nameLower.includes("salário") ||
    nameLower.includes("salario") ||
    nameLower.includes("receita") ||
    nameLower.includes("rendimento") ||
    nameLower.includes("freelance") ||
    nameLower.includes("bonus")
  ) {
    return "#16a34a"
  }

  // Savings keywords - Orange
  if (
    nameLower.includes("poupança") ||
    nameLower.includes("poupanca") ||
    nameLower.includes("reserva") ||
    nameLower.includes("emergência")
  ) {
    return "#f97316"
  }

  // Investment keywords - Blue
  if (
    nameLower.includes("investimento") ||
    nameLower.includes("ações") ||
    nameLower.includes("acoes") ||
    nameLower.includes("etf") ||
    nameLower.includes("fundos")
  ) {
    return "#2563eb"
  }

  // Default to red for expenses
  return "#dc2626"
}

export function CategoryManager() {
  const { categories = [], addCategory, deleteCategory, updateCategory } = useFinance()
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryType, setNewCategoryType] = useState<TransactionType>("expense")
  const [newCategoryColor, setNewCategoryColor] = useState("#dc2626") // Default to red for expense
  const [newCategoryIcon, setNewCategoryIcon] = useState("tag")
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState("")

  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editName, setEditName] = useState("")
  const [editType, setEditType] = useState<TransactionType>("expense")
  const [editColor, setEditColor] = useState("#dc2626")
  const [editIcon, setEditIcon] = useState("tag")
  const [isEditing, setIsEditing] = useState(false)

  const handleTypeChange = (type: TransactionType) => {
    setNewCategoryType(type)
    setNewCategoryColor(getDefaultColorForType(type))
  }

  const handleEditTypeChange = (type: TransactionType) => {
    setEditType(type)
    setEditColor(getDefaultColorForType(type))
  }

  const handleAdd = async () => {
    if (!newCategoryName.trim()) {
      setError("Por favor insira um nome para a categoria.")
      return
    }

    setIsAdding(true)
    setError("")

    try {
      await addCategory({
        name: newCategoryName.trim(),
        type: newCategoryType,
        color: newCategoryColor,
        icon: newCategoryIcon,
      })
      setNewCategoryName("")
      setNewCategoryIcon("tag")
    } catch (err) {
      console.error("[v0] Error adding category:", err)
      setError("Erro ao adicionar categoria. Por favor tente novamente.")
    } finally {
      setIsAdding(false)
    }
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setEditName(category.name)
    setEditType(category.type)
    setEditColor(category.color || getDefaultColorForCategory(category.name, category.type))
    setEditIcon(category.icon || getDefaultIconForCategory(category.name))
  }

  const handleEdit = async () => {
    if (!editingCategory || !editName.trim()) return

    setIsEditing(true)
    try {
      await updateCategory(editingCategory.id, {
        name: editName.trim(),
        type: editType,
        color: editColor,
        icon: editIcon,
      })
      setEditingCategory(null)
    } catch (err) {
      console.error("[v0] Error updating category:", err)
    } finally {
      setIsEditing(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header Section with animated gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-16 -translate-x-16 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-white">Nova Categoria</h3>
              <p className="text-sm text-white/70">Organize as suas finanças com estilo</p>
            </div>
          </div>

          {error && (
            <div className="text-sm text-white bg-white/20 backdrop-blur-sm p-3 rounded-xl mb-4 border border-white/30">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-white/80">Nome</Label>
                <Input
                  placeholder="Ex: Ginásio, Freelance..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  disabled={isAdding}
                  className="h-12 rounded-xl border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-white/80">Tipo</Label>
                <Select value={newCategoryType} onValueChange={handleTypeChange} disabled={isAdding}>
                  <SelectTrigger className="h-12 rounded-xl border-white/20 bg-white/10 backdrop-blur-sm text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="rounded-lg">
                        <div className="flex items-center gap-2">
                          <t.icon className={`h-4 w-4 ${t.color}`} />
                          <span>{t.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-white/80">Ícone</Label>
              <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-white/10 backdrop-blur-sm max-h-32 overflow-y-auto">
                {CATEGORY_ICONS.map((iconItem) => {
                  const IconComp = iconItem.icon
                  return (
                    <button
                      key={iconItem.id}
                      type="button"
                      onClick={() => setNewCategoryIcon(iconItem.id)}
                      disabled={isAdding}
                      className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
                        newCategoryIcon === iconItem.id
                          ? "bg-white text-primary scale-110 shadow-lg"
                          : "bg-white/20 text-white hover:bg-white/30 hover:scale-105"
                      } ${isAdding ? "opacity-50 cursor-not-allowed" : ""}`}
                      title={iconItem.label}
                    >
                      <IconComp className="h-4 w-4" />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-white/80">Cor</Label>
              <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setNewCategoryColor(c.id)}
                    disabled={isAdding}
                    className={`h-8 w-8 rounded-full transition-all duration-300 ${
                      newCategoryColor === c.id
                        ? "ring-2 ring-offset-2 ring-offset-primary ring-white scale-125 shadow-lg"
                        : "hover:scale-110 opacity-80 hover:opacity-100"
                    } ${isAdding ? "opacity-50 cursor-not-allowed" : ""}`}
                    style={{ backgroundColor: c.id }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handleAdd}
              className="w-full h-12 rounded-xl font-bold bg-white text-primary hover:bg-white/90 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
              disabled={!newCategoryName.trim() || isAdding}
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />A adicionar...
                </>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Adicionar Categoria
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="flex-1 overflow-auto pr-1 space-y-6">
        {TYPES.map((type) => {
          const typeCategories = categories.filter((c) => c.type === type.value)
          if (typeCategories.length === 0) return null

          const TypeIcon = type.icon

          return (
            <div key={type.value} className="space-y-3">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl ${type.borderColor} border bg-gradient-to-r from-transparent via-card/50 to-transparent`}
              >
                <div className={`h-6 w-6 rounded-lg ${type.bgColor}/20 flex items-center justify-center`}>
                  <TypeIcon className={`h-3.5 w-3.5 ${type.color}`} />
                </div>
                <h4 className={`text-sm font-bold uppercase tracking-wider ${type.color}`}>{type.label}</h4>
                <div
                  className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${type.bgColor}/10 ${type.color}`}
                >
                  {typeCategories.length}
                </div>
              </div>

              <div className="grid gap-2 pl-2">
                {typeCategories.map((category, index) => {
                  const iconId = category.icon || getDefaultIconForCategory(category.name)
                  const color = category.color || getDefaultColorForType(category.type)
                  const CategoryIcon = getCategoryIcon(iconId)

                  return (
                    <div
                      key={category.id}
                      className="group relative flex items-center gap-3 rounded-2xl bg-card/80 hover:bg-card p-3 border border-border/50 hover:border-border transition-all duration-300 hover:shadow-md animate-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      {/* Color indicator line */}
                      <div
                        className="absolute left-0 top-2 bottom-2 w-1 rounded-full transition-all duration-300 group-hover:h-[calc(100%-8px)]"
                        style={{ backgroundColor: color }}
                      />

                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-md ml-2 transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: color }}
                      >
                        <CategoryIcon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate block">{category.name}</span>
                        <span className={`text-xs ${type.color} opacity-70`}>{type.label}</span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-300 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl"
                        onClick={() => openEditDialog(category)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-300 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                        onClick={() => deleteCategory(category.id)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-4 shadow-inner">
              <TagIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-serif font-bold text-lg mb-2">Sem categorias</h3>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Crie a sua primeira categoria para organizar as finanças.
            </p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Editar Categoria</DialogTitle>
            <DialogDescription>Atualize os detalhes da categoria.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nome da categoria"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={editType} onValueChange={handleEditTypeChange}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <t.icon className={`h-4 w-4 ${t.color}`} />
                        <span>{t.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-muted max-h-32 overflow-y-auto">
                {CATEGORY_ICONS.map((iconItem) => {
                  const IconComp = iconItem.icon
                  return (
                    <button
                      key={iconItem.id}
                      type="button"
                      onClick={() => setEditIcon(iconItem.id)}
                      className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                        editIcon === iconItem.id
                          ? "bg-primary text-primary-foreground scale-110"
                          : "bg-background hover:bg-accent"
                      }`}
                      title={iconItem.label}
                    >
                      <IconComp className="h-4 w-4" />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-muted">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setEditColor(c.id)}
                    className={`h-8 w-8 rounded-full transition-all ${
                      editColor === c.id ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.id }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setEditingCategory(null)} className="flex-1 rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={!editName.trim() || isEditing} className="flex-1 rounded-xl">
              {isEditing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
