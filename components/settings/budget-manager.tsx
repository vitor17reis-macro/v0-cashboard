"use client"

import { useFinance } from "@/components/providers/finance-provider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangleIcon, Target, Sparkles, FlameIcon, ShieldCheckIcon } from "lucide-react"
import {
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
  TagIcon,
  DropletIcon,
  ZapIcon,
  TrainIcon,
  BikeIcon,
  UmbrellaIcon,
  CreditCardIcon,
  PercentIcon,
  BuildingIcon,
  TreesIcon,
  ParkingCircleIcon,
  AnchorIcon,
  TruckIcon,
  UserIcon,
  PiggyBankIcon,
} from "lucide-react"
import type React from "react"

const ICON_MAP: Record<string, React.ElementType> = {
  utensils: UtensilsIcon,
  coffee: CoffeeIcon,
  car: CarIcon,
  fuel: FuelIcon,
  bus: BusIcon,
  home: HomeIcon,
  plug: PlugIcon,
  wifi: WifiIcon,
  smartphone: SmartphoneIcon,
  shopping: ShoppingBagIcon,
  shirt: ShirtIcon,
  heart: HeartPulseIcon,
  stethoscope: StethoscopeIcon,
  pill: PillIcon,
  graduation: GraduationCapIcon,
  book: BookIcon,
  plane: PlaneIcon,
  gift: GiftIcon,
  dumbbell: DumbbellIcon,
  music: MusicIcon,
  film: FilmIcon,
  gamepad: GamepadIcon,
  briefcase: BriefcaseIcon,
  baby: BabyIcon,
  paw: PawPrintIcon,
  scissors: ScissorsIcon,
  wrench: WrenchIcon,
  banknote: BanknoteIcon,
  receipt: ReceiptIcon,
  wallet: WalletIcon,
  landmark: LandmarkIcon,
  trending: TrendingUp,
  tag: TagIcon,
  droplet: DropletIcon,
  zap: ZapIcon,
  train: TrainIcon,
  bike: BikeIcon,
  umbrella: UmbrellaIcon,
  creditcard: CreditCardIcon,
  percent: PercentIcon,
  building: BuildingIcon,
  trees: TreesIcon,
  parking: ParkingCircleIcon,
  anchor: AnchorIcon,
  truck: TruckIcon,
}

