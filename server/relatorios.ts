import * as XLSX from 'xlsx';

// Tipos para relatórios
export interface ReservaRelatorio {
  id: number;
  protocolo: string;
  areaNome: string;
  moradorNome: string;
  unidade: string;
  bloco: string;
  dataReserva: Date;
  horaInicio: string;
  horaFim: string;
  status: string;
  valor: string;
  createdAt: Date;
}

export interface EstatisticasArea {
  areaId: number;
  areaNome: string;
  totalReservas: number;
  reservasConfirmadas: number;
  reservasPendentes: number;
  reservasCanceladas: number;
  reservasUtilizadas: number;
  receitaTotal: number;
  taxaOcupacao: number;
}

export interface EstatisticasPeriodo {
  periodo: string;
  totalReservas: number;
  reservasConfirmadas: number;
  reservasCanceladas: number;
  receitaTotal: number;
}

// Função para gerar Excel
export function gerarExcelReservas(reservas: ReservaRelatorio[], titulo: string): Buffer {
  const workbook = XLSX.utils.book_new();
  
  // Dados formatados para Excel
  const dados = reservas.map(r => ({
    'Protocolo': r.protocolo,
    'Área': r.areaNome,
    'Morador': r.moradorNome,
    'Bloco': r.bloco || '-',
    'Unidade': r.unidade,
    'Data': new Date(r.dataReserva).toLocaleDateString('pt-BR'),
    'Horário': `${r.horaInicio} - ${r.horaFim}`,
    'Status': formatarStatus(r.status),
    'Valor': r.valor ? `R$ ${r.valor}` : 'Grátis',
    'Criada em': new Date(r.createdAt).toLocaleDateString('pt-BR'),
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(dados);
  
  // Ajustar largura das colunas
  worksheet['!cols'] = [
    { wch: 12 }, // Protocolo
    { wch: 20 }, // Área
    { wch: 25 }, // Morador
    { wch: 10 }, // Bloco
    { wch: 10 }, // Unidade
    { wch: 12 }, // Data
    { wch: 15 }, // Horário
    { wch: 12 }, // Status
    { wch: 12 }, // Valor
    { wch: 12 }, // Criada em
  ];
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reservas');
  
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

export function gerarExcelEstatisticas(
  estatisticasAreas: EstatisticasArea[],
  estatisticasPeriodo: EstatisticasPeriodo[],
  titulo: string
): Buffer {
  const workbook = XLSX.utils.book_new();
  
  // Aba de estatísticas por área
  const dadosAreas = estatisticasAreas.map(e => ({
    'Área': e.areaNome,
    'Total Reservas': e.totalReservas,
    'Confirmadas': e.reservasConfirmadas,
    'Pendentes': e.reservasPendentes,
    'Canceladas': e.reservasCanceladas,
    'Utilizadas': e.reservasUtilizadas,
    'Receita Total': `R$ ${e.receitaTotal.toFixed(2)}`,
    'Taxa Ocupação': `${e.taxaOcupacao.toFixed(1)}%`,
  }));
  
  const worksheetAreas = XLSX.utils.json_to_sheet(dadosAreas);
  worksheetAreas['!cols'] = [
    { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, worksheetAreas, 'Por Área');
  
  // Aba de estatísticas por período
  const dadosPeriodo = estatisticasPeriodo.map(e => ({
    'Período': e.periodo,
    'Total Reservas': e.totalReservas,
    'Confirmadas': e.reservasConfirmadas,
    'Canceladas': e.reservasCanceladas,
    'Receita Total': `R$ ${e.receitaTotal.toFixed(2)}`,
  }));
  
  const worksheetPeriodo = XLSX.utils.json_to_sheet(dadosPeriodo);
  worksheetPeriodo['!cols'] = [
    { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(workbook, worksheetPeriodo, 'Por Período');
  
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

// Função para gerar conteúdo PDF (retorna objeto para pdfmake)
export function gerarPDFContent(
  reservas: ReservaRelatorio[],
  estatisticasAreas: EstatisticasArea[],
  estatisticasPeriodo: EstatisticasPeriodo[],
  titulo: string,
  periodo: { inicio: string; fim: string },
  condominioNome: string
) {
  const totalReservas = reservas.length;
  const totalConfirmadas = reservas.filter(r => r.status === 'confirmada' || r.status === 'utilizada').length;
  const totalCanceladas = reservas.filter(r => r.status === 'cancelada').length;
  const receitaTotal = reservas.reduce((acc, r) => acc + (parseFloat(r.valor) || 0), 0);
  
  return {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [40, 60, 40, 60],
    
    header: {
      columns: [
        { text: condominioNome, style: 'headerLeft', margin: [40, 20, 0, 0] },
        { text: new Date().toLocaleDateString('pt-BR'), style: 'headerRight', margin: [0, 20, 40, 0] },
      ],
    },
    
    footer: function(currentPage: number, pageCount: number) {
      return {
        text: `Página ${currentPage} de ${pageCount}`,
        alignment: 'center',
        margin: [0, 20, 0, 0],
        fontSize: 9,
        color: '#666666',
      };
    },
    
    content: [
      // Título
      { text: titulo, style: 'titulo' },
      { text: `Período: ${periodo.inicio} a ${periodo.fim}`, style: 'subtitulo' },
      { text: ' ', margin: [0, 10, 0, 0] },
      
      // Resumo geral
      { text: 'Resumo Geral', style: 'secaoTitulo' },
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'Total de Reservas', style: 'cardLabel' },
              { text: totalReservas.toString(), style: 'cardValor' },
            ],
            style: 'card',
          },
          {
            width: '*',
            stack: [
              { text: 'Confirmadas/Utilizadas', style: 'cardLabel' },
              { text: totalConfirmadas.toString(), style: 'cardValorVerde' },
            ],
            style: 'card',
          },
          {
            width: '*',
            stack: [
              { text: 'Canceladas', style: 'cardLabel' },
              { text: totalCanceladas.toString(), style: 'cardValorVermelho' },
            ],
            style: 'card',
          },
          {
            width: '*',
            stack: [
              { text: 'Receita Total', style: 'cardLabel' },
              { text: `R$ ${receitaTotal.toFixed(2)}`, style: 'cardValorAzul' },
            ],
            style: 'card',
          },
        ],
        columnGap: 10,
        margin: [0, 10, 0, 20],
      },
      
      // Estatísticas por área
      { text: 'Estatísticas por Área', style: 'secaoTitulo' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Área', style: 'tableHeader' },
              { text: 'Total', style: 'tableHeader' },
              { text: 'Confirmadas', style: 'tableHeader' },
              { text: 'Canceladas', style: 'tableHeader' },
              { text: 'Receita', style: 'tableHeader' },
              { text: 'Ocupação', style: 'tableHeader' },
            ],
            ...estatisticasAreas.map(e => [
              e.areaNome,
              e.totalReservas.toString(),
              e.reservasConfirmadas.toString(),
              e.reservasCanceladas.toString(),
              `R$ ${e.receitaTotal.toFixed(2)}`,
              `${e.taxaOcupacao.toFixed(1)}%`,
            ]),
          ],
        },
        layout: {
          fillColor: function(rowIndex: number) {
            return rowIndex === 0 ? '#0d9488' : (rowIndex % 2 === 0 ? '#f8fafc' : null);
          },
          hLineWidth: function() { return 0.5; },
          vLineWidth: function() { return 0; },
          hLineColor: function() { return '#e2e8f0'; },
        },
        margin: [0, 10, 0, 20],
      },
      
      // Estatísticas por período
      { text: 'Evolução por Período', style: 'secaoTitulo' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Período', style: 'tableHeader' },
              { text: 'Total', style: 'tableHeader' },
              { text: 'Confirmadas', style: 'tableHeader' },
              { text: 'Canceladas', style: 'tableHeader' },
              { text: 'Receita', style: 'tableHeader' },
            ],
            ...estatisticasPeriodo.map(e => [
              e.periodo,
              e.totalReservas.toString(),
              e.reservasConfirmadas.toString(),
              e.reservasCanceladas.toString(),
              `R$ ${e.receitaTotal.toFixed(2)}`,
            ]),
          ],
        },
        layout: {
          fillColor: function(rowIndex: number) {
            return rowIndex === 0 ? '#0d9488' : (rowIndex % 2 === 0 ? '#f8fafc' : null);
          },
          hLineWidth: function() { return 0.5; },
          vLineWidth: function() { return 0; },
          hLineColor: function() { return '#e2e8f0'; },
        },
        margin: [0, 10, 0, 20],
      },
      
      // Lista de reservas (últimas 50)
      { text: 'Últimas Reservas', style: 'secaoTitulo', pageBreak: 'before' },
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Protocolo', style: 'tableHeader' },
              { text: 'Área', style: 'tableHeader' },
              { text: 'Morador', style: 'tableHeader' },
              { text: 'Data', style: 'tableHeader' },
              { text: 'Horário', style: 'tableHeader' },
              { text: 'Status', style: 'tableHeader' },
            ],
            ...reservas.slice(0, 50).map(r => [
              r.protocolo,
              r.areaNome,
              r.moradorNome.length > 20 ? r.moradorNome.substring(0, 20) + '...' : r.moradorNome,
              new Date(r.dataReserva).toLocaleDateString('pt-BR'),
              `${r.horaInicio}-${r.horaFim}`,
              formatarStatus(r.status),
            ]),
          ],
        },
        layout: {
          fillColor: function(rowIndex: number) {
            return rowIndex === 0 ? '#0d9488' : (rowIndex % 2 === 0 ? '#f8fafc' : null);
          },
          hLineWidth: function() { return 0.5; },
          vLineWidth: function() { return 0; },
          hLineColor: function() { return '#e2e8f0'; },
        },
        margin: [0, 10, 0, 20],
      },
    ],
    
    styles: {
      titulo: {
        fontSize: 22,
        bold: true,
        color: '#0f172a',
        margin: [0, 0, 0, 5],
      },
      subtitulo: {
        fontSize: 12,
        color: '#64748b',
        margin: [0, 0, 0, 10],
      },
      secaoTitulo: {
        fontSize: 14,
        bold: true,
        color: '#0f172a',
        margin: [0, 15, 0, 10],
      },
      headerLeft: {
        fontSize: 10,
        bold: true,
        color: '#0d9488',
      },
      headerRight: {
        fontSize: 10,
        color: '#64748b',
        alignment: 'right',
      },
      card: {
        margin: [0, 5, 0, 5],
      },
      cardLabel: {
        fontSize: 9,
        color: '#64748b',
      },
      cardValor: {
        fontSize: 20,
        bold: true,
        color: '#0f172a',
      },
      cardValorVerde: {
        fontSize: 20,
        bold: true,
        color: '#16a34a',
      },
      cardValorVermelho: {
        fontSize: 20,
        bold: true,
        color: '#dc2626',
      },
      cardValorAzul: {
        fontSize: 20,
        bold: true,
        color: '#0d9488',
      },
      tableHeader: {
        fontSize: 10,
        bold: true,
        color: '#ffffff',
        fillColor: '#0d9488',
        margin: [5, 8, 5, 8],
      },
    },
    
    defaultStyle: {
      fontSize: 10,
      color: '#334155',
    },
  };
}

function formatarStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pendente': 'Pendente',
    'confirmada': 'Confirmada',
    'cancelada': 'Cancelada',
    'utilizada': 'Utilizada',
  };
  return statusMap[status] || status;
}
