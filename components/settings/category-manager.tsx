"use client"

import type React from "react"

import { useState } from "react"
import { useFinance } from "@/components/providers/finance-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Trash2Icon,
  PlusIcon,
  Loader2,
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
  const [isCreateOpen, setIsCreateOpen] = useState(false) // Added dialog state for create form

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
      setNewCategoryColor(getDefaultColorForType(newCategoryType))
      setIsCreateOpen(false) // Close dialog after successful add
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
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <h2 className="text-xl font-serif font-bold">Categorias</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-white">
              <PlusIcon className="h-4 w-4" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif">Nova Categoria</DialogTitle>
              <DialogDescription>Organize as suas finanças com estilo</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {error && (
                <div className="text-sm text-white bg-red-500/20 backdrop-blur-sm p-3 rounded-xl border border-red-500/30 flex items-center gap-2">
                  <span className="font-medium">⚠️</span>
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                    Nome
                  </Label>
                  <Input
                    placeholder="Ex: Ginásio, Freelance..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    disabled={isAdding}
                    className="h-11 rounded-lg"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                    Tipo
                  </Label>
                  <Select value={newCategoryType} onValueChange={handleTypeChange} disabled={isAdding}>
                    <SelectTrigger className="h-11 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
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

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-3">
                  Ícone
                </Label>
                <div className="p-3 rounded-lg border border-border bg-muted/50 max-h-40 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_ICONS.map((iconItem) => {
                      const IconComp = iconItem.icon
                      return (
                        <button
                          key={iconItem.id}
                          type="button"
                          onClick={() => setNewCategoryIcon(iconItem.id)}
                          disabled={isAdding}
                          className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                            newCategoryIcon === iconItem.id
                              ? "bg-primary text-primary-foreground scale-110 shadow-lg ring-2 ring-primary/50"
                              : "bg-muted text-foreground hover:bg-muted/80 hover:scale-105"
                          } ${isAdding ? "opacity-50 cursor-not-allowed" : ""}`}
                          title={iconItem.label}
                        >
                          <IconComp className="h-4 w-4" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-3">
                  Cor
                </Label>
                <div className="p-3 rounded-lg border border-border bg-muted/50">
                  <div className="flex flex-wrap gap-2 justify-start">
                    {COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setNewCategoryColor(c.id)}
                        disabled={isAdding}
                        className={`h-9 w-9 rounded-full transition-all duration-200 flex-shrink-0 ${
                          newCategoryColor === c.id
                            ? "ring-3 ring-primary scale-110 shadow-lg"
                            : "hover:scale-105 opacity-70 hover:opacity-100 shadow-sm"
                        } ${isAdding ? "opacity-50 cursor-not-allowed" : ""}`}
                        style={{ backgroundColor: c.id }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isAdding}
                  className="flex-1 h-11 rounded-lg"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={!newCategoryName.trim() || isAdding}
                  className="flex-1 h-11 rounded-lg font-bold"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Adicionar Categoria
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-auto pr-1 space-y-6">
        {TYPES.map((type) => {
          const typeCategories = categories.filter((c) => c.type === type.value)
          if (typeCategories.length === 0) return null

          const TypeIcon = type.icon

          return (
            <div key={type.value} className="space-y-3">
              <div
                className={`flex items-center gap-2 px-4 py-3 rounded-xl ${type.borderColor} border-2 bg-gradient-to-r from-transparent via-card/50 to-transparent shadow-sm`}
              >
                <div className={`h-8 w-8 rounded-xl ${type.bgColor}/20 flex items-center justify-center`}>
                  <TypeIcon className={`h-4 w-4 ${type.color}`} />
                </div>
                <h4 className={`text-sm font-bold uppercase tracking-wider ${type.color}`}>{type.label}</h4>
                <div
                  className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${type.bgColor}/10 ${type.color} border ${type.borderColor}`}
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
                      className="group relative flex items-center gap-3 rounded-2xl bg-card/80 hover:bg-card p-4 border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg animate-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div
                        className="absolute left-0 top-3 bottom-3 w-1.5 rounded-full transition-all duration-300"
                        style={{ backgroundColor: color }}
                      />

                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-lg ml-2 transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: color }}
                      >
                        <CategoryIcon className="h-6 w-6" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="font-semibold truncate block text-base">{category.name}</span>
                        <span className={`text-xs ${type.color} opacity-70`}>{type.label}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-all duration-300 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl"
                          onClick={() => openEditDialog(category)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-all duration-300 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                          onClick={() => deleteCategory(category.id)}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif">Editar Categoria</DialogTitle>
            <DialogDescription>Modifique os detalhes da sua categoria</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={isEditing}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</Label>
                <Select value={editType} onValueChange={handleEditTypeChange} disabled={isEditing}>
                  <SelectTrigger className="h-12 rounded-xl">
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
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ícone</Label>
              <div className="p-4 rounded-xl bg-muted/50 border">
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2">
                  {CATEGORY_ICONS.map((iconItem) => {
                    const IconComp = iconItem.icon
                    return (
                      <button
                        key={iconItem.id}
                        type="button"
                        onClick={() => setEditIcon(iconItem.id)}
                        disabled={isEditing}
                        className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          editIcon === iconItem.id
                            ? "bg-primary text-primary-foreground scale-110 shadow-lg ring-2 ring-primary/50"
                            : "bg-muted hover:bg-muted/80 hover:scale-105"
                        } ${isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
                        title={iconItem.label}
                      >
                        <IconComp className="h-5 w-5" />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cor</Label>
              <div className="p-4 rounded-xl bg-muted/50 border">
                <div className="flex flex-wrap gap-3 justify-center">
                  {COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setEditColor(c.id)}
                      disabled={isEditing}
                      className={`h-10 w-10 rounded-full transition-all duration-300 ${
                        editColor === c.id
                          ? "ring-4 ring-primary scale-125 shadow-2xl"
                          : "hover:scale-110 opacity-80 hover:opacity-100 shadow-md"
                      } ${isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
                      style={{ backgroundColor: c.id }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditingCategory(null)}
                disabled={isEditing}
                className="flex-1 h-12 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEdit}
                disabled={!editName.trim() || isEditing}
                className="flex-1 h-12 rounded-xl font-bold"
              >
                {isEditing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />A guardar...
                  </>
                ) : (
                  "Guardar Alterações"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