const CATEGORY_NAME_TO_ICON: Record<string, React.ElementType> = {
  habitação: HomeIcon,
  habitacao: HomeIcon,
  casa: HomeIcon,
  renda: HomeIcon,
  aluguel: HomeIcon,
  aluguer: HomeIcon,
  hipoteca: HomeIcon,
  mortgage: HomeIcon,
  housing: HomeIcon,
  home: HomeIcon,
  rent: HomeIcon,

  alimentação: UtensilsIcon,
  alimentacao: UtensilsIcon,
  comida: UtensilsIcon,
  supermercado: ShoppingBagIcon,
  mercearia: ShoppingBagIcon,
  restaurante: UtensilsIcon,
  restaurantes: UtensilsIcon,
  food: UtensilsIcon,
  groceries: ShoppingBagIcon,
  refeições: UtensilsIcon,
  refeicoes: UtensilsIcon,

  transportes: CarIcon,
  transporte: CarIcon,
  transportation: CarIcon,
  carro: CarIcon,
  car: CarIcon,
  combustível: FuelIcon,
  combustivel: FuelIcon,
  gasolina: FuelIcon,
  fuel: FuelIcon,
  autocarro: BusIcon,
  autocarros: BusIcon,
  bus: BusIcon,
  metro: TrainIcon,
  comboio: TrainIcon,
  train: TrainIcon,
  uber: CarIcon,
  táxi: CarIcon,
  taxi: CarIcon,
  estacionamento: ParkingCircleIcon,
  parking: ParkingCircleIcon,
  bicicleta: BikeIcon,
  bike: BikeIcon,

  saúde: HeartPulseIcon,
  saude: HeartPulseIcon,
  health: HeartPulseIcon,
  médico: StethoscopeIcon,
  medico: StethoscopeIcon,
  doctor: StethoscopeIcon,
  hospital: StethoscopeIcon,
  farmácia: PillIcon,
  farmacia: PillIcon,
  pharmacy: PillIcon,
  medicamentos: PillIcon,
  medicine: PillIcon,
  dentista: StethoscopeIcon,
  dentist: StethoscopeIcon,
  ginásio: DumbbellIcon,
  ginasio: DumbbellIcon,
  gym: DumbbellIcon,
  fitness: DumbbellIcon,

  educação: GraduationCapIcon,
  educacao: GraduationCapIcon,
  education: GraduationCapIcon,
  escola: GraduationCapIcon,
  school: GraduationCapIcon,
  universidade: GraduationCapIcon,
  university: GraduationCapIcon,
  cursos: BookIcon,
  courses: BookIcon,
  livros: BookIcon,
  books: BookIcon,
  formação: GraduationCapIcon,
  formacao: GraduationCapIcon,

  entretenimento: FilmIcon,
  entertainment: FilmIcon,
  lazer: GamepadIcon,
  leisure: GamepadIcon,
  cinema: FilmIcon,
  movies: FilmIcon,
  streaming: FilmIcon,
  netflix: FilmIcon,
  spotify: MusicIcon,
  música: MusicIcon,
  musica: MusicIcon,
  music: MusicIcon,
  jogos: GamepadIcon,
  games: GamepadIcon,
  gaming: GamepadIcon,

  utilidades: PlugIcon,
  utilities: PlugIcon,
  eletricidade: ZapIcon,
  electricity: ZapIcon,
  luz: ZapIcon,
  água: DropletIcon,
  agua: DropletIcon,
  water: DropletIcon,
  gás: FlameIcon,
  gas: FlameIcon,
  internet: WifiIcon,
  telecomunicações: SmartphoneIcon,
  telecomunicacoes: SmartphoneIcon,
  telecom: SmartphoneIcon,
  telefone: SmartphoneIcon,
  phone: SmartphoneIcon,
  telemóvel: SmartphoneIcon,
  telemovel: SmartphoneIcon,
  mobile: SmartphoneIcon,

  compras: ShoppingBagIcon,
  shopping: ShoppingBagIcon,
  roupa: ShirtIcon,
  roupas: ShirtIcon,
  clothes: ShirtIcon,
  clothing: ShirtIcon,
  vestuário: ShirtIcon,
  vestuario: ShirtIcon,

  viagens: PlaneIcon,
  viagem: PlaneIcon,
  travel: PlaneIcon,
  férias: PlaneIcon,
  ferias: PlaneIcon,
  vacation: PlaneIcon,
  holiday: PlaneIcon,
  voo: PlaneIcon,
  voos: PlaneIcon,
  flights: PlaneIcon,
  hotel: BuildingIcon,
  hotéis: BuildingIcon,
  hoteis: BuildingIcon,
  hotels: BuildingIcon,

  pessoal: UserIcon,
  personal: UserIcon,
  cabeleireiro: ScissorsIcon,
  barbeiro: ScissorsIcon,
  haircut: ScissorsIcon,
  beleza: ScissorsIcon,
  beauty: ScissorsIcon,

  animais: PawPrintIcon,
  pets: PawPrintIcon,
  pet: PawPrintIcon,
  veterinário: PawPrintIcon,
  veterinario: PawPrintIcon,
  vet: PawPrintIcon,

  finanças: BanknoteIcon,
  financas: BanknoteIcon,
  finance: BanknoteIcon,
  impostos: ReceiptIcon,
  taxes: ReceiptIcon,
  irs: ReceiptIcon,
  seguros: UmbrellaIcon,
  insurance: UmbrellaIcon,
  seguro: UmbrellaIcon,
  banco: LandmarkIcon,
  bank: LandmarkIcon,
  poupança: PiggyBankIcon,
  poupanca: PiggyBankIcon,
  savings: PiggyBankIcon,
  investimentos: TrendingUp,
  investments: TrendingUp,
  dívidas: CreditCardIcon,
  dividas: CreditCardIcon,
  debt: CreditCardIcon,
  empréstimo: CreditCardIcon,
  emprestimo: CreditCardIcon,
  loan: CreditCardIcon,
  crédito: CreditCardIcon,
  credito: CreditCardIcon,
  credit: CreditCardIcon,

  presentes: GiftIcon,
  presente: GiftIcon,
  gifts: GiftIcon,
  gift: GiftIcon,
  doações: GiftIcon,
  doacoes: GiftIcon,
  donations: GiftIcon,
  caridade: GiftIcon,
  charity: GiftIcon,

  trabalho: BriefcaseIcon,
  work: BriefcaseIcon,
  escritório: BriefcaseIcon,
  escritorio: BriefcaseIcon,
  office: BriefcaseIcon,

  família: BabyIcon,
  familia: BabyIcon,
  family: BabyIcon,
  filhos: BabyIcon,
  children: BabyIcon,
  kids: BabyIcon,

  café: CoffeeIcon,
  cafe: CoffeeIcon,
  coffee: CoffeeIcon,

  manutenção: WrenchIcon,
  manutencao: WrenchIcon,
  maintenance: WrenchIcon,
  reparações: WrenchIcon,
  reparacoes: WrenchIcon,
  repairs: WrenchIcon,

  outros: TagIcon,
  other: TagIcon,
  diversos: TagIcon,
  misc: TagIcon,
  miscellaneous: TagIcon,
}

function getCategoryIcon(iconId: string | undefined, categoryName: string): React.ElementType {
  if (iconId && ICON_MAP[iconId]) {
    return ICON_MAP[iconId]
  }

  const normalizedName = categoryName.toLowerCase().trim()
  if (CATEGORY_NAME_TO_ICON[normalizedName]) {
    return CATEGORY_NAME_TO_ICON[normalizedName]
  }

  for (const [key, icon] of Object.entries(CATEGORY_NAME_TO_ICON)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return icon
    }
  }

  return TagIcon
}

