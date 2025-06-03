"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Calendar,
  Clock,
  User,
  UserCheck,
  Stethoscope,
  Heart,
  Brain,
  Eye,
  Plus,
  Trash2,
  X,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit,
  CheckCircle,
  Search,
  DollarSign,
  AlertTriangle,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type UserType = "medico" | "paciente" | null
type ViewType = "home" | "login-medico" | "login-paciente" | "cadastro-paciente" | "dashboard"

interface Medico {
  id: number
  nome: string
  especialidade: string
  crm: string
  valor: number
  icon: any
  datasDisponiveis: DataDisponivel[]
}

interface DataDisponivel {
  id: number
  data: string // YYYY-MM-DD
  horarios: string[] // ["09:00", "10:00", "11:00"]
  horariosOcupados: string[] // ["10:00"] horários já agendados
}

interface Consulta {
  id: number
  medicoId: number
  medico: string
  especialidade: string
  paciente: string
  data: string
  hora: string
  status: "agendada" | "confirmada" | "realizada" | "cancelada"
  valor: number
}

export default function MedicalSystem() {
  const [currentView, setCurrentView] = useState<ViewType>("home")
  const [currentUser, setCurrentUser] = useState<UserType>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("medicos")
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [cadastroForm, setCadastroForm] = useState({
    nome: "",
    sobrenome: "",
    email: "",
    telefone: "",
    password: "",
    confirmPassword: "",
  })
  const [selectedMedico, setSelectedMedico] = useState<Medico | null>(null)
  const [selectedData, setSelectedData] = useState<string>("")
  const [selectedHorario, setSelectedHorario] = useState<string>("")
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [novaData, setNovaData] = useState({
    data: "",
    horarios: [""],
  })
  const [editandoData, setEditandoData] = useState<DataDisponivel | null>(null)
  const [editandoValor, setEditandoValor] = useState<number | null>(null)
  const [novoValor, setNovoValor] = useState<string>("")
  const [filtroTipo, setFiltroTipo] = useState<"dia" | "mes" | "ano">("mes")
  const [filtroValor, setFiltroValor] = useState<string>("")
  const [showAlert, setShowAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [showConfirmacao, setShowConfirmacao] = useState(false)

  // Dados simulados
  const [medicos, setMedicos] = useState<Medico[]>([
    {
      id: 1,
      nome: "Dr. João Silva",
      especialidade: "Cardiologia",
      crm: "12345-SP",
      valor: 150.0,
      icon: Heart,
      datasDisponiveis: [
        {
          id: 1,
          data: "2024-01-15",
          horarios: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
          horariosOcupados: ["10:00"],
        },
        {
          id: 2,
          data: "2024-01-17",
          horarios: ["09:00", "10:00", "11:00", "14:00", "15:00"],
          horariosOcupados: [],
        },
        {
          id: 3,
          data: "2024-01-22",
          horarios: ["08:00", "09:00", "10:00", "11:00"],
          horariosOcupados: [],
        },
        {
          id: 4,
          data: "2024-01-24",
          horarios: ["14:00", "15:00", "16:00", "17:00"],
          horariosOcupados: ["15:00"],
        },
      ],
    },
    {
      id: 2,
      nome: "Dra. Maria Santos",
      especialidade: "Neurologia",
      crm: "67890-SP",
      valor: 180.0,
      icon: Brain,
      datasDisponiveis: [
        {
          id: 5,
          data: "2024-01-16",
          horarios: ["09:00", "10:00", "11:00", "13:00", "14:00"],
          horariosOcupados: [],
        },
        {
          id: 6,
          data: "2024-01-18",
          horarios: ["13:00", "14:00", "15:00", "16:00"],
          horariosOcupados: ["14:00"],
        },
        {
          id: 7,
          data: "2024-01-23",
          horarios: ["09:00", "10:00", "11:00"],
          horariosOcupados: [],
        },
      ],
    },
    {
      id: 3,
      nome: "Dr. Pedro Costa",
      especialidade: "Oftalmologia",
      crm: "54321-SP",
      valor: 120.0,
      icon: Eye,
      datasDisponiveis: [
        {
          id: 8,
          data: "2024-01-16",
          horarios: ["08:00", "09:00", "10:00", "11:00"],
          horariosOcupados: [],
        },
        {
          id: 9,
          data: "2024-01-19",
          horarios: ["08:00", "09:00", "10:00"],
          horariosOcupados: [],
        },
      ],
    },
  ])

  const [consultas, setConsultas] = useState<Consulta[]>([
    {
      id: 1,
      medicoId: 1,
      medico: "Dr. João Silva",
      especialidade: "Cardiologia",
      paciente: "Ana Costa",
      data: "2024-01-15",
      hora: "10:00",
      status: "agendada",
      valor: 150,
    },
    {
      id: 2,
      medicoId: 2,
      medico: "Dra. Maria Santos",
      especialidade: "Neurologia",
      paciente: "Carlos Silva",
      data: "2024-01-18",
      hora: "14:00",
      status: "confirmada",
      valor: 180,
    },
    {
      id: 3,
      medicoId: 1,
      medico: "Dr. João Silva",
      especialidade: "Cardiologia",
      paciente: "Maria Oliveira",
      data: "2024-01-24",
      hora: "15:00",
      status: "agendada",
      valor: 150,
    },
  ])

  const showAlertMessage = (type: "success" | "error", message: string) => {
    setShowAlert({ type, message })
    setTimeout(() => setShowAlert(null), 4000)
  }

  const voltarParaInicio = () => {
    setCurrentView("home")
    setCurrentUser(null)
    setCurrentUserId(null)
    setActiveTab("medicos")
  }

  const handleLogin = (tipo: UserType) => {
    if (loginForm.email && loginForm.password) {
      setCurrentUser(tipo)
      setCurrentUserId(tipo === "medico" ? 1 : 1)
      setCurrentView("dashboard")
      showAlertMessage("success", "Login realizado com sucesso!")
    }
  }

  const handleCadastro = () => {
    if (cadastroForm.password !== cadastroForm.confirmPassword) {
      showAlertMessage("error", "Senhas não conferem!")
      return
    }
    if (cadastroForm.nome && cadastroForm.email && cadastroForm.password) {
      setCurrentUser("paciente")
      setCurrentUserId(1)
      setCurrentView("dashboard")
      showAlertMessage("success", "Cadastro realizado com sucesso!")
    }
  }

  const handleAgendarConsulta = () => {
    if (selectedMedico && selectedData && selectedHorario) {
      const novaConsulta: Consulta = {
        id: consultas.length + 1,
        medicoId: selectedMedico.id,
        medico: selectedMedico.nome,
        especialidade: selectedMedico.especialidade,
        paciente: "Você",
        data: selectedData,
        hora: selectedHorario,
        status: "agendada",
        valor: selectedMedico.valor,
      }

      setConsultas([...consultas, novaConsulta])

      // Marcar horário como ocupado
      setMedicos(
        medicos.map((m) =>
          m.id === selectedMedico.id
            ? {
                ...m,
                datasDisponiveis: m.datasDisponiveis.map((d) =>
                  d.data === selectedData ? { ...d, horariosOcupados: [...d.horariosOcupados, selectedHorario] } : d,
                ),
              }
            : m,
        ),
      )

      // Mostrar confirmação e redirecionar
      setShowConfirmacao(true)
      setTimeout(() => {
        setShowConfirmacao(false)
        setSelectedMedico(null)
        setSelectedData("")
        setSelectedHorario("")
        setActiveTab("consultas")
        showAlertMessage("success", "Consulta agendada com sucesso! Você foi redirecionado para seus agendamentos.")
      }, 2000)
    }
  }

  const handleCancelarConsulta = (consultaId: number) => {
    const consulta = consultas.find((c) => c.id === consultaId)
    if (consulta) {
      // Liberar horário
      setMedicos(
        medicos.map((m) =>
          m.id === consulta.medicoId
            ? {
                ...m,
                datasDisponiveis: m.datasDisponiveis.map((d) =>
                  d.data === consulta.data
                    ? { ...d, horariosOcupados: d.horariosOcupados.filter((h) => h !== consulta.hora) }
                    : d,
                ),
              }
            : m,
        ),
      )
    }

    setConsultas(consultas.map((c) => (c.id === consultaId ? { ...c, status: "cancelada" as const } : c)))
    showAlertMessage("success", "Consulta cancelada com sucesso!")
  }

  const handleAtualizarValorConsulta = () => {
    if (editandoValor && novoValor && currentUserId) {
      const valor = Number.parseFloat(novoValor)
      if (valor > 0) {
        setMedicos(medicos.map((m) => (m.id === currentUserId ? { ...m, valor: valor } : m)))
        setEditandoValor(null)
        setNovoValor("")
        showAlertMessage("success", "Valor da consulta atualizado com sucesso!")
      } else {
        showAlertMessage("error", "Valor deve ser maior que zero!")
      }
    }
  }

  const handleAdicionarDataDisponivel = () => {
    if (novaData.data && novaData.horarios.some((h) => h.trim() !== "") && currentUserId) {
      const horariosValidos = novaData.horarios.filter((h) => h.trim() !== "").sort()

      const novaDataDisponivel: DataDisponivel = {
        id: Date.now(),
        data: novaData.data,
        horarios: horariosValidos,
        horariosOcupados: [],
      }

      setMedicos(
        medicos.map((m) =>
          m.id === currentUserId ? { ...m, datasDisponiveis: [...m.datasDisponiveis, novaDataDisponivel] } : m,
        ),
      )

      setNovaData({ data: "", horarios: [""] })
      showAlertMessage("success", "Data disponível adicionada com sucesso!")
    }
  }

  const handleEditarDataDisponivel = () => {
    if (editandoData && currentUserId) {
      const horariosValidos = editandoData.horarios.filter((h) => h.trim() !== "").sort()

      setMedicos(
        medicos.map((m) =>
          m.id === currentUserId
            ? {
                ...m,
                datasDisponiveis: m.datasDisponiveis.map((d) =>
                  d.id === editandoData.id ? { ...editandoData, horarios: horariosValidos } : d,
                ),
              }
            : m,
      ),
    )

    setEditandoData(null)
    showAlertMessage("success", "Data atualizada com sucesso!")
  }

  const handleRemoverDataDisponivel = (dataId: number) => {
    if (currentUserId) {
      // Verificar se há consultas agendadas nesta data
      const dataDisponivel = medicos.find((m) => m.id === currentUserId)?.datasDisponiveis.find((d) => d.id === dataId)

      if (dataDisponivel && dataDisponivel.horariosOcupados.length > 0) {
        // Cancelar todas as consultas desta data
        const consultasParaCancelar = consultas.filter(
          (c) => c.medicoId === currentUserId && c.data === dataDisponivel.data && c.status !== "cancelada",
        )

        if (consultasParaCancelar.length > 0) {
          setConsultas(
            consultas.map((c) =>
              consultasParaCancelar.some((cc) => cc.id === c.id) ? { ...c, status: "cancelada" as const } : c,
            ),
          )
          showAlertMessage(
            "success",
            `Data removida e ${consultasParaCancelar.length} consulta(s) cancelada(s) automaticamente!`,
          )
        }
      }

      setMedicos(
        medicos.map((m) =>
          m.id === currentUserId ? { ...m, datasDisponiveis: m.datasDisponiveis.filter((d) => d.id !== dataId) } : m,
        ),
      )

      if (!dataDisponivel?.horariosOcupados.length) {
        showAlertMessage("success", "Data removida com sucesso!")
      }
    }
  }

  const handleRemoverHorarioEspecifico = (dataId: number, horario: string) => {
    if (currentUserId) {
      const dataDisponivel = medicos.find((m) => m.id === currentUserId)?.datasDisponiveis.find((d) => d.id === dataId)

      if (dataDisponivel) {
        // Verificar se o horário está ocupado
        const isOcupado = dataDisponivel.horariosOcupados.includes(horario)

        if (isOcupado) {
          // Cancelar a consulta deste horário
          const consultaParaCancelar = consultas.find(
            (c) =>
              c.medicoId === currentUserId &&
              c.data === dataDisponivel.data &&
              c.hora === horario &&
              c.status !== "cancelada",
          )

          if (consultaParaCancelar) {
            setConsultas(
              consultas.map((c) => (c.id === consultaParaCancelar.id ? { ...c, status: "cancelada" as const } : c)),
            )
            showAlertMessage("success", "Horário removido e consulta cancelada automaticamente!")
          }
        }

        // Remover o horário da lista
        setMedicos(
          medicos.map((m) =>
            m.id === currentUserId
              ? {
                  ...m,
                  datasDisponiveis: m.datasDisponiveis.map((d) =>
                    d.id === dataId
                      ? {
                          ...d,
                          horarios: d.horarios.filter((h) => h !== horario),
                          horariosOcupados: d.horariosOcupados.filter((h) => h !== horario),
                        }
                      : d,
                  ),
                }
              : m,
          ),
        )

        if (!isOcupado) {
          showAlertMessage("success", "Horário removido com sucesso!")
        }
      }
    }
  }

  const adicionarHorario = (isEditing = false) => {
    if (isEditing && editandoData) {
      setEditandoData({ ...editandoData, horarios: [...editandoData.horarios, ""] })
    } else {
      setNovaData({ ...novaData, horarios: [...novaData.horarios, ""] })
    }
  }

  const removerHorario = (index: number, isEditing = false) => {
    if (isEditing && editandoData) {
      setEditandoData({
        ...editandoData,
        horarios: editandoData.horarios.filter((_, i) => i !== index),
      })
    } else {
      setNovaData({
        ...novaData,
        horarios: novaData.horarios.filter((_, i) => i !== index),
      })
    }
  }

  const atualizarHorario = (index: number, valor: string, isEditing = false) => {
    if (isEditing && editandoData) {
      const novosHorarios = [...editandoData.horarios]
      novosHorarios[index] = valor
      setEditandoData({ ...editandoData, horarios: novosHorarios })
    } else {
      const novosHorarios = [...novaData.horarios]
      novosHorarios[index] = valor
      setNovaData({ ...novaData, horarios: novosHorarios })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "agendada":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "confirmada":
        return "bg-green-500 hover:bg-green-600"
      case "realizada":
        return "bg-blue-500 hover:bg-blue-600"
      case "cancelada":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const formatarData = (data: string) => {
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatarDataCurta = (data: string) => {
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR")
  }

  const isDataDisponivel = (medico: Medico, data: string) => {
    return medico.datasDisponiveis.some((d) => d.data === data)
  }

  const getHorariosDisponiveis = (medico: Medico, data: string) => {
    const dataDisponivel = medico.datasDisponiveis.find((d) => d.data === data)
    if (!dataDisponivel) return []

    return dataDisponivel.horarios.filter((h) => !dataDisponivel.horariosOcupados.includes(h))
  }

  const generateCalendarDays = (medico: Medico) => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)

      const dateString = date.toISOString().split("T")[0]
      const isCurrentMonth = date.getMonth() === month
      const isPast = date < today
      const isAvailable = isDataDisponivel(medico, dateString)
      const hasAvailableSlots = getHorariosDisponiveis(medico, dateString).length > 0

      days.push({
        date: date,
        dateString: dateString,
        day: date.getDate(),
        isCurrentMonth,
        isPast,
        isAvailable: isAvailable && hasAvailableSlots && !isPast,
        isToday: date.toDateString() === today.toDateString(),
      })
    }

    return days
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const validarConflitosHorarios = (novoHorario: string, data: string, horarioAtual?: string): boolean => {
    if (!currentUserId) return false
    
    const medico = medicos.find(m => m.id === currentUserId)
    if (!medico) return false
    
    const dataDisponivel = medico.datasDisponiveis.find(d => d.data === data)
    if (!dataDisponivel) return false
    
    const novoHorarioMinutos = converterHorarioParaMinutos(novoHorario)
    
    for (const horario of dataDisponivel.horarios) {
      if (horario === horarioAtual) continue // Ignorar o próprio horário na edição
      
      const horarioExistenteMinutos = converterHorarioParaMinutos(horario)
      const diferenca = Math.abs(novoHorarioMinutos - horarioExistenteMinutos)
      
      if (diferenca < 15) {
        return false // Conflito encontrado
      }
    }
    
    return true // Sem conflitos
  }

  const converterHorarioParaMinutos = (horario: string): number => {
    const [horas, minutos] = horario.split(':').map(Number)
    return horas * 60 + minutos
  }

  // Dashboard
  let currentMedico = currentUser === "medico" ? medicos.find((m) => m.id === currentUserId) : null
  let minhasConsultas =
    currentUser === "paciente"
      ? consultas.filter((c) => c.paciente === "Você")
      : consultas.filter((c) => c.medicoId === currentUserId)

  // Filtrar consultas por data
  const consultasFiltradas = minhasConsultas.filter((consulta) => {
    if (!filtroValor) return true
    
    const dataConsulta = new Date(consulta.data + "T00:00:00")
    
    switch (filtroTipo) {
      case "dia":
        return consulta.data === filtroValor
      case "mes":
        const [ano, mes] = filtroValor.split('-')
        return dataConsulta.getFullYear() === Number.parseInt(ano) && 
               (dataConsulta.getMonth() + 1) === Number.parseInt(mes)
      case "ano":
        return dataConsulta.getFullYear() === Number.parseInt(filtroValor)
      default:
        return true
    }
  })

  if (currentView === "home") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center cursor-pointer" onClick={voltarParaInicio}>
                <Stethoscope className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                  Mauro Medical Consultations
                </h1>
              </div>
              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setCurrentView("login-medico")} className="hover:bg-blue-50">
                  Área Médica
                </Button>
                <Button onClick={() => setCurrentView("login-paciente")} className="bg-blue-600 hover:bg-blue-700">
                  Área do Paciente
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Agende sua consulta médica
              <span className="text-blue-600"> online</span>
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
              Encontre os melhores especialistas e agende sua consulta de forma rápida, segura e conveniente
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setCurrentView("cadastro-paciente")}
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
              >
                Cadastre-se Grátis
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setCurrentView("login-paciente")}
                className="text-lg px-8 py-3 border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Já tenho conta
              </Button>
            </div>
          </div>

          {/* Especialidades */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {medicos.map((medico) => {
              const IconComponent = medico.icon
              return (
                <Card
                  key={medico.id}
                  className="text-center hover:shadow-xl transition-all duration-300 border-0 shadow-lg"
                >
                  <CardContent className="p-8">
                    <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                      <IconComponent className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-900">{medico.especialidade}</h3>
                    <p className="text-gray-600 mb-6">{medico.nome}</p>
                    <p className="text-3xl font-bold text-green-600">R$ {medico.valor.toFixed(2)}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Agendamento Online</h3>
              <p className="text-gray-600">Agende suas consultas 24h por dia, 7 dias por semana</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Médicos Qualificados</h3>
              <p className="text-gray-600">Profissionais experientes e especializados</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Horários Flexíveis</h3>
              <p className="text-gray-600">Diversos horários disponíveis para sua conveniência</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (currentView === "login-medico") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl text-gray-900">Área Médica</CardTitle>
            <CardDescription className="text-gray-600">Acesse sua conta profissional</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-gray-700">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="mt-1"
              />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleLogin("medico")}>
              Entrar
            </Button>
            <div className="text-center">
              <Button variant="link" onClick={voltarParaInicio} className="text-blue-600">
                Voltar ao início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentView === "login-paciente") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-gray-900">Área do Paciente</CardTitle>
            <CardDescription className="text-gray-600">Acesse sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-gray-700">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="mt-1"
              />
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleLogin("paciente")}>
              Entrar
            </Button>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Não tem conta?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-green-600"
                  onClick={() => setCurrentView("cadastro-paciente")}
                >
                  Cadastre-se aqui
                </Button>
              </p>
              <Button variant="link" onClick={voltarParaInicio} className="text-blue-600">
                Voltar ao início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentView === "cadastro-paciente") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-gray-900">Criar Conta</CardTitle>
            <CardDescription className="text-gray-600">Cadastre-se para agendar consultas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome" className="text-gray-700">
                  Nome
                </Label>
                <Input
                  id="nome"
                  placeholder="João"
                  value={cadastroForm.nome}
                  onChange={(e) => setCadastroForm({ ...cadastroForm, nome: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sobrenome" className="text-gray-700">
                  Sobrenome
                </Label>
                <Input
                  id="sobrenome"
                  placeholder="Silva"
                  value={cadastroForm.sobrenome}
                  onChange={(e) => setCadastroForm({ ...cadastroForm, sobrenome: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email" className="text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={cadastroForm.email}
                onChange={(e) => setCadastroForm({ ...cadastroForm, email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="telefone" className="text-gray-700">
                Telefone
              </Label>
              <Input
                id="telefone"
                placeholder="(11) 99999-9999"
                value={cadastroForm.telefone}
                onChange={(e) => setCadastroForm({ ...cadastroForm, telefone: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-gray-700">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={cadastroForm.password}
                onChange={(e) => setCadastroForm({ ...cadastroForm, password: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-gray-700">
                Confirmar Senha
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={cadastroForm.confirmPassword}
                onChange={(e) => setCadastroForm({ ...cadastroForm, confirmPassword: e.target.value })}
                className="mt-1"
              />
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleCadastro}>
              Criar Conta
            </Button>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Já tem conta?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-green-600"
                  onClick={() => setCurrentView("login-paciente")}
                >
                  Entre aqui
                </Button>
              </p>
              <Button variant="link" onClick={voltarParaInicio} className="text-blue-600">
                Voltar ao início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Dashboard
  currentMedico = currentUser === "medico" ? medicos.find((m) => m.id === currentUserId) : null
  minhasConsultas =
    currentUser === "paciente"
      ? consultas.filter((c) => c.paciente === "Você")
      : consultas.filter((c) => c.medicoId === currentUserId)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center cursor-pointer" onClick={voltarParaInicio}>
              <Stethoscope className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                Mauro Medical Consultations
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-sm px-3 py-1">
                {currentUser === "medico" ? currentMedico?.nome : "Paciente"}
              </Badge>
              <Button variant="outline" onClick={voltarParaInicio} className="hover:bg-red-50 hover:text-red-600">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Alerts */}
      {showAlert && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Alert className={showAlert.type === "success" ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
            <AlertDescription className={showAlert.type === "success" ? "text-green-700" : "text-red-700"}>
              {showAlert.message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Modal de Confirmação */}
      {showConfirmacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Consulta Agendada!</h3>
            <p className="text-gray-600 mb-4">
              Sua consulta foi agendada com sucesso. Você será redirecionado para seus agendamentos.
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentUser === "medico" ? (
          // Dashboard Médico
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Consultas este Mês</p>
                      <p className="text-3xl font-bold text-blue-600">{minhasConsultas.length}</p>
                    </div>
                    <div className="bg-blue-100 rounded-full p-3">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Datas Disponíveis</p>
                      <p className="text-3xl font-bold text-green-600">{currentMedico?.datasDisponiveis.length || 0}</p>
                    </div>
                    <div className="bg-green-100 rounded-full p-3">
                      <CalendarDays className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Valor por Consulta</p>
                      <p className="text-3xl font-bold text-purple-600">R$ {currentMedico?.valor}</p>
                    </div>
                    <div className="bg-purple-100 rounded-full p-3">
                      <Heart className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Alterar Valor</p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditandoValor(currentMedico?.id || null)
                              setNovoValor(currentMedico?.valor.toString() || "")
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Alterar Valor da Consulta</DialogTitle>
                            <DialogDescription>Defina o novo valor para suas consultas</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Novo Valor (R$)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={novoValor}
                                onChange={(e) => setNovoValor(e.target.value)}
                                placeholder="150.00"
                                className="mt-1"
                              />
                            </div>
                            <Button onClick={handleAtualizarValorConsulta} className="w-full">
                              <DollarSign className="h-4 w-4 mr-2" />
                              Atualizar Valor
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="bg-orange-100 rounded-full p-3">
                      <DollarSign className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="consultas" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="consultas">Consultas</TabsTrigger>
                <TabsTrigger value="agenda">Gerenciar Agenda</TabsTrigger>
              </TabsList>

              <TabsContent value="consultas">
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-gray-900">Minhas Consultas</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-gray-500" />
                        <select
                          value={filtroTipo}
                          onChange={(e) => {
                            setFiltroTipo(e.target.value as "dia" | "mes" | "ano")
                            setFiltroValor("")
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="mes">Por Mês</option>
                          <option value="dia">Por Dia</option>
                          <option value="ano">Por Ano</option>
                        </select>
                        
                        {filtroTipo === "dia" && (
                          <Input
                            type="date"
                            value={filtroValor}
                            onChange={(e) => setFiltroValor(e.target.value)}
                            className="w-48"
                          />
                        )}
                        
                        {filtroTipo === "mes" && (
                          <Input
                            type="month"
                            value={filtroValor}
                            onChange={(e) => setFiltroValor(e.target.value)}
                            className="w-48"
                          />
                        )}
                        
                        {filtroTipo === "ano" && (
                          <Input
                            type="number"
                            min="2020"
                            max="2030"
                            value={filtroValor}
                            onChange={(e) => setFiltroValor(e.target.value)}
                            placeholder="2024"
                            className="w-48"
                          />
                        )}
                        
                        {filtroValor && (
                          <Button variant="outline" size="sm" onClick={() => setFiltroValor("")}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {filtroValor && (
                      <p className="text-sm text-gray-600">
                        Mostrando consultas para {
                          filtroTipo === "dia" ? formatarDataCurta(filtroValor) :
                          filtroTipo === "mes" ? `${filtroValor.split('-')[1]}/${filtroValor.split('-')[0]}` :
                          filtroValor
                        } ({consultasFiltradas.length} encontrada(s))
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {consultasFiltradas.map((consulta) => (
                        <div
                          key={consulta.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">{consulta.paciente}</p>
                            <p className="text-sm text-gray-600">
                              {formatarDataCurta(consulta.data)} às {consulta.hora}
                            </p>
                            <p className="text-sm text-green-600 font-medium">R$ {consulta.valor.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={`${getStatusColor(consulta.status)} text-white`}>{consulta.status}</Badge>
                            {(consulta.status === "agendada" || consulta.status === "confirmada") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelarConsulta(consulta.id)}
                                className="hover:bg-red-50 hover:text-red-600"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {consultasFiltradas.length === 0 && (
                        <div className="text-center py-12">
                          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">
                            {filtroValor ? "Nenhuma consulta encontrada para esta data" : "Nenhuma consulta agendada"}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="agenda">
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Adicionar Data Disponível */}
                  <Card className="shadow-lg border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center text-gray-900">
                        <Plus className="h-5 w-5 mr-2" />
                        Adicionar Data Disponível
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-gray-700">Data</Label>
                        <Input
                          type="date"
                          value={novaData.data}
                          onChange={(e) => setNovaData({ ...novaData, data: e.target.value })}
                          min={new Date().toISOString().split("T")[0]}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-gray-700">Horários Disponíveis</Label>
                        <div className="space-y-2 mt-2">
                          {novaData.horarios.map((horario, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                type="time"
                                value={horario}
                                onChange={(e) => {
                                  const novoHorario = e.target.value
                                  if (novoHorario && !validarConflitosHorarios(novoHorario, novaData.data)) {
                                    showAlertMessage("error", "Horário deve ter pelo menos 15 minutos de diferença dos existentes!")
                                    return
                                  }
                                  atualizarHorario(index, novoHorario)
                                }}
                                placeholder="Ex: 09:00"
                              />
                              {novaData.horarios.length > 1 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removerHorario(index)}
                                  className="hover:bg-red-50 hover:text-red-600"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={() => adicionarHorario()} className="w-full">
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar Horário
                          </Button>
                        </div>
                      </div>

                      <Button onClick={handleAdicionarDataDisponivel} className="w-full bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Data
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Lista de Datas Disponíveis */}
                  <Card className="shadow-lg border-0">
                    <CardHeader>
                      <CardTitle className="text-gray-900">Datas Disponíveis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {currentMedico?.datasDisponiveis.map((data) => (
                          <div key={data.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <p className="font-medium text-gray-900">{formatarDataCurta(data.data)}</p>
                              <div className="flex space-x-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => setEditandoData(data)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Editar Data Disponível</DialogTitle>
                                      <DialogDescription>{formatarDataCurta(data.data)}</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label>Horários Disponíveis</Label>
                                        <div className="space-y-2 mt-2">
                                          {editandoData?.horarios.map((horario, index) => (
                                            <div key={index} className="flex gap-2">
                                              <Input
                                                type="time"
                                                value={horario}
                                                onChange={(e) => {
                                                  const novoHorario = e.target.value
                                                  if (novoHorario && !validarConflitosHorarios(novoHorario, editandoData.data, horario)) {
                                                    showAlertMessage("error", "Horário deve ter pelo menos 15 minutos de diferença dos existentes!")
                                                    return
                                                  }
                                                  atualizarHorario(index, novoHorario, true)
                                                }}
                                                disabled={editandoData.horariosOcupados.includes(horario)}
                                                className={editandoData.horariosOcupados.includes(horario) ? "bg-red-50 cursor-not-allowed" : ""}
                                              />
                                              {editandoData.horarios.length > 1 && (
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => removerHorario(index, true)}
                                                >
                                                  <X className="h-4 w-4" />
                                                </Button>
                                              )}
                                            </div>
                                          ))}
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => adicionarHorario(true)}
                                            className="w-full"
                                          >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Adicionar Horário
                                          </Button>
                                        </div>
                                      </div>
                                      <Button onClick={handleEditarDataDisponivel} className="w-full">
                                        Salvar Alterações
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoverDataDisponivel(data.id)}
                                  className="hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {data.horarios.map((horario) => (
                                <div key={horario} className="flex items-center">
                                  <Badge
                                    className={
                                      data.horariosOcupados.includes(horario)
                                        ? "bg-red-100 text-red-700 border-red-200"
                                        : "bg-green-100 text-green-700 border-green-200"
                                    }
                                  >
                                    {horario}
                                    {data.horariosOcupados.includes(horario) && (
                                      <span className="ml-1 text-xs">(Ocupado)</span>
                                    )}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoverHorarioEspecifico(data.id, horario)}
                                    className="ml-1 h-6 w-6 p-0 hover:bg-red-100"
                                  >
                                    <X className="h-3 w-3 text-red-500" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            {data.horariosOcupados.length > 0 && (
                              <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                                <div className="flex items-center text-yellow-700 text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Remover horários ocupados cancelará as consultas automaticamente
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        {(!currentMedico?.datasDisponiveis || currentMedico.datasDisponiveis.length === 0) && (
                          <div className="text-center py-8">
                            <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Nenhuma data disponível cadastrada</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          // Dashboard Paciente
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="medicos">Agendar Consulta</TabsTrigger>
                <TabsTrigger value="consultas">Minhas Consultas</TabsTrigger>
              </TabsList>

              <TabsContent value="medicos">
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Médicos Disponíveis</CardTitle>
                    <CardDescription>Escolha um médico e veja suas datas disponíveis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {medicos.map((medico) => {
                        const IconComponent = medico.icon
                        return (
                          <Card
                            key={medico.id}
                            className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg"
                          >
                            <CardContent className="p-6">
                              <div className="text-center">
                                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                  <IconComponent className="h-8 w-8 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2 text-gray-900">{medico.nome}</h3>
                                <p className="text-gray-600 mb-2">{medico.especialidade}</p>
                                <p className="text-sm text-gray-500 mb-4">CRM: {medico.crm}</p>
                                <p className="text-2xl font-bold text-green-600 mb-6">R$ {medico.valor.toFixed(2)}</p>

                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      className="w-full bg-blue-600 hover:bg-blue-700"
                                      onClick={() => setSelectedMedico(medico)}
                                    >
                                      <CalendarDays className="h-4 w-4 mr-2" />
                                      Ver Agenda
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Agendar com {medico.nome}</DialogTitle>
                                      <DialogDescription>
                                        {medico.especialidade} - R$ {medico.valor.toFixed(2)}
                                      </DialogDescription>
                                    </DialogHeader>

                                    {/* Calendário */}
                                    <div className="space-y-6">
                                      <div className="flex items-center justify-between">
                                        <Button variant="outline" size="sm" onClick={previousMonth}>
                                          <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <h3 className="font-semibold text-lg">
                                          {currentMonth.toLocaleDateString("pt-BR", {
                                            month: "long",
                                            year: "numeric",
                                          })}
                                        </h3>
                                        <Button variant="outline" size="sm" onClick={nextMonth}>
                                          <ChevronRight className="h-4 w-4" />
                                        </Button>
                                      </div>

                                      <div className="grid grid-cols-7 gap-1 text-center">
                                        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                                          <div key={day} className="p-2 text-sm font-medium text-gray-500">
                                            {day}
                                          </div>
                                        ))}

                                        {generateCalendarDays(medico).map((day, index) => (
                                          <button
                                            key={index}
                                            onClick={() => (day.isAvailable ? setSelectedData(day.dateString) : null)}
                                            disabled={!day.isAvailable}
                                            className={`
                                              p-3 text-sm rounded-lg transition-all duration-200 font-medium
                                              ${!day.isCurrentMonth ? "text-gray-300" : ""}
                                              ${day.isToday ? "bg-blue-500 text-white shadow-lg" : ""}
                                              ${day.isAvailable && !day.isToday ? "bg-green-500 text-white hover:bg-green-600 cursor-pointer shadow-md" : ""}
                                              ${selectedData === day.dateString ? "bg-blue-600 text-white ring-2 ring-blue-300" : ""}
                                              ${day.isPast || (!day.isAvailable && !day.isToday) ? "cursor-not-allowed opacity-40 bg-gray-100" : ""}
                                            `}
                                          >
                                            {day.day}
                                          </button>
                                        ))}
                                      </div>

                                      {/* Horários disponíveis */}
                                      {selectedData && (
                                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                                          <Label className="text-gray-700 font-medium">
                                            Horários disponíveis para {formatarDataCurta(selectedData)}:
                                          </Label>
                                          <div className="grid grid-cols-3 gap-2">
                                            {getHorariosDisponiveis(medico, selectedData).map((horario) => (
                                              <Button
                                                key={horario}
                                                variant={selectedHorario === horario ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setSelectedHorario(horario)}
                                                className={
                                                  selectedHorario === horario
                                                    ? "bg-blue-600 hover:bg-blue-700"
                                                    : "hover:bg-blue-50"
                                                }
                                              >
                                                {horario}
                                              </Button>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {selectedData && selectedHorario && (
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                          <p className="text-sm text-blue-800 font-medium mb-2">
                                            <strong>Resumo do agendamento:</strong>
                                          </p>
                                          <div className="space-y-1 text-sm text-blue-700">
                                            <p>📅 Data: {formatarDataCurta(selectedData)}</p>
                                            <p>🕐 Horário: {selectedHorario}</p>
                                            <p>💰 Valor: R$ {medico.valor.toFixed(2)}</p>
                                          </div>
                                        </div>
                                      )}

                                      <Button
                                        onClick={handleAgendarConsulta}
                                        className="w-full bg-green-600 hover:bg-green-700 text-lg py-3"
                                        disabled={!selectedData || !selectedHorario}
                                      >
                                        <CheckCircle className="h-5 w-5 mr-2" />
                                        Confirmar Agendamento
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="consultas">
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Minhas Consultas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {minhasConsultas.map((consulta) => (
                        <div
                          key={consulta.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">{consulta.medico}</p>
                            <p className="text-sm text-gray-600">{consulta.especialidade}</p>
                            <p className="text-sm text-gray-600">
                              {formatarDataCurta(consulta.data)} às {consulta.hora}
                            </p>
                            <p className="text-sm text-green-600 font-medium">R$ {consulta.valor.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={`${getStatusColor(consulta.status)} text-white`}>{consulta.status}</Badge>
                            {(consulta.status === "agendada" || consulta.status === "confirmada") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelarConsulta(consulta.id)}
                                className="hover:bg-red-50 hover:text-red-600"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {minhasConsultas.length === 0 && (
                        <div className="text-center py-12">
                          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">Nenhuma consulta agendada</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
