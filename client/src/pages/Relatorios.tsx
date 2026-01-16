import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  PieChart,
  Loader2,
  Building2,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Sparkles
} from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import * as XLSX from 'xlsx';

// Componente de gráfico de barras premium
function BarChartSimple({ data, labelKey, valueKey, color = "#0d9488", gradientTo = "#14b8a6" }: { 
  data: Record<string, unknown>[]; 
  labelKey: string; 
  valueKey: string;
  color?: string;
  gradientTo?: string;
}) {
  const maxValue = Math.max(...data.map(d => Number(d[valueKey]) || 0));
  
  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground truncate max-w-[200px] font-medium">{String(item[labelKey])}</span>
            <span className="font-bold">{Number(item[valueKey])}</span>
          </div>
          <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ 
                width: `${maxValue > 0 ? (Number(item[valueKey]) / maxValue) * 100 : 0}%`,
                background: `linear-gradient(90deg, ${color}, ${gradientTo})`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Relatorios() {
  const { user } = useAuth();
  const [condominioId, setCondominioId] = useState<number | null>(null);
  const [periodo, setPeriodo] = useState<'mes' | 'trimestre' | 'semestre' | 'ano'>('mes');
  const [areaId, setAreaId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Calcular datas baseado no período
  const { dataInicio, dataFim } = useMemo(() => {
    const hoje = new Date();
    let inicio: Date;
    
    switch (periodo) {
      case 'mes':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        break;
      case 'trimestre':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
        break;
      case 'semestre':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
        break;
      case 'ano':
        inicio = new Date(hoje.getFullYear(), 0, 1);
        break;
    }
    
    return { dataInicio: inicio, dataFim: hoje };
  }, [periodo]);
  
  // Queries
  const { data: condominios } = trpc.condominios.list.useQuery();
  const { data: areas } = trpc.areasComuns.list.useQuery(
    { condominioId: condominioId! },
    { enabled: !!condominioId }
  );
  
  const { data: relatorioData, isLoading } = trpc.relatorios.getDados.useQuery(
    { 
      condominioId: condominioId!, 
      dataInicio, 
      dataFim,
      areaId: areaId || undefined
    },
    { enabled: !!condominioId }
  );
  
  // Selecionar primeiro condomínio automaticamente
  if (condominios && condominios.length > 0 && !condominioId) {
    setCondominioId(condominios[0].id);
  }
  
  // Calcular totais
  const totais = useMemo(() => {
    if (!relatorioData) return { reservas: 0, confirmadas: 0, canceladas: 0, receita: 0 };
    
    const reservas = relatorioData.reservas.length;
    const confirmadas = relatorioData.reservas.filter(r => r.status === 'confirmada' || r.status === 'utilizada').length;
    const canceladas = relatorioData.reservas.filter(r => r.status === 'cancelada').length;
    const receita = relatorioData.reservas
      .filter(r => r.status === 'confirmada' || r.status === 'utilizada')
      .reduce((acc, r) => acc + (parseFloat(r.valor || '0')), 0);
    
    return { reservas, confirmadas, canceladas, receita };
  }, [relatorioData]);
  
  // Exportar para Excel
  const exportarExcel = () => {
    if (!relatorioData || !condominios) return;
    
    setIsExporting(true);
    
    try {
      const workbook = XLSX.utils.book_new();
      const condominio = condominios.find(c => c.id === condominioId);
      
      // Aba de reservas
      const dadosReservas = relatorioData.reservas.map(r => ({
        'Protocolo': r.protocolo,
        'Área': r.areaNome || '-',
        'Morador': r.moradorNome || '-',
        'Bloco': r.bloco || '-',
        'Unidade': r.unidade || '-',
        'Data': r.dataReserva ? new Date(r.dataReserva).toLocaleDateString('pt-BR') : '-',
        'Horário': `${r.horaInicio} - ${r.horaFim}`,
        'Status': formatarStatus(r.status),
        'Valor': r.valor ? `R$ ${r.valor}` : 'Grátis',
      }));
      
      const wsReservas = XLSX.utils.json_to_sheet(dadosReservas);
      wsReservas['!cols'] = [
        { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 10 },
        { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 12 }
      ];
      XLSX.utils.book_append_sheet(workbook, wsReservas, 'Reservas');
      
      // Aba de estatísticas por área
      const dadosAreas = relatorioData.estatisticasAreas.map(e => ({
        'Área': e.areaNome,
        'Total Reservas': e.totalReservas,
        'Confirmadas': e.reservasConfirmadas,
        'Pendentes': e.reservasPendentes,
        'Canceladas': e.reservasCanceladas,
        'Utilizadas': e.reservasUtilizadas,
        'Receita Total': `R$ ${e.receitaTotal.toFixed(2)}`,
        'Taxa Ocupação': `${e.taxaOcupacao.toFixed(1)}%`,
      }));
      
      const wsAreas = XLSX.utils.json_to_sheet(dadosAreas);
      wsAreas['!cols'] = [
        { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }
      ];
      XLSX.utils.book_append_sheet(workbook, wsAreas, 'Por Área');
      
      // Aba de estatísticas por período
      const dadosPeriodo = relatorioData.estatisticasPeriodo.map(e => ({
        'Período': e.periodo,
        'Total Reservas': e.totalReservas,
        'Confirmadas': e.reservasConfirmadas,
        'Canceladas': e.reservasCanceladas,
        'Receita Total': `R$ ${e.receitaTotal.toFixed(2)}`,
      }));
      
      const wsPeriodo = XLSX.utils.json_to_sheet(dadosPeriodo);
      wsPeriodo['!cols'] = [
        { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(workbook, wsPeriodo, 'Por Período');
      
      // Download
      const fileName = `relatorio_${condominio?.nome?.replace(/\s+/g, '_') || 'reservas'}_${dataInicio.toISOString().split('T')[0]}_${dataFim.toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Exportar para PDF (usando impressão do navegador)
  const exportarPDF = () => {
    window.print();
  };
  
  const formatarStatus = (status: string) => {
    const map: Record<string, string> = {
      'pendente': 'Pendente',
      'confirmada': 'Confirmada',
      'cancelada': 'Cancelada',
      'utilizada': 'Utilizada',
    };
    return map[status] || status;
  };
  
  const periodoLabel = {
    'mes': 'Último Mês',
    'trimestre': 'Último Trimestre',
    'semestre': 'Último Semestre',
    'ano': 'Último Ano',
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in print:p-0">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-red-500/5 p-8 border border-amber-500/10 print:hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-600">Análise de Dados</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
              <p className="text-muted-foreground">
                Análise de utilização das áreas comuns
              </p>
            </div>
            
            <div className="flex gap-3 self-start md:self-center">
              <Button 
                variant="outline" 
                onClick={exportarPDF}
                disabled={!relatorioData || isLoading}
                className="rounded-xl gap-2 border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/30"
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
              <Button 
                onClick={exportarExcel}
                disabled={!relatorioData || isLoading || isExporting}
                className="btn-premium"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                )}
                Excel
              </Button>
            </div>
          </div>
        </div>
        
        {/* Premium Filtros */}
        <Card className="glass-card print:hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Condomínio</label>
                <Select 
                  value={condominioId?.toString() || ''} 
                  onValueChange={(v) => {
                    setCondominioId(Number(v));
                    setAreaId(null);
                  }}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {condominios?.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Período</label>
                <Select value={periodo} onValueChange={(v) => setPeriodo(v as typeof periodo)}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mes">Último Mês</SelectItem>
                    <SelectItem value="trimestre">Último Trimestre</SelectItem>
                    <SelectItem value="semestre">Último Semestre</SelectItem>
                    <SelectItem value="ano">Último Ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Área (opcional)</label>
                <Select 
                  value={areaId?.toString() || 'todas'} 
                  onValueChange={(v) => setAreaId(v === 'todas' ? null : Number(v))}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Todas as áreas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as áreas</SelectItem>
                    {areas?.map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>
                        {a.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Título para impressão */}
        <div className="hidden print:block text-center mb-8">
          <h1 className="text-2xl font-bold">Relatório de Reservas</h1>
          <p className="text-muted-foreground">
            {condominios?.find(c => c.id === condominioId)?.nome} • {periodoLabel[periodo]}
          </p>
          <p className="text-sm text-muted-foreground">
            {dataInicio.toLocaleDateString('pt-BR')} a {dataFim.toLocaleDateString('pt-BR')}
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !condominioId ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Building2 className="h-10 w-10" />
            </div>
            <h3>Selecione um condomínio</h3>
            <p>Escolha um condomínio para visualizar os relatórios</p>
          </div>
        ) : (
          <>
            {/* Premium Cards de resumo */}
            <div className="grid gap-5 md:grid-cols-4">
              <Card className="premium-card-interactive group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Reservas
                  </CardTitle>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totais.reservas}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    no período selecionado
                  </p>
                </CardContent>
              </Card>
              
              <Card className="premium-card-interactive group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Confirmadas
                  </CardTitle>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600">{totais.confirmadas}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totais.reservas > 0 ? ((totais.confirmadas / totais.reservas) * 100).toFixed(1) : 0}% do total
                  </p>
                </CardContent>
              </Card>
              
              <Card className="premium-card-interactive group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Canceladas
                  </CardTitle>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{totais.canceladas}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totais.reservas > 0 ? ((totais.canceladas / totais.reservas) * 100).toFixed(1) : 0}% do total
                  </p>
                </CardContent>
              </Card>
              
              <Card className="premium-card-interactive group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Receita Total
                  </CardTitle>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600">
                    R$ {totais.receita.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    reservas confirmadas
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Premium Gráficos */}
            <div className="grid gap-5 md:grid-cols-2">
              {/* Reservas por área */}
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">Reservas por Área</CardTitle>
                      <CardDescription>
                        Distribuição entre as áreas comuns
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {relatorioData?.estatisticasAreas && relatorioData.estatisticasAreas.length > 0 ? (
                    <BarChartSimple 
                      data={relatorioData.estatisticasAreas}
                      labelKey="areaNome"
                      valueKey="totalReservas"
                      color="#0d9488"
                      gradientTo="#14b8a6"
                    />
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum dado disponível
                    </p>
                  )}
                </CardContent>
              </Card>
              
              {/* Receita por área */}
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">Receita por Área</CardTitle>
                      <CardDescription>
                        Receita gerada por cada área
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {relatorioData?.estatisticasAreas && relatorioData.estatisticasAreas.length > 0 ? (
                    <BarChartSimple 
                      data={relatorioData.estatisticasAreas}
                      labelKey="areaNome"
                      valueKey="receitaTotal"
                      color="#16a34a"
                      gradientTo="#22c55e"
                    />
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum dado disponível
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Premium Tabela de estatísticas por área */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Estatísticas Detalhadas por Área</CardTitle>
                <CardDescription>
                  Visão completa de cada área comum
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border border-border/50">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30">
                        <th className="text-left py-4 px-4 font-semibold">Área</th>
                        <th className="text-center py-4 px-3 font-semibold">Total</th>
                        <th className="text-center py-4 px-3 font-semibold">Confirmadas</th>
                        <th className="text-center py-4 px-3 font-semibold">Pendentes</th>
                        <th className="text-center py-4 px-3 font-semibold">Canceladas</th>
                        <th className="text-right py-4 px-3 font-semibold">Receita</th>
                        <th className="text-right py-4 px-4 font-semibold">Ocupação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatorioData?.estatisticasAreas?.map((e, i) => (
                        <tr key={i} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-4 font-medium">{e.areaNome}</td>
                          <td className="text-center py-4 px-3">{e.totalReservas}</td>
                          <td className="text-center py-4 px-3">
                            <span className="badge-success">{e.reservasConfirmadas}</span>
                          </td>
                          <td className="text-center py-4 px-3">
                            <span className="badge-warning">{e.reservasPendentes}</span>
                          </td>
                          <td className="text-center py-4 px-3">
                            <span className="badge-destructive">{e.reservasCanceladas}</span>
                          </td>
                          <td className="text-right py-4 px-3 font-semibold text-emerald-600">R$ {e.receitaTotal.toFixed(2)}</td>
                          <td className="text-right py-4 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 font-medium text-xs">
                              {e.taxaOcupacao.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(!relatorioData?.estatisticasAreas || relatorioData.estatisticasAreas.length === 0) && (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-muted-foreground">
                            Nenhum dado disponível para o período selecionado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            {/* Premium Evolução por período */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Evolução por Período</CardTitle>
                <CardDescription>
                  Histórico de reservas ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border border-border/50">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30">
                        <th className="text-left py-4 px-4 font-semibold">Período</th>
                        <th className="text-center py-4 px-3 font-semibold">Total</th>
                        <th className="text-center py-4 px-3 font-semibold">Confirmadas</th>
                        <th className="text-center py-4 px-3 font-semibold">Canceladas</th>
                        <th className="text-right py-4 px-4 font-semibold">Receita</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatorioData?.estatisticasPeriodo?.map((e, i) => (
                        <tr key={i} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-4 font-medium">{e.periodo}</td>
                          <td className="text-center py-4 px-3">{e.totalReservas}</td>
                          <td className="text-center py-4 px-3">
                            <span className="badge-success">{e.reservasConfirmadas}</span>
                          </td>
                          <td className="text-center py-4 px-3">
                            <span className="badge-destructive">{e.reservasCanceladas}</span>
                          </td>
                          <td className="text-right py-4 px-4 font-semibold text-emerald-600">R$ {e.receitaTotal.toFixed(2)}</td>
                        </tr>
                      ))}
                      {(!relatorioData?.estatisticasPeriodo || relatorioData.estatisticasPeriodo.length === 0) && (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-muted-foreground">
                            Nenhum dado disponível para o período selecionado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