export function BudgetManager() {
  const { categories = [], updateBudget, getBudgetStatus } = useFinance()
  const expenseCategories = categories.filter((c) => c.type === "expense")

  const getStatusInfo = (percentage: number) => {
    if (percentage >= 100) {
      return {
        icon: AlertTriangleIcon,
        color: "text-red-500",
        bgColor: "bg-red-500",
        bgLight: "bg-red-500/10",
        borderColor: "border-red-500/30",
        ringColor: "ring-red-500/20",
        label: "Excedido",
        gradient: "from-red-500 to-orange-500",
      }
    }
    if (percentage >= 80) {
      return {
        icon: FlameIcon,
        color: "text-amber-500",
        bgColor: "bg-amber-500",
        bgLight: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
        ringColor: "ring-amber-500/20",
        label: "Atenção",
        gradient: "from-amber-500 to-yellow-500",
      }
    }
    return {
      icon: ShieldCheckIcon,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500",
      bgLight: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      ringColor: "ring-emerald-500/20",
      label: "Saudável",
      gradient: "from-emerald-500 to-teal-500",
    }
  }

  const totalBudget = expenseCategories.reduce((acc, c) => acc + (getBudgetStatus(c.id).limit || 0), 0)
  const totalSpent = expenseCategories.reduce((acc, c) => acc + getBudgetStatus(c.id).spent, 0)
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
  const overallStatus = getStatusInfo(overallPercentage)
  const OverallIcon = overallStatus.icon

  return (
    <div className="flex flex-col h-full">
      {totalBudget > 0 && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 mb-6 text-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl animate-pulse" />
            <div
              className="absolute bottom-0 right-1/4 w-48 h-48 bg-gradient-to-br from-violet-500/20 to-transparent rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: "1s" }}
            />
          </div>

          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${overallStatus.gradient} flex items-center justify-center shadow-lg shadow-primary/25`}
                >
                  <Target className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/60 uppercase tracking-wider">Orçamento Mensal</p>
                  <h3 className="font-serif font-bold text-2xl">
                    {totalSpent.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                <OverallIcon className={`h-5 w-5 ${overallStatus.color}`} />
                <span className={`font-bold ${overallStatus.color}`}>{overallPercentage.toFixed(0)}%</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Gasto</span>
                <span className="text-white/60">
                  de {totalBudget.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                </span>
              </div>
              <div className="relative h-4 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${overallStatus.gradient} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                />
              </div>
              <div className={`flex items-center justify-center gap-2 text-sm font-medium ${overallStatus.color}`}>
                <OverallIcon className="h-4 w-4" />
                {overallStatus.label}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto pr-1 space-y-3">
        {expenseCategories.map((category, index) => {
          const status = getBudgetStatus(category.id)
          const statusInfo = getStatusInfo(status.percentage)
          const StatusIcon = statusInfo.icon
          const CategoryIcon = getCategoryIcon(category.icon, category.name)

          return (
            <div
              key={category.id}
              className={`group relative overflow-hidden rounded-2xl bg-card border ${statusInfo.borderColor} hover:border-border transition-all duration-500 hover:shadow-lg animate-in`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${statusInfo.gradient} transition-all duration-500`}
                style={{ width: `${Math.min(status.percentage, 100)}%` }}
              />

              <div className="p-4 pt-5">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{ backgroundColor: category.color }}
                  >
                    <CategoryIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label className="font-bold text-base truncate block">{category.name}</Label>
                    {status.limit > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {status.spent.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })} gasto
                      </p>
                    )}
                  </div>
                  {status.limit > 0 && (
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${statusInfo.bgLight} ${statusInfo.color} ring-1 ${statusInfo.ringColor}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {status.percentage.toFixed(0)}%
                    </div>
                  )}
                </div>

                {status.limit > 0 && (
                  <div className="mb-4">
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${statusInfo.gradient} transition-all duration-700 ease-out relative overflow-hidden`}
                        style={{ width: `${Math.min(status.percentage, 100)}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50 group-hover:border-border transition-colors">
                  <Label
                    htmlFor={`budget-${category.id}`}
                    className="text-xs text-muted-foreground whitespace-nowrap font-medium"
                  >
                    Limite Mensal
                  </Label>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                      €
                    </span>
                    <Input
                      id={`budget-${category.id}`}
                      type="number"
                      className="h-10 pl-8 text-right bg-background border-0 focus:ring-2 focus:ring-primary/20 rounded-lg font-bold"
                      placeholder="0,00"
                      defaultValue={status.limit || ""}
                      onBlur={(e) => {
                        const val = Number.parseFloat(e.target.value)
                        if (!isNaN(val) && val >= 0) {
                          updateBudget(category.id, val)
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {expenseCategories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-muted via-muted to-muted/50 flex items-center justify-center mb-6 shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <Sparkles className="h-12 w-12 text-muted-foreground relative" />
            </div>
            <h3 className="font-serif font-bold text-xl mb-2">Sem categorias</h3>
            <p className="text-sm text-muted-foreground max-w-[220px] leading-relaxed">
              Adicione categorias de despesa para poder definir os seus orçamentos mensais.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
